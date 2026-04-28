/**
 * Determines which direction to take a subway line and returns the terminal
 * station name as the "toward" label — e.g. "Take the A toward Far Rockaway".
 *
 * Strategy:
 *   1. Each line has a known primary axis (mostly N-S or E-W).
 *   2. We compare origin lat/lon to destination lat/lon along that axis.
 *   3. We return the terminal in the direction of travel.
 *
 * Terminal data derived from MTA GTFS static stops.txt (northernmost /
 * southernmost / easternmost / westernmost station per route).
 */

export interface DirectionInfo {
  toward: string        // terminal station name
  direction: string     // "Uptown" | "Downtown" | "Queens-bound" | etc.
}

// Primary axis for each line: 'NS' = north-south dominant, 'EW' = east-west dominant
const LINE_AXIS: Record<string, 'NS' | 'EW'> = {
  '1': 'NS', '2': 'NS', '3': 'NS',
  '4': 'NS', '5': 'NS', '6': 'NS', '6X': 'NS',
  'A': 'NS', 'C': 'NS', 'E': 'EW',
  'B': 'NS', 'D': 'NS', 'F': 'NS', 'M': 'EW',
  'G': 'NS',
  'J': 'EW', 'Z': 'EW',
  'L': 'EW',
  'N': 'NS', 'Q': 'NS', 'R': 'NS', 'W': 'NS',
  '7': 'EW', '7X': 'EW',
  'GS': 'EW', 'FS': 'EW',
  'SI': 'NS',
}

// Terminal stations per line: [northOrEast terminal, southOrWest terminal]
// Format: [high-end terminal, low-end terminal]
// "high" = north (for NS lines) or east (for EW lines)
const LINE_TERMINALS: Record<string, [string, string]> = {
  '1':   ['Van Cortlandt Park-242 St', 'South Ferry'],
  '2':   ['Wakefield-241 St', 'Flatbush Av-Brooklyn College'],
  '3':   ['Harlem-148 St', 'New Lots Av'],
  '4':   ['Woodlawn', 'Utica Av'],
  '5':   ['Eastchester-Dyre Av', 'Flatbush Av-Brooklyn College'],
  '6':   ['Pelham Bay Park', 'Brooklyn Bridge-City Hall'],
  '6X':  ['Pelham Bay Park', 'Brooklyn Bridge-City Hall'],
  'A':   ['Inwood-207 St', 'Far Rockaway-Mott Av'],
  'C':   ['168 St', 'Euclid Av'],
  'E':   ['Jamaica Center-Parsons/Archer', 'World Trade Center'],
  'B':   ['145 St', 'Brighton Beach'],
  'D':   ['Norwood-205 St', 'Coney Island-Stillwell Av'],
  'F':   ['Lexington Av/63 St', 'Coney Island-Stillwell Av'],
  'M':   ['Forest Hills-71 Av', 'Middle Village-Metropolitan Av'],
  'G':   ['Court Sq', 'Church Av'],
  'J':   ['Jamaica Center-Parsons/Archer', 'Broad St'],
  'Z':   ['Jamaica Center-Parsons/Archer', 'Broad St'],
  'L':   ['8 Av', 'Canarsie-Rockaway Pkwy'],
  'N':   ['96 St', 'Coney Island-Stillwell Av'],
  'Q':   ['96 St', 'Coney Island-Stillwell Av'],
  'R':   ['Forest Hills-71 Av', 'Bay Ridge-95 St'],
  'W':   ['Astoria-Ditmars Blvd', 'Whitehall St-South Ferry'],
  '7':   ['Flushing-Main St', 'Hudson Yards'],
  '7X':  ['Flushing-Main St', 'Hudson Yards'],
  'GS':  ['Times Sq-42 St', 'Grand Central-42 St'],
  'FS':  ['Franklin Av', 'Prospect Park'],
  'SI':  ['St George', 'Tottenville'],
}

// Human-readable direction labels
const DIRECTION_LABELS: Record<string, [string, string]> = {
  '1': ['Uptown', 'Downtown'],
  '2': ['Uptown', 'Downtown/Brooklyn'],
  '3': ['Uptown', 'Brooklyn'],
  '4': ['Uptown/Bronx', 'Downtown/Brooklyn'],
  '5': ['Uptown/Bronx', 'Downtown/Brooklyn'],
  '6': ['Uptown/Bronx', 'Downtown'],
  '6X': ['Uptown/Bronx', 'Downtown'],
  'A': ['Uptown', 'Downtown/Rockaway'],
  'C': ['Uptown', 'Downtown/Brooklyn'],
  'E': ['Queens-bound', 'Downtown'],
  'B': ['Uptown', 'Brooklyn'],
  'D': ['Uptown/Bronx', 'Brooklyn'],
  'F': ['Uptown/Queens', 'Brooklyn'],
  'M': ['Queens-bound', 'Brooklyn'],
  'G': ['Queens-bound', 'Brooklyn'],
  'J': ['Queens-bound', 'Downtown'],
  'Z': ['Queens-bound', 'Downtown'],
  'L': ['8 Av-bound', 'Canarsie-bound'],
  'N': ['Uptown/Queens', 'Brooklyn'],
  'Q': ['Uptown', 'Brooklyn'],
  'R': ['Queens-bound', 'Brooklyn'],
  'W': ['Queens-bound', 'Downtown'],
  '7': ['Flushing-bound', 'Manhattan-bound'],
  '7X': ['Flushing-bound', 'Manhattan-bound'],
  'GS': ['Grand Central-bound', 'Times Sq-bound'],
  'FS': ['Prospect Park-bound', 'Franklin Av-bound'],
  'SI': ['Tottenville-bound', 'St George-bound'],
}

/**
 * Given a route and origin/destination coordinates, return the direction info.
 *
 * @param routeId  MTA route_id (e.g. "A", "1", "7")
 * @param originLat  latitude of origin station
 * @param originLon  longitude of origin station
 * @param destLat    latitude of destination station
 * @param destLon    longitude of destination station
 */
export function getDirection(
  routeId: string,
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number,
): DirectionInfo {
  const terminals = LINE_TERMINALS[routeId]
  const labels = DIRECTION_LABELS[routeId]
  const axis = LINE_AXIS[routeId] ?? 'NS'

  if (!terminals || !labels) {
    return { toward: `${routeId} terminal`, direction: 'Check direction' }
  }

  // Determine if we're going "high" (north/east) or "low" (south/west)
  const goingHigh = axis === 'NS'
    ? destLat > originLat
    : destLon > originLon   // EW: east = higher longitude

  return {
    toward: goingHigh ? terminals[0] : terminals[1],
    direction: goingHigh ? labels[0] : labels[1],
  }
}
