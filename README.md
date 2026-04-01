# NYC Transit Hub (frontend)

React + TypeScript + Tailwind CSS + Leaflet (OpenStreetMap) SPA for the NYC Transit Hub API.

## Setup

```bash
npm install
cp .env.example .env
# Set VITE_API_BASE_URL to your Flask API (no trailing slash), e.g. http://localhost:5000
npm run dev
```

## Environment

| Variable                 | Description |
| ------------------------ | ----------- |
| `VITE_API_BASE_URL`      | Base URL of the Flask backend (no trailing slash) |
| `VITE_USE_MOCK_DATA`     | Set to `true` to load built-in practice subway/bus routes and map points (no Flask needed). Edit samples in `src/data/mockTransit.ts`. |

The app calls `GET /api/status` and `GET /api/vehicles` and polls every 60 seconds (mock mode uses the same timing).

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
