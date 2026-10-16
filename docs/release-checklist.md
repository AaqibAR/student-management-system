# Release and final handover

The original brief lists Days 1–4 explicitly, followed by section **6. Final
Deliverables**. That section number is not a separate Day 6 assignment.

## Deliverables

| Required item | Current state | Evidence / next step |
|---|---|---|
| Full stack system | Deployed; detailed manual checks pending | Production ADMIN dashboard shown loading student records |
| Next.js frontend | Deployed on Vercel | Public production URL below; login page returns 200 |
| Spring Boot REST API | Deployed on Render | Health returns 200 with `UP`; anonymous students/courses return 401 |
| Supabase integration | Exercised in production | Backend health and dashboard data confirm connectivity to the existing database |
| Authentication | Deployed; remaining role/session checks pending | Production ADMIN dashboard confirmed; anonymous session denied |
| Deployed application links | Recorded and checked | Frontend, backend, and health URLs below |
| Complete documentation | Live links and evidence recorded | README, architecture, deployment, testing, and this checklist |

## Automated evidence

| Check | Latest release-preparation result |
|---|---|
| 48 focused backend tests | Passed locally on 2026-10-16 (0 failures/errors) |
| Executable backend JAR | Passed in GitHub Actions on 2026-10-16 |
| Frontend lint | Passed locally on 2026-10-16 |
| 17 record helper / DOM tests | Passed locally on 2026-10-16 |
| Next.js production build / TypeScript | Passed locally on 2026-10-16 |
| 13 auth HTTP integration groups using the new runner | Passed locally on 2026-10-16; runner also rejects occupied ports without stopping existing servers |
| Render Blueprint schema | Passed the current official JSON Schema locally on 2026-10-16 |
| Docker image build | Passed in GitHub Actions on 2026-10-16 |

[Hosted verification run](https://github.com/AaqibAR/student-management-system/actions/runs/38849538037)
passed both jobs for application/configuration commit `8eda512`.
[Verification on merged main](https://github.com/AaqibAR/student-management-system/actions/runs/38852159082)
also passed both jobs for deployed commit `a274732`. Local JAR
packaging had been blocked by a missing cached plugin POM and Maven Central DNS;
the hosted packaging and Docker build completed successfully. Docker was not
run on the local machine.

Frontend checks use test-only fixtures; the focused backend tests mock database
access. Those automated tests do not prove deployed database connectivity; the
separate live checks below cover the running deployment. The complete backend
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

- [x] Release [PR #1](https://github.com/AaqibAR/student-management-system/pull/1) merged into `main` as `a274732` on 2026-10-16.
- [x] Both GitHub Actions jobs passed on merged `main` (run linked above).
- [x] Merged `main` was pulled into the local working repository.
- [ ] Complete or record the remaining manual checks below.

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

Evidence recorded on 2026-10-16:

| Live check | Result / evidence |
|---|---|
| `GET /actuator/health` on Render | HTTP 200; `{"groups":["liveness","readiness"],"status":"UP"}` |
| Anonymous `GET /api/students` and `/api/courses` on Render | Both HTTP 401; sign-in required |
| `GET /login` on the production frontend | HTTP 200 |
| Anonymous `GET /dashboard` | Next.js response contains the redirect to `/login`; streamed HTML includes a refresh redirect |
| Anonymous `GET /api/auth/session` | HTTP 401, `Cache-Control: no-store`; clears the session cookie with Secure, HttpOnly, and SameSite=Lax attributes |
| Vercel production environment and redeploy | User screenshots show Production `API_BASE_URL` / `APP_ORIGIN` entries and the new deployment marked Ready |
| Production ADMIN dashboard | User screenshot shows the production `/dashboard`, ADMIN role, and existing student records |

The dashboard evidence comes from the user's browser screenshot, not an
automated authenticated browser run. The anonymous response confirms cookie
clearing attributes; inspecting an issued login cookie and the remaining
authenticated flows still needs the checks below.

Follow [deployment.md](deployment.md), then finish:

- [x] Render health returns 200 with `UP`; anonymous students/courses return 401.
- [x] Production frontend redeployed and ADMIN dashboard loads records.
- [x] Anonymous frontend session is denied and workspace response redirects to login.
- [ ] Inspect the issued login cookie in the browser: Secure, HttpOnly, SameSite=Lax.
- [ ] USER and ADMIN flows work on the deployed system, including persistence.
- [ ] Mobile navigation/forms and session behavior work at the production URL.
- [ ] Free-tier wake-up behavior is understood and the backend is ready before the demo.
- [ ] Confirm real credentials are absent from Git, screenshots, and submitted documentation.
- [x] Record the verified public links and deployed application commit below and in the root README.

## Submission record

| Item | Value |
|---|---|
| Repository | https://github.com/AaqibAR/student-management-system |
| Frontend production URL | https://student-management-system-henna-rho.vercel.app |
| Backend production URL | https://student-management-api-pqza.onrender.com |
| Backend health URL | https://student-management-api-pqza.onrender.com/actuator/health |
| Deployed application commit | `a274732f10bd6b83c14861ce7e5c496dd7a52990` |
| Live verification date | 2026-10-16 (read-only HTTP checks and user-provided ADMIN dashboard screenshot) |

Provide these public links and the repository documentation for handover.
Share any demo-account credentials separately through the intended private channel.
