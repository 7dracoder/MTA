# NYC MTA Transit App (Backend)

Python/Flask REST API with SQLite cache and Firebase auth.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
Create `backend/.env` with at least `MTA_API_KEY` (see Environment Variables). Add Firebase Admin by placing **`firebase-service-account.json`** in the `backend/` folder (same directory as `run.py`) or set **`FIREBASE_CREDENTIALS_PATH`** to the JSON file path.
```

## Run

```bash
python run.py
```

API available at `http://localhost:5000`.

## Environment Variables

| Variable | Description |
|---|---|
| `MTA_API_KEY` | Your MTA API key from https://api.mta.info |
| `FIREBASE_CREDENTIALS_PATH` | Path to Firebase **service account** JSON (Admin SDK). Default: `firebase-service-account.json` next to `run.py`. Required for `/api/favorites` and other authenticated routes. |
| `SECRET_KEY` | Flask secret key (any random string) |
| `DATABASE_URL` | SQLite path (default: `sqlite:///mta_transit.db`) |

## Run Tests

```bash
pytest --cov=app tests/
```

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/status | No | All service statuses |
| GET | /api/status/:route_id | No | Single route status |
| GET | /api/vehicles | No | All vehicle positions |
| GET | /api/stations/:station_id | No | Station detail |
| GET | /api/accessibility/:station_id | No | Elevator/escalator status |
| GET | /api/accessibility?operational_only=true | No | Fully accessible stations |
| GET | /api/favorites | Yes | User's favorites |
| POST | /api/favorites | Yes | Add favorite |
| DELETE | /api/favorites/:id | Yes | Remove favorite |
| PATCH | /api/favorites/:id/alerts | Yes | Toggle alerts |
