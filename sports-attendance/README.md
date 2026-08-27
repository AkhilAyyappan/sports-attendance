# Sports Camp Attendance System

**Stack:** Spring Boot 3 · Java 17 · Supabase (PostgreSQL) · Flyway · Spring Security

---

## Prerequisites

Install these before starting:

| Tool | Version | How to check | Download |
|------|---------|--------------|----------|
| Java JDK | 17+ | `java -version` | https://adoptium.net |
| Maven | 3.9+ | `./mvnw -version` | Bundled (`mvnw`) — no install needed |

---

## Step 1 — Create a Supabase project

> One person on the team does this. Then share the `.env` file with everyone else.

1. Go to **https://supabase.com** → sign up free (GitHub login works)
2. Click **New project**
3. Fill in:
   - **Project name:** `sports-attendance`
   - **Database password:** pick a strong password, **save it — you'll need it**
   - **Region:** pick the closest to your team
4. Click **Create new project** → wait ~2 minutes

---

## Step 2 — Get your connection strings from Supabase

Go to: **Project Settings → Database → Connection string**

You need **two** URLs:

### URL 1 — Transaction Pooler (port 6543) — used by the app
Click the **Transaction** tab. Copy the URI. It looks like:
```
postgresql://postgres:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```
Replace `[YOUR-PASSWORD]` with your database password.  
Then change `postgresql://` → `jdbc:postgresql://` at the front.
jdbc:postgresql://postgres.inndesysycmovimntwdj:Ashkaratuldev@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres

Final result:
```
jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### URL 2 — Direct Connection (port 5432) — used only by Flyway
Click the **Direct connection** tab. Copy the URI. It looks like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.abcxyzabcxyz.supabase.co:5432/postgres
```
Same steps — replace password and change prefix to `jdbc:postgresql://`:
jdbc:postgresql://postgres:@db.inndesysycmovimntwdj.supabase.co:5432/postgres
```
jdbc:postgresql://db.abcxyzabcxyz.supabase.co:5432/postgres
```

> **Why two URLs?**  
> The pooler (6543) is fast but can't run `CREATE TABLE`.  
> Flyway uses the direct connection (5432) to create tables on first run.  
> After that, the app uses the pooler for everything.

---

## Step 3 — Create your `.env` file

```bash
# In the project root folder
cp .env.example .env
```

Open `.env` and fill in your values:

```env
DB_URL=jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
FLYWAY_URL=jdbc:postgresql://db.abcxyzabcxyz.supabase.co:5432/postgres
DB_USERNAME=postgres
DB_PASSWORD=your-supabase-db-password
```

> **Share this `.env` file** with your team over WhatsApp / Slack / email.  
> It is in `.gitignore` — never commit it to Git.

---

## Step 4 — Run the project

### macOS / Linux — Terminal

```bash
# Load the .env file (strips blank lines and comments) and start the app
export $(grep -v '^\s*#' .env | grep -v '^\s*$' | xargs) && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### Windows — PowerShell

```powershell
# Load .env variables
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
    [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim())
  }
}
# Run the app
./mvnw spring-boot:run "-Dspring-boot.run.profiles=dev"
```

### IntelliJ IDEA — easiest for juniors

1. Open **Run → Edit Configurations**
2. Select the **SportsAttendanceApplication** run config
3. Click **Modify options → Environment variables**
4. Add these 4 variables:

```
DB_URL=jdbc:postgresql://...pooler.supabase.com:6543/postgres
FLYWAY_URL=jdbc:postgresql://db.xxx.supabase.co:5432/postgres
DB_USERNAME=postgres
DB_PASSWORD=your-password
```

5. Click **OK** → press ▶ **Run**

---

## Step 5 — Verify it started correctly

**What you should see in the logs:**
```
Flyway Community Edition ... by Redgate
Successfully applied 2 migrations to schema "public"
  V1__create_schema.sql  ✓  (creates all 8 tables)
  V2__seed_data.sql      ✓  (inserts admin user + 4 sports + 1 camp)
