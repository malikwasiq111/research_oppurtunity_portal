"""
Application configuration, loaded from environment variables (.env file).
Keeping this separate from app.py means no secrets are ever hard-coded.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    DB_HOST = os.environ.get("DB_HOST", "localhost")
    DB_USER = os.environ.get("DB_USER", "root")
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
    DB_NAME = os.environ.get("DB_NAME", "research_portal")
    DB_PORT = int(os.environ.get("DB_PORT", 3306))

    FLASK_PORT = int(os.environ.get("FLASK_PORT", 5000))
    FLASK_DEBUG = os.environ.get("FLASK_DEBUG", "True") == "True"