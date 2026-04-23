import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///mta_transit.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MTA_API_KEY = os.getenv("MTA_API_KEY", "")
    FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-service-account.json")
