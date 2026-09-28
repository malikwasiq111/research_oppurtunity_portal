"""
Research Opportunity Portal - Backend REST API
Course: CN | Assignment #01

Endpoints
---------
POST    /api/opportunities            Create a new opportunity
GET     /api/opportunities            List all opportunities (supports ?status=Open&search=...)
GET     /api/opportunities/<id>       Get one opportunity
PUT     /api/opportunities/<id>       Update an opportunity (partial updates allowed)
DELETE  /api/opportunities/<id>       Delete an opportunity
GET     /api/health                   Simple health check
"""
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from mysql.connector import Error as MySQLError

from config import Config
from db import get_db_connection

app = Flask(__name__)
CORS(app)  # allows the frontend (a different port) to call this API

REQUIRED_FIELDS = [
    "title",
    "description",
    "research_area",
    "faculty_name",
    "department",
    "required_skills",
    "available_positions",
    "application_deadline",
]

VALID_STATUSES = ["Open", "Closed"]
ALLOWED_UPDATE_FIELDS = REQUIRED_FIELDS + ["status"]


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------
def validate_payload(data, partial=False):
    """
    Validate incoming opportunity JSON.
    Returns a list of error strings (empty list = valid).
    partial=True is used for PUT, where only the submitted fields are checked.
    """
    if not isinstance(data, dict):
        return ["Request body must be a JSON object."]

    errors = []

    if not partial:
        for field in REQUIRED_FIELDS:
            if field not in data or data[field] in (None, ""):
                errors.append(f"'{field}' is required.")

    if "available_positions" in data and data["available_positions"] not in (None, ""):
        try:
            if int(data["available_positions"]) < 0:
                errors.append("'available_positions' must be zero or a positive integer.")
        except (ValueError, TypeError):
            errors.append("'available_positions' must be a valid integer.")

    if "application_deadline" in data and data["application_deadline"] not in (None, ""):
        try:
            datetime.strptime(data["application_deadline"], "%Y-%m-%d")
        except (ValueError, TypeError):
            errors.append("'application_deadline' must be in YYYY-MM-DD format.")

    if "status" in data and data["status"] not in (None, ""):
        if data["status"] not in VALID_STATUSES:
            errors.append(f"'status' must be one of {VALID_STATUSES}.")

    return errors


def row_to_dict(row):
    """Convert DB types (e.g. date objects) into JSON-friendly values."""
    if row and row.get("application_deadline") is not None:
        row["application_deadline"] = row["application_deadline"].strftime("%Y-%m-%d")
    return row


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------
@app.errorhandler(404)
def not_found(_e):
    return jsonify({"error": "Resource not found."}), 404


@app.errorhandler(500)
def server_error(_e):
    return jsonify({"error": "Internal server error."}), 500


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"}), 200


@app.route("/api/opportunities", methods=["POST"])
def create_opportunity():
    data = request.get_json(silent=True)
    errors = validate_payload(data)
    if errors:
        return jsonify({"error": "Validation failed.", "details": errors}), 400

    status = data.get("status") or "Open"

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO opportunities
                (title, description, research_area, faculty_name, department,
                 required_skills, available_positions, application_deadline, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                data["title"],
                data["description"],
                data["research_area"],
                data["faculty_name"],
                data["department"],
                data["required_skills"],
                int(data["available_positions"]),
                data["application_deadline"],
                status,
            ),
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({"message": "Opportunity created.", "id": new_id}), 201
    except MySQLError as e:
        return jsonify({"error": "Database error.", "details": str(e)}), 500


@app.route("/api/opportunities", methods=["GET"])
def get_opportunities():
    status_filter = request.args.get("status")
    search = request.args.get("search")

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = "SELECT * FROM opportunities WHERE 1=1"
        params = []

        if status_filter in VALID_STATUSES:
            query += " AND status = %s"
            params.append(status_filter)

        if search:
            query += " AND (title LIKE %s OR department LIKE %s OR research_area LIKE %s)"
            like = f"%{search}%"
            params.extend([like, like, like])

        query += " ORDER BY created_at DESC"

        cursor.execute(query, tuple(params))
        rows = [row_to_dict(r) for r in cursor.fetchall()]
        cursor.close()
        conn.close()
        return jsonify(rows), 200
    except MySQLError as e:
        return jsonify({"error": "Database error.", "details": str(e)}), 500


@app.route("/api/opportunities/<int:opportunity_id>", methods=["GET"])
def get_opportunity(opportunity_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM opportunities WHERE id = %s", (opportunity_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if not row:
            return jsonify({"error": f"Opportunity with id {opportunity_id} not found."}), 404

        return jsonify(row_to_dict(row)), 200
    except MySQLError as e:
        return jsonify({"error": "Database error.", "details": str(e)}), 500


@app.route("/api/opportunities/<int:opportunity_id>", methods=["PUT"])
def update_opportunity(opportunity_id):
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    errors = validate_payload(data, partial=True)
    if errors:
        return jsonify({"error": "Validation failed.", "details": errors}), 400

    updates = {k: v for k, v in data.items() if k in ALLOWED_UPDATE_FIELDS}
    if not updates:
        return jsonify({"error": "No valid fields provided to update."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM opportunities WHERE id = %s", (opportunity_id,))
        if cursor.fetchone() is None:
            cursor.close()
            conn.close()
            return jsonify({"error": f"Opportunity with id {opportunity_id} not found."}), 404

        set_clause = ", ".join(f"{field} = %s" for field in updates)
        values = list(updates.values()) + [opportunity_id]

        cursor.execute(f"UPDATE opportunities SET {set_clause} WHERE id = %s", tuple(values))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": f"Opportunity {opportunity_id} updated."}), 200
    except MySQLError as e:
        return jsonify({"error": "Database error.", "details": str(e)}), 500


@app.route("/api/opportunities/<int:opportunity_id>", methods=["DELETE"])
def delete_opportunity(opportunity_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM opportunities WHERE id = %s", (opportunity_id,))
        if cursor.fetchone() is None:
            cursor.close()
            conn.close()
            return jsonify({"error": f"Opportunity with id {opportunity_id} not found."}), 404

        cursor.execute("DELETE FROM opportunities WHERE id = %s", (opportunity_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": f"Opportunity {opportunity_id} deleted."}), 200
    except MySQLError as e:
        return jsonify({"error": "Database error.", "details": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=Config.FLASK_DEBUG, port=Config.FLASK_PORT)