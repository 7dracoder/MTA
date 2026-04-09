# NYC Transit Hub (frontend)

React + TypeScript + Tailwind CSS + Leaflet (OpenStreetMap) SPA for the NYC Transit Hub API.

## Setup

```bash
npm install
cp .env.example .env
# Set VITE_API_BASE_URL and all VITE_FIREBASE_* values (see Environment below)
npm run dev
```

## Environment

| Variable                         | Description |
| -------------------------------- | ----------- |
| `VITE_API_BASE_URL`              | Base URL of the Flask backend (no trailing slash) |
| `VITE_USE_MOCK_DATA`             | Set to `true` to load built-in practice subway/bus routes and map points (no Flask needed). Edit samples in `src/data/mockTransit.ts`. |
| `VITE_FIREBASE_API_KEY`          | Firebase Web app config (Authentication only; no Analytics) |
| `VITE_FIREBASE_AUTH_DOMAIN`      | Same |
| `VITE_FIREBASE_PROJECT_ID`       | Same |
| `VITE_FIREBASE_STORAGE_BUCKET`   | Same |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Same |
| `VITE_FIREBASE_APP_ID`           | Same |

The app calls `GET /api/status` and `GET /api/vehicles` and polls every 60 seconds (mock mode uses the same timing).

### Authentication and personalization

- **Sign in** (email/password) uses **Firebase Authentication** on the client.
- **Favorites** (star on each route in the service status list) and **alert preferences** are loaded and saved via Flask using a **Firebase ID token** in the `Authorization: Bearer` header.
- Until the backend implements those routes, the dashboard still works; favorites/preferences show a clear error hint. See **[docs/BACKEND_INTEGRATION.md](docs/BACKEND_INTEGRATION.md)** for the exact API contract.

## Tests

```bash
npm run test:run
```

## Production build

```bash
npm run build
npm run preview
```

## Deploying on Vercel

1. Connect the GitHub repo and choose the project root.
2. Framework preset: **Vite**. Build command `npm run build`, output directory `dist`.
3. Add environment variable `VITE_API_BASE_URL` with your Render (or other) API URL.
4. Ensure the Flask API allows browser requests from your Vercel origin (**CORS**), or use a same-origin proxy.
