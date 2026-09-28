"""
Small helper that opens a MySQL connection using settings from Config.
Kept in its own module so app.py stays focused on routes.
"""
import mysql.connector
from config import Config


def get_db_connection():
    """Return a new MySQL connection. Raises mysql.connector.Error on failure."""
    return mysql.connector.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME,
        port=Config.DB_PORT,
    )