# Day 4 authentication

Backend and frontend authentication are implemented. Use the live verification checklists below alongside the automated tests.

## Endpoints

| Method | Path | Access | Result |
|---|---|---|---|
| POST | /api/auth/register | Public | 201; creates USER and returns an access token |
| POST | /api/auth/login | Public | 200; verifies BCrypt password and returns an access token |
| GET | /api/auth/me | Valid JWT | 200; safe account fields |
| GET | /api/students and /api/students/{id} | USER or ADMIN | Existing read API |
| GET | /api/courses and /api/courses/{id} | USER or ADMIN | Existing read API |
| POST, PUT, DELETE | Student and course API | ADMIN | Existing write API |
| GET | /actuator/health | Public | Existing health response |

Registration always assigns USER. A request containing role=ADMIN cannot grant that role.
Responses and JWT claims never include password hashes. Tokens are signed with HS256 and
expire after 900 seconds. The verifier checks the signature, issuer, required expiration,
and numeric user ID. Spring Security allows its default clock tolerance during verification.
Passwords are never trimmed; registration requires at least eight characters and at most
72 UTF-8 bytes. Emails are normalized to lowercase when saved and looked up without case.

## Configuration

Existing DB_URL, DB_USERNAME and DB_PASSWORD are still required to start the backend.
JWT_SECRET must contain a Base64-encoded random secret of at least 32 decoded bytes.
Generate it once in the backend terminal without printing it:

```bash
export JWT_SECRET="$(openssl rand -base64 32)"
```

Keep the same value for server restarts during testing. A new secret invalidates existing
tokens, so sign in again after changing it. Environment variables must be set again in a
new terminal. The .env.example file only documents placeholders; Spring does not load it.
The default frontend origin remains http://localhost:3000 and can be overridden with FRONTEND_URL.

## Automated validation

Run from backend/ using JDK 21:

```bash
./mvnw -Dtest=AuthServiceTests,JwtConfigTests,AuthSecurityTests test
```

All 48 focused tests passed during preparation. They use a mocked UserRepository and
mocked student/course services. They do not connect to Supabase or change live records.
The existing StudentManagementApplicationTests context test still needs database
credentials and JWT_SECRET if you run the entire test suite.

Coverage includes:

- Registration normalization, BCrypt storage, fixed USER role, duplicate and concurrent duplicate accounts.
- Valid login, generic invalid-credential responses, safe current-account responses.
- Input validation, missing fields, malformed JSON, and multibyte password length boundaries.
- JWT subject, role, issuer, TTL, invalid/short secret configuration, wrong signature,
  expired tokens, incorrect issuer, missing expiry, and tampered tokens.
- Anonymous access rejection and USER read access.
- ADMIN access and USER/anonymous rejection for all six student/course mutations.
- CORS preflights, allowed-origin headers on errors, and rejection of other origins.
- Preservation of course validation and existing 404 record errors.

## Live backend verification checklist

Start the backend with the database environment variables and JWT_SECRET, then use Postman:

1. GET /actuator/health: expect 200 and status UP.
2. GET /api/students without Authorization: expect 401.
3. POST /api/auth/register with name, email, and password: expect 201 and user.role USER.
4. Repeat the same registration: expect 409.
5. POST /api/auth/login with the account's credentials: expect 200 and accessToken.
6. Use Postman's Bearer Token authorization with that token for GET /api/auth/me,
   GET /api/students and GET /api/courses: expect 200.
7. Attempt a student or course write with the USER token: expect 403.
8. Send invalid login credentials: expect 401. Invalid registration fields: expect 400.

To test ADMIN, promote a deliberately chosen test account in the Supabase SQL Editor:

```sql
UPDATE app.users SET role = 'ADMIN' WHERE email = 'YOUR_NORMALIZED_TEST_EMAIL';
```

Log in again after promoting the account; the previous JWT retains its USER role until it
expires. Verify the ADMIN token can add, edit and delete disposable student/course records.
This promotion is manual; it is never accepted through public registration.

## Frontend authentication

Next.js handles browser sessions through an HttpOnly, SameSite=Lax cookie. The cookie
is Secure in production and expires with the Spring JWT. Login and registration return
safe user/session metadata to the browser; the JWT is never placed in localStorage,
sessionStorage, client context, or the frontend response body.