Started SportsAttendanceApplication in X.XXX seconds
```

**Health check in terminal:**
```bash
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}
```

**Open in browser:**
```
http://localhost:8080/login
```

---

## Step 6 — Log in

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin — full access to everything |

---

## Step 7 — View your data in Supabase

Go to your Supabase dashboard:  
**https://supabase.com/dashboard/project/YOUR-PROJECT-REF/editor**

Run these in the SQL Editor to confirm tables were created:

```sql
SELECT * FROM users;
SELECT * FROM sports;
SELECT * FROM camps;
SELECT * FROM teams;
SELECT * FROM players;
SELECT * FROM attendances;
```

---

## Step 8 — Test the API

Open [`requests.http`](requests.http) in VS Code.  
Install the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension.  
Click **Send Request** above any request.

**Recommended order for first-time testing:**

| # | What it does | Request # |
|---|-------------|-----------|
| 1 | Health check | `#1` |
| 2 | Create a captain account | `#12` |
| 3 | Create a team in camp 1 | `#16` |
| 4 | Assign captain to team | `#18` |
| 5 | Add players to team | `#21`, `#22` |
| 6 | Create a training session | `#29` |
| 7 | Submit attendance (as captain) | `#33` |
| 8 | View attendance for session | `#32` |
| 9 | Update one attendance record | `#35` |
| 10 | View player attendance summary | `#37` |

---

## API Reference

Base URL: `http://localhost:8080`  
Authentication: **HTTP Basic** (`username:password`)

### Sports
| Method | Endpoint | Who can call |
|--------|----------|-------------|
| GET | `/api/sports` | Everyone |
| GET | `/api/sports/active` | Everyone |
| GET | `/api/sports/{id}` | Everyone |
| POST | `/api/sports` | Admin only |
| PUT | `/api/sports/{id}` | Admin only |

### Camps
| Method | Endpoint | Who can call |
|--------|----------|-------------|
| GET | `/api/camps` | Everyone |
| GET | `/api/camps/{id}` | Everyone |
| POST | `/api/camps` | Admin only |
| PUT | `/api/camps/{id}` | Admin only |
| DELETE | `/api/camps/{id}` | Admin only |

### Users & Captains
| Method | Endpoint | Who can call |
|--------|----------|-------------|
| GET | `/api/users/captains` | Admin only |
| GET | `/api/users/{id}` | Admin only |
| POST | `/api/users` | Admin only |
| PATCH | `/api/users/{id}/password` | Admin only |
| PATCH | `/api/users/{id}/toggle` | Admin only |

### Teams
| Method | Endpoint | Who can call |
|--------|----------|-------------|
| GET | `/api/camps/{campId}/teams` | Everyone |
| GET | `/api/teams/{id}` | Everyone |
| POST | `/api/camps/{campId}/teams` | Admin only |
| PATCH | `/api/teams/{id}` | Admin only |
| POST | `/api/teams/{teamId}/captain` | Admin only |

### Players
| Method | Endpoint | Who can call |
|--------|----------|-------------|
| GET | `/api/teams/{teamId}/players` | Everyone |
| GET | `/api/players/{id}` | Everyone |
| POST | `/api/teams/{teamId}/players` | Admin, Captain |
| PUT | `/api/players/{id}` | Admin, Captain |
| DELETE | `/api/players/{id}` | Admin only |

### Training Sessions
| Method | Endpoint | Who can call |
|--------|----------|-------------|
| GET | `/api/camps/{campId}/sessions` | Everyone |
| GET | `/api/camps/{campId}/sessions?teamId=N` | Everyone |
| GET | `/api/sessions/{id}` | Everyone |
| POST | `/api/camps/{campId}/sessions` | Admin only |
| PUT | `/api/sessions/{id}` | Admin only |
| PATCH | `/api/sessions/{id}/status` | Admin only |

