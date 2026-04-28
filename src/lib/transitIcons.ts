/**
 * Creates custom Leaflet DivIcon markers that show the MTA route name
 * in the correct MTA line color, matching the real subway bullet style.
 */
import L from 'leaflet'

// Official MTA subway line colors
const ROUTE_COLORS: Record<string, { bg: string; text: string }> = {
  // IRT Broadway–7th Ave (red)
  '1': { bg: '#EE352E', text: '#fff' },
  '2': { bg: '#EE352E', text: '#fff' },
  '3': { bg: '#EE352E', text: '#fff' },
  // IRT Lexington Ave (green)
  '4': { bg: '#00933C', text: '#fff' },
  '5': { bg: '#00933C', text: '#fff' },
  '6': { bg: '#00933C', text: '#fff' },
  '6X': { bg: '#00933C', text: '#fff' },
  // Flushing (purple)
  '7': { bg: '#B933AD', text: '#fff' },
  '7X': { bg: '#B933AD', text: '#fff' },
  // 8th Ave (blue)
  'A': { bg: '#0039A6', text: '#fff' },
  'C': { bg: '#0039A6', text: '#fff' },
  'E': { bg: '#0039A6', text: '#fff' },
  // 6th Ave (orange)
  'B': { bg: '#FF6319', text: '#fff' },
  'D': { bg: '#FF6319', text: '#fff' },
  'F': { bg: '#FF6319', text: '#fff' },
  'M': { bg: '#FF6319', text: '#fff' },
  // Crosstown (light green)
  'G': { bg: '#6CBE45', text: '#fff' },
  // Canarsie (grey)
  'L': { bg: '#A7A9AC', text: '#fff' },
  // Nassau (brown)
  'J': { bg: '#996633', text: '#fff' },
  'Z': { bg: '#996633', text: '#fff' },
  // Broadway (yellow)
  'N': { bg: '#FCCC0A', text: '#000' },
  'Q': { bg: '#FCCC0A', text: '#000' },
  'R': { bg: '#FCCC0A', text: '#000' },
  'W': { bg: '#FCCC0A', text: '#000' },
  // 42nd St Shuttle (dark grey)
  'GS': { bg: '#808183', text: '#fff' },
  'FS': { bg: '#808183', text: '#fff' },
  'H': { bg: '#808183', text: '#fff' },
  // SIR (blue)
  'SI': { bg: '#0039A6', text: '#fff' },
}

const DEFAULT_COLOR = { bg: '#555', text: '#fff' }

// Cache icons so we don't recreate the same one for every marker
const _iconCache = new Map<string, L.DivIcon>()

export function getRouteIcon(routeId: string): L.DivIcon {
  const key = routeId
  if (_iconCache.has(key)) return _iconCache.get(key)!

  const { bg, text } = ROUTE_COLORS[routeId] ?? DEFAULT_COLOR

  // Short label: strip trailing X/+ for display (7X → 7, M15+ → M15)
  const label = routeId.replace(/[X+]$/, '').slice(0, 3)

  const size = 26
  const html = `
    <div style="
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:${bg};
      color:${text};
      display:flex;
      align-items:center;
      justify-content:center;
      font-family:'Helvetica Neue',Arial,sans-serif;
      font-size:${label.length > 2 ? '9' : '11'}px;
      font-weight:700;
      border:2px solid rgba(255,255,255,0.85);
      box-shadow:0 1px 4px rgba(0,0,0,0.5);
      cursor:pointer;
      user-select:none;
    ">${label}</div>`

  const icon = L.divIcon({
    html,
    className: '',          // suppress Leaflet's default white box
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  })

  _iconCache.set(key, icon)
  return icon
}
