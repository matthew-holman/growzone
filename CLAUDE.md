# Growzone — Claude Code Reference

## Project Overview

Growzone is a Swedish grow calendar API. A user provides a Swedish postcode and selects crops; the API returns a month-by-month sowing, planting, and harvest calendar calibrated to their local climate zone. Sweden is divided into 5 growing zones based on latitude. All climate logic, crop data, and recommendations are Sweden-specific. This is not a generic gardening tool.

## Tech Stack

- **Runtime**: Node 20
- **Language**: TypeScript (strict mode — `noImplicitAny`, `strictNullChecks`, explicit return types on exported functions)
- **Framework**: Hono
- **Database**: PostgreSQL via Drizzle ORM
- **Validation**: Zod — used at API boundaries and to validate data files at startup
- **Testing**: Vitest
- **External API**: Nominatim (OpenStreetMap) for postcode geocoding — no API key required; must include a descriptive `User-Agent` header per their usage policy (e.g. `growzone/1.0 (contact@example.com)`)

## Architecture and Key Decisions

**Monolith.** This is a single deployable unit. Do not suggest microservices, separate services, or splitting modules into independent deployables.

**Zone classifier is a pure function.** `src/zoneClassifier.ts` exports a single function `(lat: number, lng: number) => Zone | null`. It must remain pure — no DB access, no HTTP calls, no side effects. It must be independently testable without any test setup. Sweden's 5 zones are determined by latitude ranges; the classifier encodes that logic directly.

**Crop calendar data lives in `src/data/crops.json`.** This file is validated against a Zod schema at application startup. If it fails validation, the process must not start. Crop data is not stored in the database at this stage. It is the authoritative source for all horticultural logic and will be reviewed externally — keep it strictly separate from application code.

**Nominatim is called once per user at signup.** The resolved `lat`, `lng`, and `zone_id` are written to the user's database row at that point. There is no geocoding cache — it is not needed because geocoding happens only once per user.

**No in-process caching.** Do not introduce `Map`-based TTL caches, node-cache, Redis, or any other caching layer. PostgreSQL is the only data store. If performance becomes a concern, address it at the database level.

**No authentication yet.** Auth is planned but out of scope for the current phase. Do not scaffold auth middleware, JWT handling, session logic, or protected routes.

## Database

PostgreSQL accessed via Drizzle ORM. Schema definitions live in `src/db/schema.ts`. Generated migration files live in `src/db/migrations/`.

The `users` table stores:

| Column | Type |
|--------|------|
| `id` | UUID (primary key) |
| `email` | text |
| `postcode` | text |
| `lat` | double precision |
| `lng` | double precision |
| `zone_id` | integer |
| `created_at` | timestamp with time zone |

## Project Structure

```
src/
  index.ts            — entry point, starts the Hono server
  router.ts           — Hono route definitions
  zoneClassifier.ts   — pure zone resolution function: (lat, lng) => Zone | null
  geocoder.ts         — Nominatim wrapper module
  calendarLookup.ts   — loads crops.json at startup, validates with Zod, exposes query functions
  db/
    schema.ts         — Drizzle schema definitions
    migrations/       — generated migration files
  data/
    crops.json        — crop × zone calendar data (source of truth for horticultural logic)
  zoneClassifier.test.ts — unit tests for the zone classifier
```

## Conventions

**Validation at the boundary.** All route handlers validate inputs with Zod before any business logic runs. If a request fails validation, return a structured error immediately.

**Structured errors.** All error responses use the shape `{ error: string, message: string }`. Never let raw exceptions propagate to the HTTP response. Never return unstructured 500s.

**Routes orchestrate; modules do the work.** Route handlers call into `geocoder`, `zoneClassifier`, `calendarLookup`, and db modules — they do not contain business logic themselves.

**Pure functions preferred.** Side effects (database writes, HTTP calls) are pushed to the edges. Core logic — zone classification, calendar lookup — must be pure and independently testable.

**Crop data is separate.** `src/data/crops.json` is data, not code. Do not import application utilities into it, do not inline its contents into application modules, and do not move it into the database prematurely.

## Current Phase

Phase 1 MVP. The immediate deliverable is a single `GET /calendar?postcode=` endpoint that:

1. Geocodes the postcode via Nominatim
2. Resolves the climate zone using the zone classifier
3. Looks up and returns a crop calendar from `crops.json`

The PostgreSQL schema and Drizzle setup must be scaffolded in this phase even though the current endpoint does not write to the database. The signup flow (next phase) will need it.

## Out of Scope

The following are explicitly not part of the current phase. Do not implement or scaffold them unless directly instructed:

- User authentication or session management
- Zone modifiers (greenhouse, elevation, balcony, soil type)
- Email or push reminders
- More than 5 crops
- Variety-level recommendations
- Any frontend or UI
