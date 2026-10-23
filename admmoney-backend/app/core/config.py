import os
from pathlib import Path
from dotenv import load_dotenv

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = BASE_DIR / "admmoney.db"

# Server configuration
PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")

# MongoDB configuration
MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://Leija_Admin:fPUXn0QjUHKzfOXy@cluster0.jxwxczd.mongodb.net/")
MONGO_DB_NAME = os.getenv("MONGO_DB", "AdMoney")

# Security & CORS
JWT_SECRET = os.getenv("JWT_SECRET", "admmoney-super-secret-key-2026")
JWT_ALGORITHM = "HS256"
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:19006",
    "*",
]

