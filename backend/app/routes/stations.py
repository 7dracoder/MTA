"""
Station detail endpoint.

The MTA GTFS static feed contains full station data. For this implementation
we serve what we have cached (service status + accessibility) and note that
a full GTFS static import can be added in a future task.
"""
from datetime import datetime, timedelta
from flask import Blueprint, jsonify
from ..models import ServiceStatus, AccessibilityStatus

bp = Blueprint("stations", __name__, url_prefix="/api")

STALE_THRESHOLD = timedelta(minutes=5)


@bp.route("/stations/<station_id>")
def station_detail(station_id):
    # Service status rows that mention this station (route-level for now)
    status_rows = ServiceStatus.query.all()

    # Accessibility equipment at this station
    access_rows = AccessibilityStatus.query.filter_by(station_id=station_id).all()

    stale = False
    if access_rows:
        fetched_at = max(r.fetched_at for r in access_rows)
        stale = (datetime.utcnow() - fetched_at) > STALE_THRESHOLD

    return jsonify({
        "station_id": station_id,
        "service_statuses": [r.to_dict() for r in status_rows],
        "accessibility": [r.to_dict() for r in access_rows],
        "stale": stale,
    })
