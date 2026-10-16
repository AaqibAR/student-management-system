# Student Management frontend

Next.js 16.4, React 19.3, TypeScript, and Tailwind CSS. Use Node.js 22.

## Local setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Set `API_BASE_URL` to the Spring API origin and `APP_ORIGIN` to the exact
frontend origin, without a trailing slash. Defaults in the example use
localhost:8080 and localhost:3000. Run Spring Boot in a separate terminal.
Older `.env.local` files with `NEXT_PUBLIC_API_BASE_URL` still work as a fallback;
`API_BASE_URL` takes precedence.

The browser calls Next.js `/api/auth/*` and `/api/data/*` routes. Next.js keeps
the backend JWT in an HttpOnly cookie and relays it as a Bearer header. Never
put database credentials or JWT_SECRET in this application.

## Pages

- `/login`, `/register`: public authentication forms.
- `/dashboard`: protected overview with live totals and recent records.
- `/students`, `/courses`: protected record lists with search, sorting, paging,
  responsive cards, and ADMIN-only add/edit/delete dialogs.

Registration creates USER accounts. Spring Boot enforces all permissions.

## Checks

```bash
npm run test:records
npm run lint
npm run build
npm run test:auth
```

`test:auth` requires a completed production build. It starts and stops its own
loopback-only mock backend and Next server. Ports 8181 and 3030 must be unused;
set `AUTH_TEST_BACKEND_PORT` and `AUTH_TEST_APP_PORT` to use other local ports.
It does not connect to Supabase. The 17 record tests use jsdom and do not verify
real browser layout or native dialog focus trapping.

## Hosting

Use Vercel with repository root directory `frontend` and framework Next.js.
The application needs server rendering and route handlers; do not use static
export hosting. Use Production environment variables `API_BASE_URL` and
`APP_ORIGIN`, and redeploy after changing them.

See the [full deployment guide](../docs/deployment.md),
[architecture](../docs/architecture.md), and
[release checklist](../docs/release-checklist.md).
