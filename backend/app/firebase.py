import os
import logging
from functools import wraps
from flask import request, jsonify, g

logger = logging.getLogger(__name__)
_firebase_initialized = False

# Firebase project info — used for logging and validation
FIREBASE_PROJECT_ID = "nyc-transit-hub-4075d"


def init_firebase():
    """Initialize Firebase Admin SDK. Skips gracefully if credentials are missing."""
    global _firebase_initialized
    try:
        import firebase_admin
        from firebase_admin import credentials

        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-service-account.json")
        if not os.path.exists(cred_path):
            logger.warning(
                "Firebase credentials file not found at '%s'. "
                "Download it from Firebase Console → Project Settings → Service Accounts. "
                "Auth endpoints will return 503 until credentials are provided.",
                cred_path,
            )
            return

        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        _firebase_initialized = True
        logger.info("Firebase Admin SDK initialized for project: %s", FIREBASE_PROJECT_ID)
    except Exception as exc:
        logger.error("Failed to initialize Firebase: %s", exc)


def verify_token(f):
    """Decorator that verifies a Firebase ID token on protected routes."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not _firebase_initialized:
            return jsonify({"error": "Auth service not configured"}), 503

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        id_token = auth_header.split("Bearer ")[1]
        try:
            from firebase_admin import auth
            decoded = auth.verify_id_token(id_token)
            g.firebase_uid = decoded["uid"]
            g.email = decoded.get("email", "")
        except Exception:
            return jsonify({"error": "Invalid or expired token"}), 401

        return f(*args, **kwargs)
    return decorated
