"""Tests for GET /api/status endpoints."""
from datetime import datetime
from app.extensions import db
from app.models import ServiceStatus


def _seed_status(app):
    with app.app_context():
        db.session.add(ServiceStatus(
            route_id="A",
            route_name="A Train",
            status="Delays",
            alert_text="Signal problems at Jay St",
            fetched_at=datetime.utcnow(),
        ))
        db.session.commit()


def test_all_statuses_empty(client):
    resp = client.get("/api/status")
    assert resp.status_code == 200
    assert resp.json["data"] == []


def test_all_statuses_returns_data(app, client):
    _seed_status(app)
    resp = client.get("/api/status")
    assert resp.status_code == 200
    assert len(resp.json["data"]) >= 1
    assert resp.json["data"][0]["route_id"] == "A"


def test_single_route_found(app, client):
    _seed_status(app)
    resp = client.get("/api/status/A")
    assert resp.status_code == 200
    assert resp.json["data"]["status"] == "Delays"
    # Fields the frontend api.ts toRouteStatus() mapper depends on
    assert resp.json["data"]["severity"] == "minor"
    assert "summary" in resp.json["data"]


def test_single_route_not_found(client):
    resp = client.get("/api/status/ZZZZ")
    assert resp.status_code == 404
