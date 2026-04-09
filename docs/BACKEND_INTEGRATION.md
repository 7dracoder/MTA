# Backend integration: Firebase Auth + user data (SQLite)

This document is the contract between the **React frontend** (NYC Transit Hub) and the **Flask + SQLite** backend. The frontend uses **Firebase Authentication (Email/Password only)** for identity. **Favorites and alert preferences** are stored in SQLite on the server, keyed by the Firebase user id (`uid`).

## Public transit endpoints (unchanged)

These routes do **not** require authentication:

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/status` | Service status list (existing shape expected by the SPA). |
| `GET` | `/api/vehicles` | Vehicle positions for the map. |

Enable **CORS** for browser access from local Vite (`http://localhost:5173` or your dev port) and your production origin (e.g. Vercel). No `Authorization` header is required for these routes.

## Authenticated user endpoints

All requests below must include:

```http
Authorization: Bearer <Firebase ID token>
```

The token is the Firebase **ID token** (JWT) from the signed-in user (`user.getIdToken()` on the client).

### Verify the token (Flask)

1. Add the **Firebase Admin SDK** for Python (`firebase-admin`).
2. Initialize once with a **service account** JSON (from Firebase Console → Project settings → Service accounts), via environment variable such as `FIREBASE_SERVICE_ACCOUNT_JSON` (full JSON string) or a file path your deployment provides.
3. On each protected request, read the `Authorization` header, extract the bearer token, and call `auth.verify_id_token(token)`. Use the returned `uid` as the primary key for user rows in SQLite.

If the token is missing, invalid, or expired, respond with **`401 Unauthorized`** and a JSON body such as:

```json
{ "message": "Invalid or expired token" }
```

### `GET /api/me/favorites`

Returns the current user’s favorite GTFS `route_id` values.

**Response 200**

```json
{
  "route_ids": ["A", "1", "B44"]
}
```

If the user has no row yet, return **`200`** with `{ "route_ids": [] }` (recommended) or **`404`**; the frontend treats **`404`** as “empty favorites” as well.

### `PUT /api/me/favorites`

Replaces the full favorites list (idempotent per payload).

**Request body**

```json
{
  "route_ids": ["A", "1"]
}
```

**Response** `200` or `204` with an empty body is acceptable.

### `GET /api/me/alert-preferences`

**Response 200**

```json
{
  "notify_minor": true,
  "notify_major": true
}
```

If no row exists, return defaults **`false`** for both booleans, or **`404`** (the frontend treats **`404`** as defaults).

### `PUT /api/me/alert-preferences`

**Request body**

```json
{
  "notify_minor": true,
  "notify_major": false
}
```

**Response** `200` or `204`.

## Suggested SQLite schema

You can normalize or store JSON; one minimal approach:

```sql
CREATE TABLE user_profile (
  firebase_uid TEXT PRIMARY KEY,
  favorites_json TEXT NOT NULL DEFAULT '[]',
  notify_minor INTEGER NOT NULL DEFAULT 0,
  notify_major INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
```

- `favorites_json`: JSON array of strings, e.g. `["A","1"]`.
- Booleans as `0`/`1` integers.

Alternatively, use a join table `user_favorite_route (firebase_uid, route_id)` with a composite primary key.

## CORS requirements

For the SPA to send `Authorization`:

- Allow **origins**: dev (`http://localhost:5173`) and production (e.g. `https://your-app.vercel.app`).
- Allow **methods**: at least `GET`, `PUT`, `OPTIONS`.
- Allow **headers**: `Authorization`, `Content-Type`, `Accept`.

## Security notes

- Never trust the client to send a `uid` in the body; always derive `uid` from the verified ID token.
- Keep the Firebase **service account** private on the server only.
- Rate-limit user endpoints if needed to reduce abuse.

## Frontend environment

- `VITE_API_BASE_URL`: Flask base URL (no trailing slash).
- `VITE_FIREBASE_*`: Web app config for client-side sign-in only.

The frontend does **not** use Firestore for favorites; all persistence for favorites and alert preferences goes through the Flask API above.
