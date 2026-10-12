# System Architecture

## Overview

The Student Management System uses three layers:

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS | User interface and API requests |
| Backend | Spring Boot, Spring Data JPA | REST APIs, business logic, and database access |
| Database | Supabase PostgreSQL | Persistent data storage |

## Planned Request Flow

1. The user interacts with the Next.js frontend.
2. The frontend sends HTTP requests to the Spring Boot API.
3. Controllers receive requests and call services.
4. Services apply business rules and call repositories.
5. Repositories access Supabase PostgreSQL through JPA.
6. The API returns JSON responses to the frontend.

Frontend-to-backend API integration will be implemented in a later stage.

## Project Structure

- frontend/ — Next.js application
- backend/ — Spring Boot application
- docs/ — Architecture and setup documentation

## Planned Backend Packages

Under com.aaqib.studentmanagement:

- controller — REST endpoints
- service — Business logic
- repository — Database access
- entity — Database mappings
- dto — Request and response objects
- config — Application configuration
- exception — Error handling

These packages will be created as their features are implemented.

## Configuration

- Frontend runs locally on port 3000.
- Backend runs locally on port 8080.
- Backend connects to Supabase using the Session pooler on port 5432.
- Database connections require SSL.
- Database credentials are supplied through environment variables.
- .env.example files document variables using placeholders.
- Local environment files are excluded from Git.

## Day 1 Scope

Project planning, repository setup, framework initialization,
Supabase project creation, database connectivity, and environment configuration.

Database tables, CRUD APIs, application pages, and JWT authentication
are planned for subsequent stages.