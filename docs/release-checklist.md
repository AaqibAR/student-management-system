# Release and final handover

The original brief lists Days 1–4 explicitly, followed by section **6. Final
Deliverables**. That section number is not a separate Day 6 assignment.

## Deliverables

| Required item | Current state | Evidence / next step |
|---|---|---|
| Full stack system | Implemented; final live verification pending | CRUD, dashboard, USER/ADMIN roles, validation, and responsive record management |
| Next.js frontend | Implemented | `frontend/` |
| Spring Boot REST API | Implemented | `backend/`; auth and CRUD endpoint tables in the testing docs |
| Supabase integration | Configured and exercised locally | `app` schema and JPA; deployment must use the same configured database |
| Authentication | Implemented | BCrypt, signed JWTs, HttpOnly frontend session cookie, logout and expiry |
| Deployed application links | Pending | Deploy after reviewing/merging the release PR |
| Complete documentation | Updated for review | README, architecture, deployment, testing, and this checklist |

## Automated evidence

| Check | Latest release-preparation result |
|---|---|
| 48 focused backend tests | Passed locally on 2026-10-16 (0 failures/errors) |
| Executable backend JAR | Local packaging blocked by missing cached Maven plugin POM and unavailable Maven Central DNS; verify hosted CI result |
| Frontend lint | Passed locally on 2026-10-16 |
| 17 record helper / DOM tests | Passed locally on 2026-10-16 |
| Next.js production build / TypeScript | Passed locally on 2026-10-16 |
| 13 auth HTTP integration groups using the new runner | Passed locally on 2026-10-16; runner also rejects occupied ports without stopping existing servers |
| Render Blueprint schema | Passed the current official JSON Schema locally on 2026-10-16 |
| Docker image build | Not run locally: Docker engine is unavailable; CI build is configured |

Frontend checks use test-only fixtures; the focused backend tests mock database
access. They do not prove deployed database connectivity. The complete backend
context test still requires the database and JWT environment variables.

Run frontend checks from `frontend`:

```bash
npm ci
npm run lint
npm run test:records
npm run build
npm run test:auth
```

Run focused backend checks from `backend` with JDK 21:

```bash
./mvnw --batch-mode -Dtest=AuthServiceTests,JwtConfigTests,AuthSecurityTests test
./mvnw --batch-mode -DskipTests package
```

The `Verify` GitHub Actions workflow runs these checks and a Docker build on
pull requests and pushes to `main`. Check its actual results on the PR; merely
adding a workflow does not mean the hosted checks have passed.

## Review and merge

- [ ] Review the complete PR against `main`, including earlier frontend/auth/UI work.
- [ ] Confirm both GitHub Actions jobs pass and address any build findings.
- [ ] Complete or record the remaining manual checks below.
- [ ] Mark the draft PR ready, merge into `main`, and pull the merged branch locally.

## Local browser verification

The app was reported working locally after the UI patch. The complete visual,
keyboard, and session checklist has not been recorded as finished. Use
disposable records and check each item you actually verify:

- [ ] Anonymous workspace URLs redirect to login; anonymous backend reads return 401.
- [ ] Register creates USER; duplicate registration and wrong login are handled clearly.
- [ ] USER can read/search/sort/page students and courses; writes return 403.
- [ ] ADMIN creates, edits, and deletes both record types; reload confirms persistence.
- [ ] Invalid email, missing fields, credit limits and duplicate details show useful errors.
- [ ] Dialogs retain input after a failed request and prevent duplicate pending actions.
- [ ] Keyboard focus enters/stays inside native dialogs, returns sensibly, and Escape works while idle.
- [ ] Layouts at 360, 768, 1024 and 1440px fit; phone keyboard does not hide form actions.
- [ ] Logout, cross-tab logout, expiry, and backend-unavailable recovery behave correctly.

## Production verification

Follow [deployment.md](deployment.md), then complete:

- [ ] Render health returns 200 with `UP`; anonymous students/courses return 401.
- [ ] Vercel uses the exact production origin and correct API URL, with HTTPS cookies.
- [ ] USER and ADMIN flows work on the deployed system, including persistence.
- [ ] Mobile navigation/forms and session behavior work at the production URL.
- [ ] Free-tier wake-up behavior is understood and the backend is ready before the demo.
- [ ] Confirm real credentials are absent from Git, screenshots, and submitted documentation.
- [ ] Record the verified public links and final commit below and in the root README.

## Submission record

| Item | Value |
|---|---|
| Repository | https://github.com/AaqibAR/student-management-system |
| Frontend production URL | Pending deployment |
| Backend health URL | Pending deployment |
| Final merged commit | Pending merge |
| Live verification date | Pending |

Provide these public links and the repository documentation for handover.
Share any demo-account credentials separately through the intended private channel.
