# Student Management System

A full-stack application built with Next.js, Spring Boot, and Supabase
PostgreSQL. Students and courses support CRUD, search, sorting, and pagination.
JWT authentication separates USER view access from ADMIN management access.

## Status and deliverables

The application is deployed on Vercel and Render, using the existing Supabase
PostgreSQL database. Backend health and anonymous-access checks passed on
2026-10-16; the production ADMIN dashboard was shown loading student records.
The remaining role, CRUD, mobile, and session checks are tracked in the
[release checklist](docs/release-checklist.md).

| Item | State |
|---|---|
| Backend CRUD, Supabase schema and integration | Implemented |
| Dashboard, Students, Courses, login and registration | Implemented |
| JWT, BCrypt, roles, validation and safe errors | Implemented |
| Responsive record cards, dialogs, search/sort/paging | Implemented |
| Automated test coverage | 48 backend tests, 17 record tests, 13 frontend HTTP integration groups |
| Frontend production URL | [Open the application](https://student-management-system-henna-rho.vercel.app) |
| Backend production URL | https://student-management-api-pqza.onrender.com |
| Backend health URL | [Health endpoint](https://student-management-api-pqza.onrender.com/actuator/health) |
| Deployed application commit | `a274732` (merged release PR #1) |

The assignment explicitly lists Days 1–4 and then section **6. Final
Deliverables**. See the [release checklist](docs/release-checklist.md) for the
remaining handover work and current verification evidence.

## Documentation

- [System architecture and authentication flow](docs/architecture.md)
- [Vercel + Render + Supabase deployment guide](docs/deployment.md)
- [Release checklist and submission record](docs/release-checklist.md)
- [CRUD API examples and Day 2 test results](docs/day-2-testing.md)
- [Authentication endpoints, roles and Day 4 tests](docs/day-4-auth-testing.md)
- [Record management behavior and visual checks](docs/record-management-improvements.md)
- [Frontend setup and scripts](frontend/README.md)

## Requirements

- Node.js 22 and npm.
- JDK 21. The backend includes its Maven wrapper.
- Git and an existing Supabase PostgreSQL project.
- Docker only for a local container build; hosted Docker builds run in CI/Render.

## Repository layout

| Path | Purpose |
|---|---|
| `frontend/` | Next.js App Router, server-side API relay, and browser UI |
| `backend/` | Spring Boot API, Spring Security, JPA entities and repositories |
| `backend/sql/` | Initial database schema for a fresh project |
| `docs/` | Architecture, testing, deployment and release documentation |
| `render.yaml` | Render Docker backend service configuration |
| `.github/workflows/verify.yml` | Automated frontend/backend checks and Docker build |

## Local setup

```bash
git clone https://github.com/AaqibAR/student-management-system.git
cd student-management-system
```

### Database

Use the existing configured Supabase project. For a **fresh database only**, run
`backend/sql/001_create_tables.sql` once in the Supabase SQL Editor. It creates
`app.students`, `app.courses`, and `app.users` and enables RLS. Do not rerun it
to recreate existing data. Hibernate validates the schema without changing it.

Copy the actual Session pooler host and username from Supabase's Connect panel.
The JDBC connection uses port 5432 with SSL and a separate database password.

### Backend terminal (macOS zsh)

From the repository root, replace the host and username placeholders:

```bash
cd backend
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
export PATH="$JAVA_HOME/bin:$PATH"
chmod +x mvnw
export DB_URL='jdbc:postgresql://YOUR_SESSION_POOLER_HOST:5432/postgres?sslmode=require'
export DB_USERNAME='postgres.YOUR_PROJECT_REF'
read -s "DB_PASSWORD?Enter your Supabase database password: "
export DB_PASSWORD
export JWT_SECRET="$(openssl rand -base64 32)"
./mvnw spring-boot:run
```

Generate `JWT_SECRET` once per terminal session and reuse it when restarting.
Changing the value invalidates existing tokens. A new terminal needs its
environment variables again. `backend/.env.example` documents the variables;
Spring Boot does not automatically load that file. The default local port is
8080; `PORT` can override it for hosting.

### Frontend terminal

In another terminal, from the repository root:

```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

Copy the example only for initial setup; retain an existing configured
`.env.local`. It should set `API_BASE_URL=http://localhost:8080` and
`APP_ORIGIN=http://localhost:3000` for the normal local setup. The older
`NEXT_PUBLIC_API_BASE_URL` remains a fallback, with `API_BASE_URL` taking
precedence.

Open http://localhost:3000. Use `/register` or `/login`; protected workspace
pages redirect anonymous users to login. Backend health is available at
http://localhost:8080/actuator/health and should return `status: UP`.

## Roles and sessions

Public registration always creates USER accounts. USER can read students and
courses; ADMIN can create, edit, and delete them. The backend enforces these
permissions on every request, independently of frontend controls.

To test ADMIN, promote one deliberately selected registered account in the
Supabase SQL Editor, replacing the placeholder with its actual email:

```sql
UPDATE app.users
SET role = 'ADMIN'
WHERE email = LOWER('YOUR_REGISTERED_EMAIL')
RETURNING id, name, email, role;
```

Sign out and sign in again to obtain a token with the new role. Use disposable
records for mutation tests. Passwords are BCrypt hashes; the frontend stores
JWTs in HttpOnly cookies. Access tokens last 15 minutes, with no refresh-token
or server-side revocation endpoint. Logout clears the browser cookie.

## Repeatable checks

From `frontend/`:

```bash
npm run lint
npm run test:records
npm run build
npm run test:auth
```

`test:auth` requires the production build. It starts/stops its own mock backend
and Next server on loopback ports 8181 and 3030, and does not contact Supabase.
Use `AUTH_TEST_BACKEND_PORT` and `AUTH_TEST_APP_PORT` to select other unused
ports if needed.

From `backend/`, with JDK 21:

```bash
./mvnw --batch-mode -Dtest=AuthServiceTests,JwtConfigTests,AuthSecurityTests test
./mvnw --batch-mode -DskipTests package
```

The focused tests mock database access. Running the full context test instead
requires database credentials and `JWT_SECRET`. DOM/HTTP tests do not establish
actual browser appearance or native dialog behavior: complete the manual
[release checklist](docs/release-checklist.md).

## Production configuration

Follow the [deployment guide](docs/deployment.md) to reproduce the hosting setup.
Use Vercel root directory `frontend` and Render's Docker Blueprint.
The backend remains connected to the existing Supabase project.

| Where | Variables |
|---|---|
| Vercel, Production | `API_BASE_URL`, exact `APP_ORIGIN` |
| Render | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `FRONTEND_URL`; automatic `PORT` |

Keep real secrets out of source control and `NEXT_PUBLIC_` variables. The frontend
needs no signing secret or database password. Production cookies require HTTPS.
The Render Free service can sleep when idle; see the documented wake-up behavior
before a demo. The public links above were checked on 2026-10-16; the release
checklist distinguishes confirmed behavior from remaining manual checks.
