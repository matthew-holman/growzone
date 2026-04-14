# growzone

Backend API for the Grow Zone app — serves Swedish growing-zone calendars by postcode.

Built with Hono, Drizzle ORM, and PostgreSQL.

## Prerequisites

- Node 20+
- Docker (for the database)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Key variables:

| Variable            | Description                                              |
|---------------------|----------------------------------------------------------|
| `DATABASE_URL`      | PostgreSQL connection string                             |
| `NOMINATIM_CONTACT` | Your email — included in API `User-Agent` headers       |

### 3. Start the database

```bash
docker compose up -d
```

### 4. Run migrations

```bash
npm run db:migrate
```

### 5. Seed postcode data

Postcode data is produced by the `swedish-climate-data` repository.
Copy the enriched postcode file before running the seed script:

```bash
cp ../swedish-climate-data/output/postcodes-enriched.json src/data/
```

Then seed the database:

```bash
npm run db:seed-postcodes
```

Safe to re-run — existing rows are updated in place.

### 6. Seed weather stations

Weather station climate data is produced by the `swedish-climate-data` repository.
Copy the file before running the seed script:

```bash
cp ../swedish-climate-data/output/weather-stations.json src/data/
```

Then seed:

```bash
npx tsx scripts/seed-stations.ts
```

Safe to re-run — existing rows are updated in place.

### 7. Seed crops

```bash
npx tsx scripts/seed-crops.ts
```

Re-run whenever `src/data/crops-v2.json` is updated. The database is
the source of truth — the JSON file is the initial dataset only.
An admin UI for managing crops is planned for a future phase.

## Development

```bash
npm run dev    # Start dev server with hot reload (http://localhost:8000)
npm test       # Run tests
```

API docs are available at `http://localhost:8000/docs` when the server is running.

## Database

```bash
npm run db:generate   # Generate a new migration from schema changes
npm run db:migrate    # Apply pending migrations
```
