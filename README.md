<div align="center">

# Research Opportunity Portal

**One place for faculty to post research openings, and for students to find them.**

![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?logo=flask&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?logo=javascript&logoColor=black)

[GitHub Repository](https://github.com/malikwasiq111/research_opportunity_portal) · [Demo Video](#demo-video)

</div>

**GitHub Repository:** https://github.com/malikwasiq111/research_opportunity_portal

Built for **CN, Assignment #01** · BS (CS 5B) · Fall 2026

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Database](#database)
- [API Reference](#api-reference)
- [Testing with Postman](#testing-with-postman)
- [Security Notes](#security-notes)
- [Troubleshooting](#troubleshooting)
- [Assignment Requirements Coverage](#assignment-requirements-coverage)
- [Demo Video](#demo-video)
- [Future Improvements](#future-improvements)
- [Author](#author)

---

## Overview

Research opportunities at the university are currently shared through emails, WhatsApp groups, and noticeboards. Because the information is scattered, students miss openings and faculty struggle to manage them.

The **Research Opportunity Portal** puts everything in one place. Faculty can post, update, close, and delete research opportunities, and anyone can browse, search, and filter them. The system has three layers:

- a **REST API** (Flask) that owns all business rules and validation,
- a **MySQL** database that stores every record, and
- a **web frontend** (HTML, CSS, and vanilla JavaScript) that talks to the API only through HTTP requests.

No data is hard-coded anywhere. Every list, detail view, and count on screen comes from the database through the API.

## Features

**Managing opportunities**
- Create a new opportunity through a validated form
- Edit any field of an existing opportunity (the form opens pre-filled)
- Close or reopen an opportunity with one click
- Delete an opportunity, with a confirmation dialog before anything is removed

**Browsing**
- Numbered index of all opportunities with status, faculty, department, and deadline
- Slide-in detail panel showing the full description, research area, positions, and skills as tags
- Live search across title, department, and research area
- Status filter (All, Open, Closed) with live counts in the sidebar

**Experience**
- Success and error feedback through toast notifications on every action
- Inline field-level validation messages on the form
- Loading skeletons while data is fetched
- Keyboard accessible (`Tab`, `Enter`, `Space`, `Esc`) with visible focus states
- Responsive layout that adapts from desktop to mobile

**API**
- Five REST endpoints returning JSON with correct HTTP status codes (200, 201, 400, 404, 500)
- Partial updates: `PUT` accepts only the fields being changed
- Descriptive validation errors that say exactly which field is wrong
- Database-level constraints as a second line of defense

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend | Python 3, Flask 3.0 | REST API and routing |
| | flask-cors | Lets the frontend (another port) call the API |
| | mysql-connector-python 8.4 | MySQL driver, parameterized queries |
| | python-dotenv | Loads configuration from `.env` |
| Database | MySQL 8.0 (utf8mb4) | Persistent storage |
| Frontend | HTML5, CSS3, vanilla JavaScript | UI, built without a framework |
| | Fetch API | All communication with the backend |
| | Google Fonts (Fraunces, Inter) | Typography |
| Testing | Postman | Automated API test collection |

## Architecture

```
Browser  (Frontend/, http://localhost:5500)
   │   fetch(): JSON over HTTP
   ▼
Flask REST API  (Backend/app.py, http://localhost:5000)
   │   parameterized SQL via mysql-connector-python
   ▼
MySQL  (database: research_portal, table: opportunities)
```

**Key design decisions**

- **Separated concerns.** `app.py` holds routes and validation, `db.py` only opens connections, and `config.py` only reads settings. Changing one never means editing the others.
- **Validation in layers.** The frontend catches empty fields, the API validates types and formats and returns readable errors, and MySQL enforces `NOT NULL`, `CHECK`, and `ENUM` constraints on its own.
- **Partial updates.** `PUT` updates only the supplied fields, so closing an opportunity sends just `{"status": "Closed"}`.
- **No frontend framework.** The UI is hand-written CSS and vanilla JavaScript, with no build step and no dependencies to install.

## Project Structure

```
research_opportunity_portal/
├── Backend/
│   ├── app.py               # Flask app: 5 CRUD routes, validation, error handlers
│   ├── config.py            # Reads settings from environment variables
│   ├── db.py                # MySQL connection helper
│   ├── schema.sql           # Database, table, constraints, indexes, sample data
│   ├── requirements.txt     # Python dependencies
│   └── .env.demo            # Template for your local .env (safe to commit)
├── Frontend/
│   ├── index.html           # Page structure
│   ├── style.css            # Design system and layout
│   └── app.js               # API calls and all UI logic
├── postman/
│   └── Research_Opportunity_Portal.postman_collection.json
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

| Tool | Version | Check |
|---|---|---|
| Python | 3.9 or newer (tested on 3.13) | `python --version` |
| MySQL Server | 8.0.16 or newer | `mysql --version` |
| Git | any | `git --version` |
| Postman | any | used for API testing |

Make sure the MySQL service is running. On Windows: `Get-Service MySQL80` should show `Running`.

> [!NOTE]
> Commands below use **Windows PowerShell**, where this project was developed. macOS/Linux equivalents are shown in comments.

### 1. Clone the repository

```powershell
git clone https://github.com/malikwasiq111/research_opportunity_portal.git
cd research_opportunity_portal
```

### 2. Create the database

From the project root, open the MySQL client:

```powershell
mysql -u root -p
```

At the `mysql>` prompt, run the schema script:

```sql
source Backend/schema.sql;
```

You should see a series of `Query OK` lines. Verify it worked:

```sql
USE research_portal;
SHOW TABLES;
SELECT id, title, status FROM opportunities;
exit;
```

> [!TIP]
> If `source` says it can't open the file, MySQL is looking in the wrong folder. Use the full path with forward slashes, for example `source D:/path/to/research_opportunity_portal/Backend/schema.sql;`
>
> PowerShell doesn't support the `<` redirect operator, which is why `source` is used. On macOS, Linux, or CMD, `mysql -u root -p < Backend/schema.sql` also works.

### 3. Configure and install the backend

```powershell
cd Backend
python -m venv venv
venv\Scripts\activate              # macOS/Linux: source venv/bin/activate
python -m pip install -r requirements.txt
copy .env.demo .env                # macOS/Linux: cp .env.demo .env
```

Open `Backend/.env` and set `DB_PASSWORD` to your MySQL root password (see [Configuration](#configuration)).

> [!WARNING]
> `.env` contains your real password and is excluded from Git by `.gitignore`. Never commit it. Only the placeholder file `.env.demo` is tracked.

### 4. Start the backend

With the virtual environment active, from `Backend/`:

```powershell
python app.py
```

The API is now running at `http://localhost:5000`. Confirm it:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

Expected output: `status : ok`

### 5. Start the frontend

Open a **second terminal** (leave the backend running):

```powershell
cd Frontend
python -m http.server 5500
```

Open **http://localhost:5500** in your browser. You should see the portal with the sample opportunities loaded from MySQL.

Press `Ctrl+C` in each terminal to stop the servers.

## Configuration

All settings live in `Backend/.env`, created from `Backend/.env.demo`.

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` | `localhost` | MySQL host |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | *(empty)* | MySQL password. **Set this.** |
| `DB_NAME` | `research_portal` | Database name (matches `schema.sql`) |
| `DB_PORT` | `3306` | MySQL port |
| `FLASK_PORT` | `5000` | Port the API listens on |
| `FLASK_DEBUG` | `True` | Auto-reload and debugger. **Use `False` outside development.** |

If you change `FLASK_PORT`, update `API_BASE` on line 2 of `Frontend/app.js` to match.

## Database

**Database:** `research_portal` (character set `utf8mb4`, collation `utf8mb4_unicode_ci`)
**Table:** `opportunities`

| Column | Type | Constraints |
|---|---|---|
| `id` | `INT` | Primary key, auto-increment |
| `title` | `VARCHAR(255)` | Not null |
| `description` | `TEXT` | Not null |
| `research_area` | `VARCHAR(150)` | Not null |
| `faculty_name` | `VARCHAR(150)` | Not null |
| `department` | `VARCHAR(150)` | Not null |
| `required_skills` | `VARCHAR(255)` | Not null, comma-separated list |
| `available_positions` | `INT` | Not null, `CHECK (available_positions >= 0)` |
| `application_deadline` | `DATE` | Not null |
| `status` | `ENUM('Open','Closed')` | Not null, default `'Open'` |
| `created_at` | `TIMESTAMP` | Defaults to the current time |
| `updated_at` | `TIMESTAMP` | Refreshes automatically on every update |

**Indexes:** `idx_opportunities_status` and `idx_opportunities_department`, which speed up the status filter and department search.

`schema.sql` also inserts two sample rows so the interface isn't empty on first run.

To reset the database from scratch:

```sql
DROP DATABASE research_portal;
source Backend/schema.sql;
```

## API Reference

**Base URL:** `http://localhost:5000`
All requests and responses use JSON (`Content-Type: application/json`).

| Method | Endpoint | Description | Success | Errors |
|---|---|---|---|---|
| `POST` | `/api/opportunities` | Create an opportunity | `201` | `400`, `500` |
| `GET` | `/api/opportunities` | List all (supports filters) | `200` | `500` |
| `GET` | `/api/opportunities/:id` | Get one by ID | `200` | `404`, `500` |
| `PUT` | `/api/opportunities/:id` | Update (partial allowed) | `200` | `400`, `404`, `500` |
| `DELETE` | `/api/opportunities/:id` | Delete | `200` | `404`, `500` |
| `GET` | `/api/health` | Health check | `200` | none |

### The opportunity object

| Field | Type | Required on create | Rules |
|---|---|---|---|
| `title` | string | Yes | Max 255 characters |
| `description` | string | Yes | |
| `research_area` | string | Yes | Max 150 characters |
| `faculty_name` | string | Yes | Max 150 characters |
| `department` | string | Yes | Max 150 characters |
| `required_skills` | string | Yes | Comma-separated, max 255 characters |
| `available_positions` | integer | Yes | Zero or greater |
| `application_deadline` | string | Yes | `YYYY-MM-DD` |
| `status` | string | No | `Open` or `Closed`. Defaults to `Open`. |

Responses also include `id`, `created_at`, and `updated_at`, which are set by the server and read-only.

### List filters

`GET /api/opportunities` accepts optional query parameters:

| Parameter | Example | Effect |
|---|---|---|
| `status` | `?status=Open` | Only opportunities with that status |
| `search` | `?search=python` | Matches title, department, or research area |

Both can be combined: `?status=Open&search=computer`. Results are ordered newest first.

### Examples

**Create** (`201 Created`)

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/opportunities -Method POST -ContentType "application/json" -Body '{"title":"AI in Healthcare Diagnostics","description":"Exploring ML models for early disease detection.","research_area":"Artificial Intelligence","faculty_name":"Dr. Ayesha Khan","department":"Computer Science","required_skills":"Python, TensorFlow","available_positions":2,"application_deadline":"2026-12-15"}'
```
```json
{ "message": "Opportunity created.", "id": 7 }
```

**Get one** (`200 OK`)

```powershell
Invoke-RestMethod http://localhost:5000/api/opportunities/7
```

**Close an opportunity** (`200 OK`)

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/opportunities/7 -Method PUT -ContentType "application/json" -Body '{"status":"Closed"}'
```
```json
{ "message": "Opportunity 7 updated." }
```

**Delete** (`200 OK`)

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/opportunities/7 -Method DELETE
```
```json
{ "message": "Opportunity 7 deleted." }
```

### Error responses

**`400 Bad Request`**: validation failed. `details` lists every problem found.

```json
{
  "error": "Validation failed.",
  "details": [
    "'available_positions' must be zero or a positive integer.",
    "'application_deadline' must be in YYYY-MM-DD format."
  ]
}
```

**`404 Not Found`**: the ID doesn't exist (also returned for unknown routes).

```json
{ "error": "Opportunity with id 999 not found." }
```

**`500 Internal Server Error`**: a database or server failure.

```json
{ "error": "Database error.", "details": "..." }
```

### Validation rules

| Layer | What it checks |
|---|---|
| Frontend | Every required field is filled in, positions is a non-negative number, a deadline is chosen |
| API, on create | All required fields are present and non-empty, positions is a non-negative integer, deadline is a valid `YYYY-MM-DD` date, status is `Open` or `Closed` |
| API, on update | The format of whichever fields are supplied (integer, date, status) |
| Database | `NOT NULL` on every data column, `CHECK (available_positions >= 0)`, `ENUM` on status |

## Testing with Postman

The collection in `postman/` covers every scenario the assignment requires and asserts the result of each request automatically.

**Import and run**

1. Start the backend (`python app.py`).
2. In Postman, click **Import** → **Upload Files** → choose `postman/Research_Opportunity_Portal.postman_collection.json`.
3. Open the collection and click **Run** to start the Collection Runner.
4. Keep all 10 requests selected, in order, and click **Run Research Opportunity Portal API**.

Request #1 stores the new record's `id` in the collection variable `{{opportunity_id}}`, and requests 5 to 9 reuse it, so no manual copying is needed.

| # | Request | Method | Expected result |
|---|---|---|---|
| 1 | Create Opportunity #1 | `POST` | `201`, saves the new `id` |
| 2 | Create Opportunity #2 | `POST` | `201` |
| 3 | Create Opportunity #3 | `POST` | `201` |
| 4 | Get All Opportunities | `GET` | `200`, response is an array |
| 5 | Get One Opportunity By ID | `GET` | `200`, `id` matches |
| 6 | Update Opportunity (positions and skills) | `PUT` | `200` |
| 7 | Change Status To Closed | `PUT` | `200` |
| 8 | Delete Opportunity | `DELETE` | `200` |
| 9 | Get Deleted Opportunity | `GET` | **`404`** |
| 10 | Create With Missing Fields | `POST` | **`400`** with `details` |

Requests 9 and 10 are supposed to return errors. Those are the passing results for them.

> [!NOTE]
> Each full run creates three records and deletes one, so it leaves two new records in the database behind it.

## Security Notes

- **SQL injection.** Every query uses parameterized placeholders (`%s`). The column names in the dynamic `UPDATE` come from a fixed allow-list, never from user input.
- **Cross-site scripting.** The frontend escapes all server-provided text before inserting it into the page.
- **Secrets.** Database credentials live in `.env`, which is git-ignored. Only `.env.demo`, which holds placeholders, is committed.
- **CORS** is open to all origins, which is convenient in development. Restrict it to your frontend's origin before any real deployment.
- **Debug mode** (`FLASK_DEBUG=True`) is for local development only.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `mysql` is not recognized | MySQL's `bin` folder isn't on your PATH | Run it by full path: `& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p`, or add that folder to PATH and reopen the terminal |
| `Access denied ... (using password: NO)` | `.env` is missing, empty, or misnamed (for example `.env.txt`) | Create `Backend/.env` from `.env.demo` and save it with your password |
| `Access denied ... (using password: YES)` | Wrong password in `.env` | Correct `DB_PASSWORD` and restart the backend |
| `Failed to open file 'schema.sql', error: 2` | The MySQL client is in a different folder | Use `source Backend/schema.sql;` from the project root, or the full path with forward slashes |
| `Duplicate key name 'idx_opportunities_status'` | `schema.sql` was already run | Reset: `DROP DATABASE research_portal;` then `source` it again |
| `ModuleNotFoundError: No module named 'flask'` | Virtual environment not active, or dependencies not installed | Activate `venv`, then run `python -m pip install -r requirements.txt` |
| `venv\Scripts\activate` is blocked | PowerShell script execution policy | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, then try again |
| Page loads unstyled, `style.css` or `app.js` returns 404 | The frontend server was started from the wrong folder | Run `python -m http.server 5500` from inside `Frontend/` |
| "Could not load opportunities" toast | Backend isn't running or the port doesn't match | Check `http://localhost:5000/api/health` and the `API_BASE` value in `Frontend/app.js` |
| `Address already in use` | Port 5000 or 5500 is taken | Change `FLASK_PORT` in `.env` (and `API_BASE`), or serve the frontend on another port such as `5501` |

## Assignment Requirements Coverage

| Requirement | Where it is implemented |
|---|---|
| Backend REST API with five CRUD endpoints | `Backend/app.py` |
| Correct status codes: 200, 201, 400, 404, 500 | `Backend/app.py` |
| MySQL database, all CRUD through the database | `Backend/schema.sql`, `Backend/db.py` |
| Frontend: list, details, create, update, Open to Closed, delete | `Frontend/` |
| Frontend: success and error messages, required-field validation | `Frontend/app.js` |
| No hard-coded data | Every view is rendered from API responses |
| Postman collection covering all required scenarios | `postman/` |
| Credentials kept out of the repository | `.gitignore`, `Backend/.env.demo` |
| README with setup and run instructions and the repository link | This file |
| One-minute demonstration video | [Demo Video](#demo-video) |

## Demo Video

[Watch the one-minute demonstration](https://drive.google.com/file/d/1oTm6reQ8nnFpCYYmVCtSsC7fzFOLlxaC/view?usp=sharing)

The video shows the backend and frontend running, creating, listing, updating, closing, and deleting an opportunity, a validation or 404 error, and the API requests and responses in Postman.

## Future Improvements

- Faculty authentication, so only the posting faculty member can edit or delete their own opportunities
- Pagination for large result sets
- Student applications submitted directly through the portal
- Automatic closing of opportunities once their deadline passes

## Author

| | |
|---|---|
| **Name** | [Muhammad Wasiq] |
| **GitHub** | [@malikwasiq111](https://github.com/malikwasiq111) |s