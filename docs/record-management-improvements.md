# Record management improvements

Students and Courses now use the dashboard's workspace palette, consistent
headings, summary cards, buttons, spacing, and record actions.

## Behavior

- Search the full loaded collection, ignoring case and extra spaces. Student
  search includes number, name, email, and phone. Course search includes code,
  name, description, and credits. Multiple search terms must all match.
- Sort by newest, oldest, or name; student numbers and course codes use natural
  numeric ordering. Courses can also be sorted by credits.
- Choose 5, 10, or 25 records per page. Searching, sorting, and changing page size
  return to page 1. Deleting the last record on a page clamps to a valid page.
- ADMIN accounts open add/edit forms in native modal dialogs. USER accounts
  retain view access, with no add, edit, or delete controls. Spring Boot remains
  responsible for enforcing permissions.
- Both client validation and backend field errors appear beside the relevant
  input. The first invalid field receives focus. Failed saves retain input.
  Course descriptions are limited to 5,000 characters and credits to integers
  from 1 to 30, matching the backend DTO.
- Save and delete actions prevent duplicate requests and lock dismissal while
  pending. Deletion names the record and requires confirmation. A failure keeps
  the confirmation open for retry. There is no undo after a successful deletion.
- Successful mutations update the loaded list from the API response. Adding a
  record clears search and shows newest first so the new record is visible.
- Initial loads show skeletons. Refresh failures preserve existing records,
  identify them as previously loaded, and provide retry. Mutations are disabled
  until a refresh succeeds.
- Desktop widths use tables; widths up to 1,100px use record cards. Forms stack
  on phones, use larger text inputs, and have a scrollable dialog with actions.
  Course descriptions can be expanded instead of crowding the list.
- All existing reduced-motion preferences continue to apply.

Search, sorting, and pagination are client-side over the existing list APIs.
This improves navigation but still downloads the complete collection. For a
large dataset, implement backend pagination/search and a separate totals API.
The database schema and backend endpoints do not require changes for this patch.

## Automated checks

Preparation results: production build, TypeScript, lint, all 17 record tests,
and all 13 existing auth HTTP integration groups passed. Backend code was not
changed; this pass did not rerun the backend test suite.

Install the updated development dependencies in `frontend` with `npm ci`.
The only added dependency is jsdom, used for tests; application runtime
dependencies are unchanged.

```bash
npm run test:records
npm run lint
npm run build
```

The records suite covers search, natural ordering, pagination boundaries,
USER controls, ADMIN creation/editing/deletion, validation/focus, preserved
input, duplicate errors, retry, and pending-request behavior.

After `npm run build`, `npm run test:auth` runs the 13 auth HTTP groups and
automatically manages its fixture servers. The equivalent manual commands
remain below.

The existing 13 auth HTTP integration groups also run against the production
Next server and test-only API fixture. Use separate terminals in `frontend`:

```bash
node tests/mock-auth-backend.mjs
```

```bash
API_BASE_URL=http://127.0.0.1:8181 \
APP_ORIGIN=http://localhost:3030 \
npm run start -- --hostname 127.0.0.1 --port 3030
```

```bash
node --test tests/auth.integration.test.mjs
```

Stop both fixture servers after testing. These tests use disposable in-memory
records and do not connect to Supabase. DOM tests provide a simple dialog
polyfill because jsdom does not implement native modal behavior or layout.

## Manual visual and browser checks

Real browser automation was unavailable during preparation. DOM interaction
tests do not establish visual correctness or native focus trapping. Complete
these checks locally before calling the UI fully verified:

- [ ] At 360, 768, 1024, and 1440px, check Overview, Students, Courses, and mobile
  navigation. No page-wide horizontal scrolling or clipped controls.
- [ ] Sign in as USER: search/sort/paginate on both pages; no mutation controls.
- [ ] Sign in as ADMIN: create, edit, and delete disposable students and courses.
- [ ] Use long names, long emails, missing phone numbers, and long descriptions.
- [ ] Open a dialog with the keyboard; Tab/Shift+Tab stay within it, Escape
  closes it while idle, and focus returns sensibly after closing/deletion.
- [ ] On a phone, open a long form with the on-screen keyboard and reach the
  fields, error messages, Cancel, and Save buttons without clipping.
- [ ] Try invalid fields, a duplicate record, and a temporarily unavailable API;
  verify errors, retained input, retry, and no duplicate submissions.
- [ ] Confirm logout, expired-session redirects, and reduced-motion behavior.