### Attendance
| Method | Endpoint | Who can call |
|--------|----------|-------------|
| GET | `/api/sessions/{sessionId}/attendance` | Everyone |
| GET | `/api/players/{playerId}/attendance` | Everyone |
| GET | `/api/players/{playerId}/attendance/summary` | Everyone |
| POST | `/api/sessions/{sessionId}/attendance` | Admin, Captain |
| PATCH | `/api/attendance/{id}` | Admin, Captain |

---

## Status values

**Attendance:** `PRESENT` · `ABSENT` · `LATE` · `EXCUSED`  
**Camp:** `UPCOMING` · `ACTIVE` · `COMPLETED` · `CANCELLED`  
**Session:** `SCHEDULED` · `IN_PROGRESS` · `COMPLETED` · `CANCELLED`

---

## Error responses

All errors return JSON in this format:

```json
{
  "status": 404,
  "title": "Not Found",
  "detail": "Camp not found with id: 99",
  "timestamp": "2025-06-01T10:00:00Z"
}
```

| Code | Meaning |
|------|---------|
| `400` | Invalid input or bad enum value |
| `401` | No username/password sent |
| `403` | Your role is not allowed to do this |
| `404` | Record does not exist |
| `409` | Duplicate name — already exists |
| `500` | Something went wrong on the server |

---

## Troubleshooting

### App fails to start — "DB_URL not set"
You forgot to load the `.env` file. Make sure you use the export command or set variables in IntelliJ.

### "SSL connection required"
Add `?sslmode=require` to both URLs in your `.env`:
```env
DB_URL=jdbc:postgresql://...pooler.supabase.com:6543/postgres?sslmode=require
FLYWAY_URL=jdbc:postgresql://db.xxx.supabase.co:5432/postgres?sslmode=require
```

### "password authentication failed"
- Double-check `DB_PASSWORD` in your `.env`
- In Supabase: **Project Settings → Database → Reset database password** to reset it

### "Flyway migration checksum mismatch"
Never edit `V1__create_schema.sql` or `V2__seed_data.sql` after they've run.  
To reset completely: go to Supabase SQL Editor and run:
```sql
DROP TABLE IF EXISTS flyway_schema_history CASCADE;
DROP TABLE IF EXISTS attendances CASCADE;
DROP TABLE IF EXISTS player_evaluations CASCADE;
DROP TABLE IF EXISTS training_sessions CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS camps CASCADE;
DROP TABLE IF EXISTS sports CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```
Then restart the app — Flyway will recreate everything from scratch.

### App starts but login doesn't work
The seed data creates the admin with a BCrypt-hashed password.  
If you wiped the DB and re-seeded, try: **username** `admin` **password** `admin123`.

---

## Project structure

```
sports-attendance/
├── src/main/java/com/sportscamp/attendance/
│   ├── SportsAttendanceApplication.java   ← entry point
│   ├── entity/                            ← JPA entities (DB tables)
│   │   ├── BaseEntity.java
│   │   ├── User.java
│   │   ├── Camp.java
│   │   ├── Sport.java
│   │   ├── Team.java
│   │   ├── Player.java
│   │   ├── TrainingSession.java
│   │   ├── Attendance.java
│   │   └── PlayerEvaluation.java
│   ├── repository/                        ← database queries
│   ├── service/                           ← business logic
│   ├── controller/                        ← web UI controllers
│   │   └── api/                           ← REST API controllers
│   ├── security/                          ← login & role guards
│   └── exception/                         ← error handling
├── src/main/resources/
│   ├── application.yml                    ← main config
│   ├── application-dev.yml                ← dev config (debug logging)
│   └── db/migration/
│       ├── V1__create_schema.sql          ← creates all tables
│       └── V2__seed_data.sql              ← inserts admin + sample data
├── .env.example                           ← copy this to .env
├── requests.http                          ← 41 ready-to-run API tests
└── pom.xml                                ← dependencies
```
