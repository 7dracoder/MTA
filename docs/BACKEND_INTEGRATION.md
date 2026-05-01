# Backend integration: Firebase Auth + favorites API

The React app uses **Firebase Authentication (email/password)** in the browser. The **Flask** API verifies **Firebase ID tokens** and stores per-user data in **SQLite**.

## Public endpoints (no `Authorization` header)

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/status` | Returns `{ "data": [...], "stale": bool }`. Each row includes `route_id`, `route_name`, `status`, `summary`, `severity`, etc. |
| `GET` | `/api/vehicles` | Vehicle positions (shape expected by the SPA map). |

Other blueprints (`/api/stations`, `/api/accessibility`, …) may exist for future UI.

## Authenticated favorites

All routes below require:

```http
Authorization: Bearer <Firebase ID token>
```

If Firebase Admin is not configured on the server, responses may be **`503`** with `{ "error": "Auth service not configured" }`.

### Fixing “Auth service not configured” (503)

The Flask app only enables token verification after **Firebase Admin SDK** starts with a **service account** file (this is separate from the Web `VITE_FIREBASE_*` keys in the frontend).

1. In [Firebase Console](https://console.firebase.google.com) → your project → **Project settings** (gear) → **Service accounts**.
2. Click **Generate new private key** and download the JSON file.
3. Save it as **`backend/firebase-service-account.json`** (run `python run.py` from the `backend` folder so the default relative path resolves), **or** set in **`backend/.env`**:

   ```env
   FIREBASE_CREDENTIALS_PATH=/absolute/path/to/your-service-account.json
   ```

4. Restart Flask (`python run.py`). You should see a log line that Admin SDK initialized.

Until this is done, **`GET /api/favorites`** and other `@verify_token` routes return **503**; the dashboard and public `/api/status` can still work.

### Verify tokens (Flask)

Use **Firebase Admin SDK** with a service account JSON file (see `backend/app/firebase.py` and `FIREBASE_CREDENTIALS_PATH`). The decorator sets `g.firebase_uid` and `g.email` from the decoded token.

### `GET /api/favorites`

Returns every favorite for the current user.

**200**

```json
{
  "data": [
    {
      "id": 1,
      "item_type": "route",
      "item_id": "A",
      "item_name": "A - Eighth Avenue Express",
      "alerts_enabled": false,
      "created_at": "2026-01-01T12:00:00"
    }
  ]
}
```

The SPA filters `item_type === "route"` for the service-status stars. `item_id` is the GTFS `route_id`.

### `POST /api/favorites`

Creates one favorite.

**Body**

```json
{
  "item_type": "route",
  "item_id": "A",
  "item_name": "A - Eighth Avenue Express"
}
```

`item_type` must be `"route"` or `"station"`. All three fields are required.

**201** — `{ "data": { ...same shape as list element... } }`

**409** — `{ "error": "Already in favorites" }` (duplicate `user_id` + `item_id`). The client refetches the list.

### `DELETE /api/favorites/<int:favorite_id>`

Deletes a row owned by the user.

**200** — `{ "message": "Removed" }`

**404** — favorite not found or not owned.

### `PATCH /api/favorites/<int:favorite_id>/alerts`

Toggles in-app alert tracking for that favorite (used for status-change banners on the dashboard).

**Body**

```json
{ "alerts_enabled": true }
```

**200** — `{ "data": { ...updated favorite... } }`

## CORS

`flask-cors` is enabled app-wide. For production, tighten origins to your Vercel URL and local dev. Expose support for **`Authorization`** and **`Content-Type`** on preflight.

## Frontend environment

| Variable | Role |
|----------|------|
| `VITE_API_BASE_URL` | Flask base URL (no trailing slash), e.g. `http://localhost:5000` |
| `VITE_FIREBASE_*` | Firebase **Web** SDK config (client sign-in only) |

## Error JSON

Errors often use the `error` key (not only `message`). The SPA reads both when surfacing `UserApiError`.
