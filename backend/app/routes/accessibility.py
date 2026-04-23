from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from ..models import AccessibilityStatus

bp = Blueprint("accessibility", __name__, url_prefix="/api")

STALE_THRESHOLD = timedelta(minutes=5)


@bp.route("/accessibility/<station_id>")
def station_accessibility(station_id):
    rows = AccessibilityStatus.query.filter_by(station_id=station_id).all()
    if not rows:
        return jsonify({"error": "No accessibility data for this station"}), 404

    fetched_at = max(r.fetched_at for r in rows)
    stale = (datetime.utcnow() - fetched_at) > STALE_THRESHOLD
    return jsonify({"data": [r.to_dict() for r in rows], "stale": stale})


@bp.route("/accessibility")
def accessible_stations():
    """Return stations where ALL equipment is Operational (for the filterable list)."""
    fully_operational = request.args.get("operational_only", "false").lower() == "true"

    if fully_operational:
        # Stations that have at least one non-operational piece of equipment
        from sqlalchemy import func
        from ..extensions import db

        non_op = (
            db.session.query(AccessibilityStatus.station_id)
            .filter(AccessibilityStatus.status != "Operational")
            .subquery()
        )
        rows = (
            AccessibilityStatus.query
            .filter(~AccessibilityStatus.station_id.in_(non_op))
            .all()
        )
    else:
        rows = AccessibilityStatus.query.all()

    return jsonify({"data": [r.to_dict() for r in rows]})
