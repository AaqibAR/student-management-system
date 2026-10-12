# Day 2: Database and Backend Core

## Implemented

- Students, Courses, and Users tables in the app schema
- Row Level Security enabled on all three tables
- JPA entities and repositories for all three tables
- Students and Courses CRUD APIs
- Request and response DTOs
- Basic input validation and duplicate prevention
- Hibernate schema validation

The Users entity and repository prepare for Day 4 authentication.
No user account endpoints are implemented yet.

## API Endpoints

Base URL: http://localhost:8080

| Method | Students | Courses | Success status |
|---|---|---|---|
| POST | /api/students | /api/courses | 201 |
| GET | /api/students | /api/courses | 200 |
| GET | /api/students/{id} | /api/courses/{id} | 200 |
| PUT | /api/students/{id} | /api/courses/{id} | 200 |
| DELETE | /api/students/{id} | /api/courses/{id} | 204 |

PUT requires the complete set of mandatory fields.

## Manual Postman Verification

Test date: 2026-10-12

| Test | Students | Courses |
|---|---|---|
| Create valid record | Passed: 201 | Passed: 201 |
| List records | Passed: 200 | Passed: 200 |
| Get record by ID | Passed: 200 | Passed: 200 |
| Update record | Passed: 200 | Passed: 200 |
| Read back updated values | Passed | Passed |
| Delete record | Passed: 204 | Passed: 204 |
| Get deleted record | Passed: 404 | Passed: 404 |
| Repeat identical create request | Passed: 409 | Passed: 409 |
| Invalid input | Blank first name: 400 | Credits set to 0: 400 |

These are manual verification results, not automated test coverage.

## Current Limitations

- Frontend API integration is planned for Day 3.
- API authentication and authorization are planned for Day 4.
- Students and Courses currently have no enrollment relationship.