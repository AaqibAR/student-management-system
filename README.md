# Student Management System

A full-stack student management application using Next.js,
Spring Boot, and Supabase PostgreSQL.

## Current Status

Days 1–3 completed. Day 4 authentication implemented:

- Dashboard displays saved student and course totals and recent records
- Students and Courses support listing, adding, editing, and deleting
- Registration and login use BCrypt passwords and signed JWT access tokens
- USER accounts can view records; ADMIN accounts can create, edit, and delete
- Protected frontend pages, HttpOnly session cookies, logout, and expiry handling
- Login and registration pages match the shared workspace design
- Validated inputs and structured API error responses
- 48 backend tests and 13 frontend HTTP integration test groups passed

See [Day 2 API and Test Results](docs/day-2-testing.md) and
[Day 4 Authentication and Testing](docs/day-4-auth-testing.md).

## Project Structure

| Directory | Purpose |
|---|---|
| frontend/ | Next.js application |
| backend/ | Spring Boot REST API |
| docs/ | Project documentation |

See [System Architecture](docs/architecture.md).

## Prerequisites

- Node.js 22
- npm
- JDK 21
- Git
- A Supabase project and its database credentials

The backend includes a Maven wrapper; a separate Maven installation
is not required.

## Clone the Repository

```bash
git clone https://github.com/AaqibAR/student-management-system.git
cd student-management-system
```

## Run the Frontend

From the repository root:

```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

The backend URL is configured through NEXT_PUBLIC_API_BASE_URL.
API_BASE_URL can optionally override it for server-side requests.
Run the backend alongside the frontend. Browser requests use Next.js
route handlers, which forward the session JWT to Spring Boot.

Visit /register to create an account or /login to sign in.
New accounts have USER view access. The home page redirects to
/dashboard; unauthenticated workspace requests redirect to /login.

## Database Setup

For a fresh Supabase database, run
backend/sql/001_create_tables.sql in the Supabase SQL Editor.

The script creates the app schema, three tables, and enables RLS.
Run it once; it is not intended to recreate existing tables.

Spring Boot uses Hibernate validation to check the entity mappings
against the existing database schema.

## Run the Backend

From the repository root, in a separate macOS zsh terminal:

```bash
cd backend
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
export PATH="$JAVA_HOME/bin:$PATH"
chmod +x mvnw
```

Copy the full Session pooler host and username from the Supabase
connection panel. Replace the placeholders below before running:

```bash
export DB_URL='jdbc:postgresql://YOUR_SESSION_POOLER_HOST:5432/postgres?sslmode=require'
export DB_USERNAME='postgres.YOUR_PROJECT_REF'
read -s "DB_PASSWORD?Enter your Supabase database password: "
export DB_PASSWORD
export JWT_SECRET="$(openssl rand -base64 32)"
./mvnw spring-boot:run
```

The password prompt hides input. Generate JWT_SECRET once per terminal
session and reuse it when restarting the backend. Changing the secret
invalidates existing tokens, so sign in again afterward. Environment
variables must be supplied again in a new terminal session.

backend/.env.example documents the required variables.
Spring Boot does not automatically load this template.

## Verify Setup

- Frontend: http://localhost:3000
- Backend health: http://localhost:8080/actuator/health

The health response should contain "status":"UP".
It may also list liveness and readiness groups.
Protected backend API endpoints return 401 without a valid Bearer token.
Sign in through the frontend to load records.

## Roles and Validation

Public registration always assigns USER. To test ADMIN access, promote
one chosen account in Supabase, then sign out and sign in again:

```sql
UPDATE app.users
SET role = 'ADMIN'
WHERE email = LOWER('YOUR_REGISTERED_EMAIL')
RETURNING id, name, email, role;
```

Use disposable records for create, edit, and delete checks.
The backend tests use mocked database access; frontend integration tests
use a test-only API fixture. See the Day 4 testing document for commands
and the live browser checklist.

## Configuration Notes

- Database tables are created through the saved SQL script.
- Hibernate validates the schema without modifying it.
- Database credentials must remain outside source control.
- Only placeholder environment templates are committed.
- JWT_SECRET belongs to the backend environment and is never sent to the frontend.
- Production frontend cookies require HTTPS.
- Set APP_ORIGIN to the public frontend origin when deploying behind a proxy.
- NEXT_PUBLIC_ variables are browser-visible; never store secrets in them.

## Commit Convention

Use short, present-tense commit messages:

- chore(frontend): initialize Next.js project
- chore(backend): configure Spring Boot and Supabase connection
- docs: document architecture and local setup
