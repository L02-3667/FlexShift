# FlexShift Backend Deployment On Render

This guide applies only to `backend/`.

- The Expo app is a mobile client and is not deployed to Render as a web frontend.
- `render.yaml` is intentionally backend-only.
- Docker is not required for the current Render setup.

## What is already wired in the repo

- `render.yaml` deploys a native Node web service from `backend/`
- `rootDir: backend` keeps the monorepo deployment backend-scoped
- `buildCommand` installs backend deps, generates Prisma client, and builds NestJS
- `preDeployCommand` runs `npm run db:migrate:deploy`
- `startCommand` runs `npm run start:prod`
- health check path is `/api/health/readiness`
- Swagger UI is served at `/api/docs`
- OpenAPI JSON is served at `/api/docs-json`
- `.github/workflows/backend-render.yml` runs backend CI against PostgreSQL before Render auto-deploys on `checksPass`

## Why the previous audit still could not confirm Neon was fully connected

Neon existing in the operator account is only one part of the rollout. The audit remained incomplete because the repo could not prove all of the following at the same time:

1. Render runtime `DATABASE_URL` is actually set to the Neon connection string.
2. The running backend process is booting with that runtime `DATABASE_URL`, not with a local `backend/.env`.
3. Prisma migrations have already been applied to the Neon database.
4. The deployed backend has successfully booted and passed `/api/health/readiness` against that database.

There was an additional source of ambiguity in local verification:

- the NestJS app already preferred `.env.local`, then `.env.development`, then `.env`
- backend helper scripts did not previously follow the same precedence
- an ignored local `backend/.env` can still point to `127.0.0.1:5432/flexshift`

That combination made it possible for Neon to exist while local checks and local runs still behaved like localhost PostgreSQL.

## Required Render environment variables

Set these on the Render service itself:

- `APP_ENV=production`
- `DATABASE_URL=<Neon pooled or direct Postgres URL>`
- `JWT_ACCESS_SECRET=<strong random secret>`
- `JWT_REFRESH_SECRET=<strong random secret>`
- `PUBLIC_API_BASE_URL=https://<your-render-service>.onrender.com`
- `API_DOCS_ENABLED=true`
- `API_DOCS_PATH=docs`
- `CORS_ALLOW_CREDENTIALS=false`
- `SYNC_BATCH_LIMIT=250`
- `SYNC_DEFAULT_STALE_MS=300000`

Optional but recommended:

- `CORS_ALLOWED_ORIGINS=https://<browser-origin-1>,https://<browser-origin-2>`

Notes:

- `PUBLIC_API_BASE_URL` must be the public service base URL only. Do not append `/api`.
- Do not commit or hardcode the Neon URL anywhere in source control.
- Native mobile requests are allowed without an `Origin` header, so `CORS_ALLOWED_ORIGINS` is only for browser clients.

## Local development vs cloud database behavior

The backend uses `DATABASE_URL` only.

Effective precedence is:

1. runtime OS env vars
2. `backend/.env.local`
3. `backend/.env.development`
4. `backend/.env`

Implications:

- if `backend/.env` still points to `127.0.0.1`, local backend runs will continue to use local Postgres until a higher-priority value overrides it
- Render ignores those local files and instead uses the service env vars configured in the dashboard
- creating a Neon database does not change any backend runtime by itself

Use this command before auditing any environment:

```bash
npm run backend:db:check
```

It reports:

- the effective source of `DATABASE_URL`
- a redacted database URL
- host
- port
- database name
- schema
- `sslmode`
- whether the target is a loopback host

For a correct Render/Neon deployment, the effective target must not be loopback.

## Neon expectations

Neon is the real production target, but the backend is only production-ready when all of these are true:

1. Neon project/database has been created by the operator.
2. Render `DATABASE_URL` points to that Neon database.
3. `prisma migrate deploy` has been applied to that same database.
4. The backend boots successfully with that URL.
5. `/api/health/readiness` returns `database: up`.

These are separate steps:

- creating the Neon DB
- configuring `DATABASE_URL`
- applying migrations
- optionally seeding
- booting the backend successfully against Neon

## Migration readiness

Current production migration path:

```bash
npm run backend:prisma:migrate:deploy
```

Equivalent inside `backend/`:

```bash
npm run db:migrate:deploy
```

This is the correct production command because it applies checked-in migrations without generating new ones.

Current migration inventory:

- `backend/prisma/migrations/20260410_phase3_production_hardening/migration.sql`

That migration creates the current Prisma schema for a fresh PostgreSQL database, including:

- auth/session tables
- shifts, open shifts, requests, approvals
- announcements and acknowledgements
- notifications
- sync/audit tables
- checklist tables

Do not use `prisma migrate dev` on Render.

## First production deployment order

Use this order for the first real Neon-backed Render deploy:

1. Confirm the Neon database already exists.
2. Put the Neon connection string into the Render service `DATABASE_URL` secret.
3. Set all other required Render env vars.
4. Set `PUBLIC_API_BASE_URL` to the final Render URL, without `/api`.
5. Deploy or redeploy the Render service from `render.yaml`.
6. Let `preDeployCommand` run `npm run db:migrate:deploy`.
7. Let the backend start with `npm run start:prod`.
8. Check Render logs for the Prisma connection summary and confirm the DB target is not loopback.
9. Check `GET /api/health/readiness`.
10. Check `GET /api/docs` and `GET /api/docs-json`.
11. Only run seed if you intentionally need sample/bootstrap data in that environment.

