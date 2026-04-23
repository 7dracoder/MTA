import { initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"

/** Result of reading and applying Firebase Web configuration from the environment. */
export type FirebaseClientInit =
  | { status: "ok"; app: FirebaseApp; auth: Auth }
  | { status: "error"; message: string }

let cachedInit: FirebaseClientInit | undefined

/**
 * Reads required `VITE_FIREBASE_*` strings and builds a FirebaseOptions object.
 * @returns An error message if any value is missing or blank after trim; otherwise the options object.
 */
function readFirebaseOptionsFromEnv(): { ok: true; options: FirebaseOptions } | { ok: false; message: string } {
  const keys = [
    ["VITE_FIREBASE_API_KEY", import.meta.env.VITE_FIREBASE_API_KEY],
    ["VITE_FIREBASE_AUTH_DOMAIN", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN],
    ["VITE_FIREBASE_PROJECT_ID", import.meta.env.VITE_FIREBASE_PROJECT_ID],
    ["VITE_FIREBASE_STORAGE_BUCKET", import.meta.env.VITE_FIREBASE_STORAGE_BUCKET],
    ["VITE_FIREBASE_MESSAGING_SENDER_ID", import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID],
    ["VITE_FIREBASE_APP_ID", import.meta.env.VITE_FIREBASE_APP_ID],
  ] as const

  for (const [name, raw] of keys) {
    if (typeof raw !== "string" || raw.trim().length === 0) {
      return {
        ok: false,
        message: `Missing or empty ${name}. Copy .env.example to .env and set Firebase Web app values.`,
      }
    }
  }

  const options: FirebaseOptions = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY.trim(),
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN.trim(),
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID.trim(),
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET.trim(),
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID.trim(),
    appId: import.meta.env.VITE_FIREBASE_APP_ID.trim(),
  }

  return { ok: true, options }
}

/**
 * Initializes Firebase once and returns the Auth instance, or a human-readable configuration error.
 */
export function getFirebaseClient(): FirebaseClientInit {
  if (cachedInit !== undefined) {
    return cachedInit
  }

  const parsed = readFirebaseOptionsFromEnv()
  if (!parsed.ok) {
    cachedInit = { status: "error", message: parsed.message }
    return cachedInit
  }

  try {
    const app = initializeApp(parsed.options)
    const auth = getAuth(app)
    cachedInit = { status: "ok", app, auth }
    return cachedInit
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to initialize Firebase."
    cachedInit = { status: "error", message: msg }
    return cachedInit
  }
}
