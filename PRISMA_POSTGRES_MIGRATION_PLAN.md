# Prisma Postgres / Accelerate Migration Plan

## Decision Summary

This repo currently has:

- a Python `FastAPI` backend in `backend/server.py`
- direct MongoDB access via `motor`
- frontend API calls that expect the current `/api/...` contract to stay stable

The important constraint is:

- the `prisma+postgres://accelerate.prisma-data.net/...` connection format is for Prisma's HTTP-based Accelerate path
- the current Python backend cannot use that URL as its normal runtime database connection

Because of that, there are only two valid migration tracks:

1. Recommended now: keep the Python/FastAPI backend and move the data layer to Prisma Postgres over standard PostgreSQL TCP connections.
2. Larger rewrite: replace the backend with a Node/TypeScript Prisma ORM service so it can use Prisma Accelerate directly at runtime.

This plan is for Track 1 now, while preserving an easy future move to Track 2 if needed.

## Security First

The pasted Prisma API key should be treated as compromised because it has already been placed in chat history.

Do this before implementation:

1. Rotate the Prisma API key in Prisma Console.
2. Do not commit the old or new key to git.
3. Store secrets only in local `.env` files or your deployment secret manager.

## Recommended Target Architecture

Phase 1 target:

- Database: Prisma Postgres
- Backend runtime: Python `FastAPI`
- Python DB layer: `SQLAlchemy 2.x` async plus `asyncpg`
- Migrations: `Alembic`
- Frontend: no contract changes

Phase 2 optional later:

- Runtime caching/pooling via Prisma Accelerate, but only after a backend rewrite to Node/TypeScript with Prisma ORM

## Why This Is The Better Path

- It avoids rewriting the whole backend just to change the database.
- The current backend is tightly coupled to Mongo calls, but not to any Mongo-only aggregation pipeline.
- The data access patterns are mostly CRUD, filtering, counts, sorting, and pagination, which map well to PostgreSQL.
- Using Prisma Migrate and SQLAlchemy together would create two schema owners. That is unnecessary complexity in a Python backend.

## Current Mongo-Coupled Areas

The current code uses Mongo collections directly inside route handlers for:

- `users`
- `user_sessions`
- `facilities`
- `attendance`
- `notifications`
- `shift_config`

These calls are spread throughout `backend/server.py`, so the migration must first isolate persistence behind a small database layer.

## Environment Model

Use separate environment variables for Prisma platform access and Python runtime DB access.

Suggested variables:

```env
# Prisma platform / console / future Prisma tooling
PRISMA_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=<ROTATED_KEY>"

# Python app runtime connection to Prisma Postgres over standard PostgreSQL TCP
DATABASE_URL="<DIRECT_OR_POOLED_POSTGRES_TCP_URL_FROM_PRISMA_CONSOLE>"

# Existing app settings that stay in place
JWT_SECRET="<secret>"
CORS_ORIGINS="http://localhost:3000"
RESEND_API_KEY=""
SENDER_EMAIL="onboarding@resend.dev"
BACKUP_EMAIL=""
```

Notes:

- `PRISMA_DATABASE_URL` is not the FastAPI runtime connection string.
- `DATABASE_URL` must be the conventional PostgreSQL connection string generated from Prisma Console direct or pooled TCP access.
- During implementation, `DATABASE_URL` will be adapted to the SQLAlchemy async driver format used by the app.

## Prisma Config Note