If Render ever skips `preDeployCommand` for plan or platform reasons, run `npm run db:migrate:deploy` manually as a one-off backend job before sending traffic to the new deploy.

## Render configuration review

The current monorepo Render setup is backend-correct:

- service type: `web`
- runtime: `node`
- `rootDir: backend`
- `buildCommand: npm ci && npm run prisma:generate && npm run build`
- `preDeployCommand: npm run db:migrate:deploy`
- `startCommand: npm run start:prod`
- `healthCheckPath: /api/health/readiness`
- `autoDeployTrigger: checksPass`

This does not treat the Expo app as a deployed web app.

## CI/CD behavior

`.github/workflows/backend-render.yml` currently:

- runs only for backend/deployment path changes
- provisions PostgreSQL in GitHub Actions
- sets `DATABASE_URL` to CI Postgres
- runs `npx prisma migrate deploy`
- runs Prisma generate
- runs backend typecheck
- runs backend tests
- runs backend build

That workflow validates the backend deploy path, but it does not prove the Render dashboard secrets or Neon runtime target. That final step still belongs to the operator-owned Render environment.

## API docs and health routes

Public backend routes after deployment:

- Swagger UI: `/api/docs`
- OpenAPI JSON: `/api/docs-json`
- Health summary: `/api/health`
- Liveness: `/api/health/liveness`
- Readiness: `/api/health/readiness`

Examples:

- `https://<your-render-service>.onrender.com/api/docs`
- `https://<your-render-service>.onrender.com/api/docs-json`
- `https://<your-render-service>.onrender.com/api/health/readiness`

## CORS behavior in production

Current production behavior is intentionally narrow:

- requests with no `Origin` header are allowed
- this keeps native mobile app requests working
- browser requests are allowed only when the origin is listed in `CORS_ALLOWED_ORIGINS`
- loopback browser origins are only auto-allowed outside production

Swagger UI still works on the deployed backend because it is served from the same backend origin.

## Seed decision

Seed data is optional for Neon production.

- the backend schema does not require seed data just to boot
- migrations are required
- seed is only required if you want sample accounts and demo operational data
- current seed resets business tables before inserting sample data, so it should not be run on a live production database unless that destructive effect is explicitly intended

## What "flexshift" means in the current implementation

In this repo, `flexshift` is used as a database name in local examples only.

- local helper defaults use `POSTGRES_DB=flexshift`
- the local ignored `backend/.env` currently points to `/flexshift`
- Prisma schema objects live in the `public` schema by default
- there is no Prisma model or SQL table literally named `flexshift`

So in the current implementation:

- `flexshift` = local database name convention
- `public` = schema name
- `flexshift` is not a table/resource name

For Neon, the actual database name is whatever appears in the configured `DATABASE_URL` path.

## Troubleshooting

### Neon already exists, but the app still behaves like local Postgres

Symptoms:

- `backend:db:check` reports `isLoopback: true`
- startup logs mention `host=127.0.0.1` or `host=localhost`
- Render deploy passes build but the data clearly comes from local/dev assumptions

Actions:

1. Run `npm run backend:db:check` in the environment you are auditing.
2. Confirm which source won for `DATABASE_URL`.
3. If the winning source is `backend/.env`, override it with `backend/.env.local`, `backend/.env.development`, or exported env vars as appropriate.
4. On Render, verify the service `DATABASE_URL` secret is the Neon URL.
5. Redeploy so `preDeployCommand` runs migrations against that URL.
6. Re-check logs and `/api/health/readiness`.

### Neon exists, but migrations were never applied

Symptoms:

- backend fails during startup or first query
- readiness does not become healthy
- Prisma reports missing tables or relations

Actions:

1. Run `npm run db:migrate:deploy` against the Neon `DATABASE_URL`.
2. Redeploy the backend.
3. Re-check readiness.

### Swagger UI loads, but browser API requests fail

Symptoms:

- docs page opens
- browser requests from a different origin are blocked

Actions:

1. Keep same-origin Swagger UI access on the deployed backend if possible.
2. If a separate browser app calls the API, add that browser origin to `CORS_ALLOWED_ORIGINS`.
3. Do not broaden CORS just for the native mobile app; native requests already work without `Origin`.

### `PUBLIC_API_BASE_URL` is wrong

Symptoms:

- Swagger generated server URL looks wrong
- docs show duplicated `/api` prefixes or a stale hostname

Actions:

1. Set `PUBLIC_API_BASE_URL` to `https://<render-service>.onrender.com`
2. Do not include `/api`
3. Redeploy

### Seed was run on the wrong database

Symptoms:

- demo users appear unexpectedly
- business data is missing

Actions:

1. Stop running `backend:prisma:seed` on production by default.
2. Restore from backup if needed.
3. Treat seed as optional/demo-only unless you intentionally want bootstrap data.

## Post-deploy verification checklist

Run this checklist after each production deploy:

1. Render deploy completed successfully.
2. `preDeployCommand` completed successfully.
3. Startup logs show a non-loopback PostgreSQL host.
4. `GET /api/health/liveness` returns success.
5. `GET /api/health/readiness` returns `status: ready` and `database: up`.
6. `GET /api/docs` loads Swagger UI.
7. `GET /api/docs-json` returns OpenAPI JSON.
8. Swagger UI can authorize with a real access token and call at least one authenticated endpoint.
9. At least one CRUD resource in Swagger is fully documented and matches the current codebase.
10. Mobile native requests still work without an `Origin` header.
11. Any required browser origins are present in `CORS_ALLOWED_ORIGINS`.
12. No production logs indicate a loopback database target.
