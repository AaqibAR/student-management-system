# Student Management System

A full-stack student management application using Next.js,
Spring Boot, and Supabase PostgreSQL.

## Current Status

Days 1 and 2 completed. Day 3 frontend implemented:

- Dashboard displays student and course totals from the backend
- Students and Courses support listing, adding, editing, and deleting
- Forms validate input and display duplicate-record errors
- API requests include loading, error, and success states
- Shared navigation and responsive layouts implemented
- Login layout created; authentication is scheduled for Day 4
- Backend CORS configured for the frontend origin

See [Day 2 API and Test Results](docs/day-2-testing.md).

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

The API base URL is configured through NEXT_PUBLIC_API_BASE_URL.
Run the backend alongside the frontend to load and manage records.
The home page redirects to /dashboard.

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
./mvnw spring-boot:run
```

The password prompt hides input. Environment variables apply to the
current terminal session and must be supplied again in a new session.

backend/.env.example documents the required variables.
Spring Boot does not automatically load this template.

## Verify Setup

- Frontend: http://localhost:3000
- Backend health: http://localhost:8080/actuator/health

The health response should contain "status":"UP".
It may also list liveness and readiness groups.

## Configuration Notes

- Database tables are created through the saved SQL script.
- Hibernate validates the schema without modifying it.
- Database credentials must remain outside source control.
- Only placeholder environment templates are committed.
- NEXT_PUBLIC_ variables are browser-visible; never store secrets in them.

## Commit Convention

Use short, present-tense commit messages:

- chore(frontend): initialize Next.js project
- chore(backend): configure Spring Boot and Supabase connection
- docs: document architecture and local setup