Browser authentication calls go to /api/auth/login and /api/auth/register in Next.js.
Next forwards credentials to Spring Boot and sets the cookie when authentication succeeds.
/api/auth/session verifies the JWT through Spring's /api/auth/me. It preserves the cookie
when the backend is temporarily unavailable, and clears it for invalid or expired sessions.
/api/auth/logout clears the cookie without depending on the backend being available.

Student/course calls go through /api/data/[...path], restricted to the existing collection
and numeric record routes. Next forwards the cookie's JWT in Authorization: Bearer to Spring.
Client-supplied Authorization headers are not forwarded. Spring remains responsible for
JWT signature validation and USER/ADMIN authorization on every data request.

Mutating browser requests require a matching Origin header and reject cross-site fetches.
The expected origin is derived from the request URL for local development. Set APP_ORIGIN
explicitly when deploying behind a reverse proxy. Do not share JWT_SECRET with Next.js;
Next verifies sessions by calling Spring rather than holding its signing key.

Each workspace page checks the session on the server before rendering. The account menu
shows the user and role, with logout in the sidebar and mobile menu. USER accounts get a
view-access notice and no create/edit/delete UI. ADMIN accounts keep the existing CRUD forms.
Role display follows the verified token's role; log in again after a database role change.
Client expiry handling and session checks on focus send ended sessions back to login.
Logout is announced to other open app tabs without sharing the token.

Login and registration share the navy workspace design, labeled inputs, password visibility,
confirmation validation, loading states, and field errors. Reduced-motion settings are respected.

The existing NEXT_PUBLIC_API_BASE_URL remains supported. API_BASE_URL can override it for
server-side calls. No additional npm dependencies or frontend signing secrets are required.

## Frontend automated checks

Production build, TypeScript, lint, and all 13 HTTP integration test groups passed in an
isolated copy. The integration checks use a test-only API fixture and do not alter Supabase.
They cover protected-page redirects, safe session responses, cookies, registration,
error details, CSRF Origin checks, proxy restrictions, USER write rejection, ADMIN CRUD,
logout, expiry, forged tokens, and backend outage recovery.

Browser automation was unavailable during preparation. Use the local browser checklist
below to verify form interactions, animation, desktop/mobile layout, and multi-tab behavior.

The release preparation adds `npm run test:auth` to start and stop the fixture
and Next server automatically after `npm run build`. The manual three-terminal
commands below remain available from frontend/:

```bash
# Terminal 1: test-only backend; this is separate from the real Spring server.
node tests/mock-auth-backend.mjs
```

```bash
# Terminal 2: production Next.js app pointed at the test-only backend.
npm run build
API_BASE_URL=http://127.0.0.1:8181 APP_ORIGIN=http://localhost:3030 npm run start -- --hostname 127.0.0.1 --port 3030
```

```bash
# Terminal 3: black-box tests.
node --test tests/auth.integration.test.mjs
```

The test files contain fake accounts and a fake signing key for local QA only. Keep this
fixture separate from normal development. Normal npm run dev still uses the real backend
URL configured in .env.local. Stop the two test servers after checking them.

## Live frontend verification

Keep Spring Boot running. Start the normal frontend with npm run dev and visit /login.

1. Without logging in, open /dashboard, /students and /courses. Expect a login redirect.
2. Create a new account at /register. Expect the dashboard and a view-access role.
3. Open Students and Courses. Expect real saved records, with no create/edit/delete controls.
4. Sign out, then sign in again. Refresh the page and confirm the session remains available.
5. Test wrong credentials, duplicate registration, and password confirmation mismatch.
6. Open a second tab, then sign out in the first. Confirm the second returns to login.
7. Log in again after promoting the chosen test account to ADMIN with the SQL above.
8. Verify add, edit and delete using disposable records; reload to check persistence.
9. Check login/registration and the mobile menu at 320–390 px and desktop widths.
10. Stop and restart the backend to verify recoverable errors without an unwanted logout.
11. Verify that an expired session returns to login. Production tokens last 15 minutes.

There is no refresh-token or server-side revocation endpoint. Logout removes the browser
cookie, while a separately copied access token can remain valid until its expiry.

## Confirmed live observations

- Backend health returned 200 with status UP; unauthenticated Students returned 401.
- The authenticated USER workspace displayed real Dashboard, Students, and Courses data.
- USER pages displayed view access and hid create/edit/delete controls.
- After promotion and a new sign-in, the account displayed ADMIN and student CRUD controls.
- A newly added student appeared in both the student directory and the dashboard totals.

These observations do not replace the full edit/delete, course CRUD, and mobile/session
checks in the live verification checklist above.