If Prisma tooling is added later at the repo root, the config should start like this:

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("PRISMA_DATABASE_URL"),
  },
});
```

This is for Prisma tooling, not for the Python app runtime.

## Proposed PostgreSQL Schema

### `users`

Columns:

- `id` bigserial primary key
- `user_id` text unique not null
- `email` text unique not null
- `password_hash` text null
- `name` text not null
- `phone_number` text null
- `position` text null
- `province` text null
- `district` text null
- `facility` text null
- `area_of_allocation` text null
- `picture` text null
- `role` text not null default `'user'`
- `assigned_scope` jsonb null
- `assigned_jurisdiction` jsonb null
- `assigned_shift` text null
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

Indexes:

- unique index on `email`
- unique index on `user_id`
- index on `role`
- index on `facility`
- index on `district`

### `user_sessions`

Columns:

- `id` bigserial primary key
- `session_token` text unique not null
- `user_id` text not null
- `expires_at` timestamptz not null
- `created_at` timestamptz not null default now()

Indexes:

- unique index on `session_token`
- index on `user_id`
- index on `expires_at`

### `facilities`

Columns:

- `id` bigserial primary key
- `facility_id` text unique null
- `name` text not null
- `district` text not null
- `province` text not null
- `latitude` double precision null
- `longitude` double precision null
- `created_at` timestamptz not null default now()

Indexes:

- unique index on `facility_id` where not null
- unique composite index on `(name, district)`
- index on `district`
- index on `province`

### `attendance`

Columns:

- `id` bigserial primary key
- `attendance_id` text unique not null
- `offline_id` text unique null
- `user_id` text not null
- `user_name` text not null
- `position` text not null
- `facility` text not null
- `area_of_allocation` text null
- `action` text not null
- `timestamp` timestamptz not null
- `latitude` double precision null
- `longitude` double precision null
- `shift_type` text null
- `synced` boolean not null default true

Indexes:

- unique index on `attendance_id`
- unique index on `offline_id` where not null
- index on `user_id`
- index on `facility`
- index on `timestamp`
- index on `(user_id, timestamp desc)`

### `notifications`

Columns:

- `id` bigserial primary key
- `notification_id` text unique not null
- `type` text not null
- `user_id` text null
- `user_name` text null
- `facility` text null
- `message` text not null
- `distance_meters` integer null
- `latitude` double precision null
- `longitude` double precision null
- `timestamp` timestamptz not null
- `read` boolean not null default false
- `attendance_id` text null

Indexes:

- unique index on `notification_id`
- index on `facility`
- index on `read`
- index on `timestamp`

### `shift_config`

Columns:

- `id` bigserial primary key
- `config_id` text unique not null default `'default'`
- `morning_start` text not null
- `morning_end` text not null
- `afternoon_start` text not null
- `afternoon_end` text not null
- `night_start` text not null
- `night_end` text not null
- `four_off_start` text not null
- `four_off_end` text not null
- `on_call_start` text not null
- `on_call_end` text not null
- `grace_period_minutes` integer not null default 15
- `updated_at` timestamptz not null default now()

## File And Module Refactor Plan

Before switching databases, split the current single-file backend into a minimal structure:

- `backend/db/session.py`
- `backend/db/models.py`
- `backend/db/repositories/users.py`
- `backend/db/repositories/facilities.py`
- `backend/db/repositories/attendance.py`
- `backend/db/repositories/notifications.py`
- `backend/db/repositories/shift_config.py`
- `backend/alembic/`
- `backend/alembic.ini`

Initial route logic can stay in `backend/server.py`, but database calls should move into repository functions first.

## Implementation Phases

### Phase 0: Preparation

1. Rotate the exposed Prisma key.
2. Provision the Prisma Postgres database.
3. Generate a standard PostgreSQL TCP connection string in Prisma Console.
4. Add `.env.example` entries for the new database variables.
5. Remove `motor` and Mongo-only assumptions from the implementation plan, but do not uninstall anything yet.

### Phase 1: Introduce PostgreSQL Infrastructure

1. Add dependencies for:
   - `sqlalchemy`
   - `asyncpg`
   - `alembic`
2. Create async engine and session helpers.
3. Add SQLAlchemy models matching the schema above.
4. Generate the initial Alembic migration.
5. Apply migrations against the new Prisma Postgres database.

### Phase 2: Move Database Access Behind Repositories

1. Replace direct `db.users...` access with repository methods.
2. Replace direct `db.user_sessions...` access with repository methods.
3. Replace direct `db.facilities...` access with repository methods.
4. Replace direct `db.attendance...` access with repository methods.
5. Replace direct `db.notifications...` access with repository methods.
6. Replace direct `db.shift_config...` access with repository methods.

Goal:

- route handlers should stop knowing whether the backing store is Mongo or PostgreSQL

### Phase 3: Port Endpoint Groups In Safe Order

Port in this sequence:

1. Auth/session endpoints
   - `/auth/register`
   - `/auth/login`
   - `/auth/session`
   - `/auth/me`
   - `/auth/logout`
2. Lookup endpoints
   - `/facilities`
   - `/positions`
   - `/areas`
   - `/provinces`
   - `/districts/{province}`
   - `/facilities/{district}`
3. Attendance endpoints
   - `/attendance`
   - `/attendance/sync`
   - `/attendance/me`
   - `/attendance/status`
4. Admin notification and user management endpoints
5. Reports and export endpoints
6. Superuser endpoints

### Phase 4: Data Migration

Write a one-time import script:

- source: existing Mongo collections
- target: new PostgreSQL tables

Recommended import order:

1. `facilities`
2. `users`
3. `shift_config`
4. `attendance`
5. `notifications`
6. `user_sessions`

Migration rules:

- convert ISO date strings to `timestamptz`
- preserve public IDs like `user_id`, `attendance_id`, `notification_id`
- keep `assigned_scope` and `assigned_jurisdiction` as JSONB in phase 1
- deduplicate by `email`, `session_token`, `attendance_id`, `offline_id`, and `(name, district)` where needed

### Phase 5: Validation

Validate these flows end to end:

1. Register and login
2. Session cookie auth
3. Attendance login/logout
4. Offline attendance sync idempotency via `offline_id`
5. Admin notification generation for GPS issues
6. Admin user updates and shift assignment
7. Superuser facility CRUD
8. Exports and backup email flow

### Phase 6: Cutover

1. Take a final Mongo backup.
2. Run the import script on the latest data.
3. Point the backend to PostgreSQL.
4. Run smoke tests.
5. Keep Mongo in read-only fallback mode until confidence is high.

## Risks And Decisions

### Risk 1: Single-file backend

`backend/server.py` mixes routing, auth, validation, and persistence. This is the main reason the migration is not a quick swap.

Mitigation:

- extract repositories first

### Risk 2: Duplicate schema ownership

Using Prisma schema/migrations and SQLAlchemy/Alembic at the same time will create drift risk.

Decision:

- Phase 1 uses SQLAlchemy + Alembic as the single source of truth for schema

### Risk 3: Accelerate expectation mismatch

The current `prisma+postgres://` URL does not become the Python app connection string.

Decision:

- use Prisma Postgres as the database provider now
- reserve Prisma Accelerate runtime usage for a future Node/TypeScript rewrite

### Risk 4: Data cleanup

Mongo may contain:

- null or inconsistent timestamp strings
- duplicate facilities
- duplicate offline attendance records

Mitigation:

- build cleanup rules into the import script and log every skipped or merged record

## Deliverables

Implementation is complete for Phase 1 when the repo has:

- PostgreSQL-backed FastAPI runtime
- Alembic-managed schema
- repository layer replacing direct Mongo calls
- successful import of existing Mongo data
- passing auth, attendance, admin, and superuser smoke tests

## Future Track: Full Prisma Accelerate Runtime

Only choose this if you want to replace the Python backend.

That future plan would require:

1. Create a Node/TypeScript backend.
2. Rebuild the current API contract in that service.
3. Use Prisma ORM and Prisma Client.
4. Use the `prisma+postgres://accelerate...` URL for runtime through Prisma.
5. Retire the Python FastAPI backend after parity testing.

That is a product rewrite, not just a database migration.
