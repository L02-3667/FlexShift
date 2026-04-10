# FlexShift Phase 3 Production Upgrade

Updated on April 10, 2026.

This document continues the migration-first path defined in `docs/flexshift-production-migration.md`. The codebase was upgraded in-place. No new app was scaffolded, no router rewrite was introduced, and the Phase 2 foundations were kept wherever they were still structurally sound.

## A. Phase 3 Objective Summary

- Move FlexShift from "remote-first foundation" to a production-grade workforce system with PostgreSQL as the only business source of truth and SQLite as the mobile operational store.
- Close the largest trust gaps:
  - no deterministic outbox
  - no delta sync contract
  - no backend mutation ledger for idempotency
  - no device-aware session revocation
  - no audit trail for critical actions
  - no explicit stale/offline sync state on mobile
  - no real DB readiness path
- This phase matters because customers only leave Zalo/Excel/notes when the product is more reliable than the manual workaround. Reliability, conflict explainability, recoverability, and traceability are the trust layer.

## B. Competitive Benchmark Summary

Benchmark was reviewed on April 10, 2026 using official product or vendor documentation.

### 1. Zalo / group chat workflow

What it does well:

- Fast group messaging and lightweight coordination.
- Pinned-message workflow exists, so teams can surface important chat content.

What it still does poorly for operations:

- State is still conversation-shaped instead of entity-shaped.
- Approvals, assignments, acknowledgements, and history remain manual.
- Teams still need to pin messages and search history to recover context.

FlexShift should learn:

- Communication must stay fast and mobile-first.
- Broadcasts and critical updates must be easy to send.

FlexShift should be different:

- Every action is attached to a shift, request, announcement, checklist, or audit event.
- No business-critical state should depend on chat recall.
- Read tracking and acknowledgement should be first-class, not improvised.

Sources:

- https://help.zalo.me/huong-dan/chuyen-muc/nhan-tin-va-goi/nhan-tin/huong-dan-ghim-nhung-tin-nhan-quan-trong/

### 2. Excel / spreadsheet workflow

What it does well:

- Flexible sharing, editing, and co-authoring.
- Familiar to managers and easy for ad-hoc reporting.

What it still does poorly for operations:

- Validation is weak compared with domain workflows.
- Conflicts are human-managed.
- Approval state, audit, and device/session trust are external to the sheet.
- Spreadsheet cells become accidental source of truth.

FlexShift should learn:

- Export and ad-hoc reporting still matter.
- Managers want filtering, sortable views, and lightweight edits.

FlexShift should be different:

- Excel is export surface, not live truth.
- Scheduling, approvals, acknowledgements, and logs must be validated workflows.
- Offline queueing must be safe and replayable, not "someone edited the wrong row."

Sources:

- https://support.microsoft.com/en-us/office/collaborate-in-excel-a8af741e-00f2-44c0-a94b-38abd51af01f

### 3. Note-online workflow

What it does well:

- Fast note capture, comments, co-editing, and async collaboration.
- Useful for handover notes, operating notes, and informal team knowledge.

What it still does poorly for operations:

- Notes do not enforce workflow or ownership.
- Items are not naturally attached to shifts, requests, or approval state.
- Checklists exist, but business truth and audit still drift.

FlexShift should learn:

- Notes and comments are still important as a supporting layer.
- Teams need contextual writing surfaces, not just rigid forms.

FlexShift should be different:

- Notes must be attached to operational entities.
- Checklists, announcements, and audit trail must be structured and queryable.

Sources:

- https://www.notion.com/docs
- https://support.microsoft.com/en-us/office/collaborate-in-excel-a8af741e-00f2-44c0-a94b-38abd51af01f

### 4. Homebase

What it does well:

- Bundles scheduling, time clock, and team communication in one app.
- Explicitly positions read confidence and team communication as part of workforce management.

What it still leaves open:

- Public positioning emphasizes "all-in-one hourly team management" more than offline-deterministic sync.
- The visible moat is breadth, not recoverable degraded-network behavior.

FlexShift should learn:

- Scheduling, time, and communication must feel tightly integrated.

FlexShift should be different:

- Under poor connectivity, FlexShift must still provide local render, safe queueing, replay, and explainable conflict repair.

Sources:

- https://www.joinhomebase.com/free
- https://www.joinhomebase.com/glossary/employee-availability

### 5. When I Work

What it does well:

- Strong scheduling + time tracking + in-app messaging positioning.
- Explicitly replaces messy group texts for shift-based teams.

What it still leaves open:

- Public messaging focuses on cleaner communication, not server-authoritative offline replay.

FlexShift should learn:

- Replace noisy group chat with structured work messaging inside the same app.

FlexShift should be different:

- Every message-worthy event should also have structured operational state and audit.
- Sync and repair under flaky networks should be a visible strength, not an invisible assumption.

Sources:

- https://wheniwork.com/
- https://wheniwork.com/features/team-messaging

### 6. Deputy

What it does well:

- Strong scheduling intelligence and business insight positioning.
- Emphasizes smarter scheduling decisions and operational data.

What it still leaves open:

- Public positioning leans toward optimization and AI scheduling more than recoverable mobile state under bad connectivity.

FlexShift should learn:

- Staffing intelligence and manager insight need to be visible in manager workflows.

FlexShift should be different:

- Scheduling intelligence must sit on top of deterministic sync, not instead of it.

Sources:

- https://www.deputy.com/features/smart-scheduling

### 7. Sling

What it does well:

- Available-shift workflow, location/position filtering, and scheduling operations are clear.

What it still leaves open:

- Matching is largely visibility/filter-driven; public documentation does not show offline-first resilience as a lead differentiator.

FlexShift should learn:

- Matching open shifts by store, position, and user context is operationally valuable.

FlexShift should be different:

- Claim-shift conflict handling must be explicit and repairable.
- Local cache should preserve open-shift visibility and pending intent even when the network drops.

Sources:

- https://support.getsling.com/en/articles/1123840-why-can-t-i-see-available-shifts-in-the-app-for-employees

### 8. 7shifts

What it does well:

- Strong restaurant-centric stack with scheduling, communication, task management, manager log book, and compliance surfaces.

What it still leaves open:

- Public positioning is broad and strong, but the visible differentiator is operational breadth, not deterministic offline recovery.

FlexShift should learn:

- Manager log, tasking, communication, and labor-facing context belong in the same product.

FlexShift should be different:

- FlexShift should combine those surfaces with mobile operational resilience and clearer conflict semantics.

Sources:

- https://www.7shifts.com/

### 9. Connecteam

What it does well:

- Strong mobile-first scheduling, availability, time-off, replacements, communication, and task-per-job positioning.

What it still leaves open:

- Public docs emphasize job coordination and tasks, but not SQLite-backed deterministic offline repair as a primary promise.

FlexShift should learn:

- Scheduling plus attached job tasks is a strong replacement for note-based ops.

FlexShift should be different:

- Shift/store checklists, announcements, and local-first hydration should remain usable through unstable connectivity.

Sources:

- https://connecteam.com/employee-scheduling-app/job-scheduling/

### Strategic conclusion

FlexShift does not win by trying to be a bigger feature list than every incumbent. It wins by combining:

- structured state better than Zalo
- workflow safety better than Excel
- operational context better than notes
- degraded-network reliability and conflict explainability that public competitor positioning does not strongly foreground

That benchmark directly informed the implemented Phase 3 decisions:

- unified `/api/sync/pull` delta contract
- mobile outbox with deterministic replay
- backend mutation ledger with `clientMutationId` and `dedupeKey`
- device-aware session model and revocation
- announcement inbox with acknowledgement
- audit/activity feed
- checklist foundation
- explicit mobile sync banner and stale/offline semantics

## C. Reuse And Controlled Migration Strategy

### Keep

- Expo Router role-based shell.
- Existing cards/common UI system.
- Existing async hook patterns.
- Existing calendar/statistics/settings/dashboard feature topology.
- Existing SQLite presence, but with a new role.

### Light refactor

- `src/context/app-context.tsx`
- `src/services/api/api-client.ts`
- `src/services/api/flexshift-api.ts`
- `src/services/flexshift-service.ts`
- request/open-shift action wiring

Reason:

- These already sat at the right seam, but they needed production semantics.

### Upgrade

- `src/db/database.ts`
- `src/db/repositories.ts`
- `src/services/flexshift-actions.ts`
- `src/services/sync/sync-engine.ts`
- backend config, health, auth/session, sync, activity, announcements
- Prisma schema and DB scripts

Reason:

- These are the backbone of offline-safe and sync-safe behavior.

### Controlled replacement

- Session model: replaced from basic refresh storage to device-aware persisted sessions.
- Mutation handling: replaced from direct remote-only mutation assumptions to outbox + idempotent backend ledger.
- DB create path: replaced `psql` dependency with a Node/TypeScript script.

Reason:

- The old behavior would still "work" in demos but break trust in production.

## D. Production Architecture Decision Record

### PostgreSQL role

- PostgreSQL is the only business source of truth.
- Prisma models now include:
  - `Session`
  - `AuditLog`
  - `SyncChange`
  - `MutationRecord`
  - `Announcement`
  - `AnnouncementAck`
  - `Checklist`
  - `ChecklistItem`

### SQLite role

- SQLite is the mobile operational store.
- It now persists:
  - entity cache tables
  - sync state
  - sync cursors
  - pending mutations
  - announcements
  - activity logs
  - checklists

### Sync model

- Unified delta pull endpoint: `GET /api/sync/pull`
- Cursor-based feed backed by `SyncChange`
- Per-domain payload slices:
  - shifts
  - open shifts
  - requests
  - notifications
  - settings
  - announcements
  - activity
  - checklists

### Outbox model

SQLite `pending_mutations` rows include:

- `client_mutation_id`
- `type`
- `payload`
- `entity_id`
- `entity_type`
- `created_at`
- `retry_count`
- `status`
- `last_error`
- `requires_network`
- `dedupe_key`

### Delta sync model

- Mobile flushes outbox first.
- Mobile then pulls cursor-based updates.
- SQLite cache is upserted from server-authoritative payloads.
- Cursor is advanced only after pull application succeeds.

### Conflict model

Implemented backend conflict taxonomy:

- `OPEN_SHIFT_ALREADY_CLAIMED`
- `SHIFT_CLAIM_OVERLAP`
- `DUPLICATE_PENDING_REQUEST`
- `REQUEST_ALREADY_REVIEWED`
- `APPROVAL_RACE_CONFLICT`

Contract decisions:

- server is authoritative
- conflicts return 409 with explicit code
- client keeps pending row as `conflict`
- client refreshes server state immediately after conflict
- UI tells the user the action was not silently lost

### Realtime model

- No heavy websocket rewrite in Phase 3.
- Realtime strategy is:
  - app-focus sync
  - pull-to-refresh
  - explicit background sync trigger
  - event-driven invalidation via server-side `SyncChange`
  - targeted notifications

### Auth/session model

- Access token contains `sessionId` and `deviceId`.
- Session row persists:
  - device identity
  - platform
  - app version
  - IP/user-agent metadata
  - revocation reason
  - last seen timestamp
- JWT validation now checks active session state, so revoked device sessions stop being valid immediately.

### Audit model

- Critical mutations write `AuditLog`.
- Dashboard and activity feed can surface that timeline.
- Audit payload can include actor, session, device, entity, and structured payload.

### Observability model

- real readiness/liveness endpoints
- request context middleware
- global exception filter
- Prisma connect logging
- sync status persisted on device

### Performance strategy

- calendar/statistics reuse existing UX surfaces
- SQLite hydrates first for mobile
- sync pull is incremental
- Prisma schema adds practical indexes for:
  - date/status queries
  - updated-at queries
  - user/session access
  - request review paths
  - notification feed

## E. Phase-by-Phase Patch Plan

### Phase 3A - Postgres real connection + env validation + health/readiness + logging

Files upgraded:

- `backend/src/config/env.ts`
- `backend/src/main.ts`
- `backend/src/app.module.ts`
- `backend/src/prisma/prisma.service.ts`
- `backend/src/health/health.controller.ts`
- `backend/src/health/health.service.ts`
- `backend/.env`
- `backend/.env.development`
- `backend/.env.example`

Files created:

- `backend/src/common/http/request-context.ts`
- `backend/src/common/http/request-context.middleware.ts`
- `backend/src/common/filters/all-exceptions.filter.ts`
- `backend/src/common/exceptions/domain-conflict.exception.ts`
- `backend/scripts/check-db.ts`
- `backend/scripts/load-env.ts`
- `backend/scripts/create-databases.ts`

Dependency impact:

- no new package install was required for this patch
- stays on npm + current Node runtime

### Phase 3B - SQLite operational cache + pending mutation queue + sync metadata

Files upgraded:

- `src/db/database.ts`
- `src/db/repositories.ts`
- `src/context/app-context.tsx`
- `src/types/models.ts`

Files created:

- `src/services/sync/sync-engine.ts`
- `src/context/sync-context.tsx`
- `src/services/session/device-context.ts`

Why:

- turns SQLite into operational storage instead of passive fallback cache

### Phase 3C - Sync engine + delta sync + idempotent mutations + conflict handling

Files upgraded:

- `backend/prisma/schema.prisma`
- `backend/src/open-shifts/open-shifts.service.ts`
- `backend/src/requests/requests.service.ts`
- `backend/src/approvals/approvals.service.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/jwt.strategy.ts`
- `backend/src/sessions/sessions.service.ts`
- `src/services/flexshift-actions.ts`
- `src/services/api/flexshift-api.ts`
- `src/services/api/api-client.ts`

Files created:

- `backend/src/sync/sync.controller.ts`
- `backend/src/sync/sync.service.ts`
- `backend/src/sync/sync.module.ts`
- `backend/src/sync/dto/query-sync.dto.ts`
- `backend/src/sync/mutation-ledger.service.ts`
- `backend/src/sync/sync-publisher.service.ts`

Why:

- deterministic mutation replay
- backend idempotency
- explicit conflict taxonomy

### Phase 3D - Activity/audit/announcement/checklist/reporting foundation

Files created:

- `backend/src/activity/activity.controller.ts`
- `backend/src/activity/activity.service.ts`
- `backend/src/activity/activity.module.ts`
- `backend/src/announcements/announcements.controller.ts`
- `backend/src/announcements/announcements.service.ts`
- `backend/src/announcements/announcements.module.ts`
- `backend/src/announcements/dto/create-announcement.dto.ts`
- `src/components/cards/AnnouncementCard.tsx`
- `src/components/common/SyncStatusBanner.tsx`

Files upgraded:

- `src/services/flexshift-service.ts`
- employee and manager dashboard screens

Why:

- replaces chat fragments with auditable operational surfaces

### Phase 3E - Performance optimization + query/index hardening + pagination-ready data model

Files upgraded:

- `backend/prisma/schema.prisma`
- `backend/src/notifications/notifications.service.ts`
- `backend/src/settings/settings.service.ts`
- `backend/src/statistics/*`
- `backend/src/calendar/*`

Why:

- index coverage for high-frequency reads
- narrower sync payloads
- cleaner incremental refresh behavior

### Phase 3F - Verification, scripts, smoke tests, resilience tests

Files created:

- `backend/prisma/migrations/20260410_phase3_production_hardening/migration.sql`
- `backend/prisma/migrations/migration_lock.toml`
- this document

Verification completed on April 10, 2026:

- backend typecheck: passed
- mobile typecheck: passed
- DB connectivity: passed
- health/readiness: passed on `http://127.0.0.1:3100/api/health` and `/api/health/readiness`

## F. npm Commands

### Install

Mobile:

```bash
npm install
```

Backend:

```bash
npm --prefix backend install
```

### Prisma and database

Create main/shadow DBs:

```bash
npm --prefix backend run db:create
```

Generate Prisma client:

```bash
npm --prefix backend run prisma:generate
```

Format Prisma schema:

```bash
npm --prefix backend run prisma:format
```

Recommended controlled rollout command on a fresh or migration-managed DB:

```bash
npm --prefix backend exec prisma migrate dev -- --schema prisma/schema.prisma --name phase3_production_hardening
```

Local verification fallback used on April 10, 2026 because the existing DB had no prior Prisma migration history:

```bash
npm --prefix backend exec prisma db push -- --schema prisma/schema.prisma
```

Verify DB connection:

```bash
npm --prefix backend run db:check
```

Seed:

```bash
npm --prefix backend run prisma:seed
```

### Run

Backend:

```bash
npm --prefix backend run start:dev
```

Mobile:

```bash
npm run start
```

### Typecheck and build

Backend typecheck:

```bash
npm --prefix backend run typecheck
```

Backend build:

```bash
npm --prefix backend run build
```

Mobile typecheck:

```bash
npm run typecheck
```

Mobile lint:

```bash
npm run lint
```

### Package/runtime risks under current environment

- `bcrypt`
  - native module on Windows and can be sensitive to runtime/ABI churn
  - current repo typecheck/build path passed under Node `23.11.0`
  - minimal fix if it becomes unstable: switch to `bcryptjs` only if native install problems become recurring
- Prisma CLI on Windows
  - observed `EPERM` rename/file-lock issue on repeated `prisma generate`
  - practical mitigation: rerun after releasing locking processes, or move to `prisma.config.ts` and cleaner engine lifecycle in Phase 4

## G. File-by-File Change Map

### Keep

- existing Expo Router role layout
- existing dashboard/calendar/statistics/settings screen topology
- existing common cards and visual system

### Refactor light

- `app/_layout.tsx`
- `src/context/app-context.tsx`
- `src/services/api/api-client.ts`
- `src/services/api/flexshift-api.ts`
- `src/services/flexshift-service.ts`
- `backend/src/main.ts`
- `backend/src/app.module.ts`

### Upgrade

- `src/db/database.ts`
- `src/db/repositories.ts`
- `src/services/flexshift-actions.ts`
- `src/screens/employee/employee-dashboard-screen.tsx`
- `src/screens/manager/manager-dashboard-screen.tsx`
- `src/screens/employee/open-shift-detail-screen.tsx`
- `src/screens/employee/open-shifts-screen.tsx`
- `src/screens/employee/create-leave-request-screen.tsx`
- `src/screens/employee/create-yield-request-screen.tsx`
- `src/screens/manager/approval-detail-screen.tsx`
- `src/screens/manager/create-open-shift-screen.tsx`
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/jwt.strategy.ts`
- `backend/src/sessions/sessions.service.ts`
- `backend/src/open-shifts/open-shifts.service.ts`
- `backend/src/requests/requests.service.ts`
- `backend/src/approvals/approvals.service.ts`
- `backend/src/settings/settings.service.ts`
- `backend/src/notifications/notifications.service.ts`

### Create new

- `backend/src/common/http/request-context.ts`
- `backend/src/common/http/request-context.middleware.ts`
- `backend/src/common/filters/all-exceptions.filter.ts`
- `backend/src/common/exceptions/domain-conflict.exception.ts`
- `backend/src/config/env.ts`
- `backend/src/health/health.service.ts`
- `backend/src/activity/activity.module.ts`
- `backend/src/activity/activity.controller.ts`
- `backend/src/activity/activity.service.ts`
- `backend/src/sync/sync.module.ts`
- `backend/src/sync/sync.controller.ts`
- `backend/src/sync/sync.service.ts`
- `backend/src/sync/dto/query-sync.dto.ts`
- `backend/src/sync/mutation-ledger.service.ts`
- `backend/src/sync/sync-publisher.service.ts`
- `backend/src/announcements/announcements.module.ts`
- `backend/src/announcements/announcements.controller.ts`
- `backend/src/announcements/announcements.service.ts`
- `backend/src/announcements/dto/create-announcement.dto.ts`
- `backend/src/sessions/sessions.controller.ts`
- `backend/scripts/load-env.ts`
- `backend/scripts/check-db.ts`
- `backend/scripts/create-databases.ts`
- `backend/prisma/migrations/20260410_phase3_production_hardening/migration.sql`
- `src/context/sync-context.tsx`
- `src/services/sync/sync-engine.ts`
- `src/services/session/device-context.ts`
- `src/components/common/SyncStatusBanner.tsx`
- `src/components/cards/AnnouncementCard.tsx`

### Changed role

- `src/db/database.ts`
  - from passive local store to operational mobile store
- `src/db/repositories.ts`
  - from basic cache repo to cache + sync + outbox adapter
- `src/services/flexshift-actions.ts`
  - from direct action layer to optimistic-write + queue layer
- `backend/src/sessions/sessions.service.ts`
  - from basic refresh handling to device-aware session authority

## H. Full Code

The production code now lives directly in the repo. The highest-value core files are:

- `backend/prisma/schema.prisma`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/jwt.strategy.ts`
- `backend/src/sessions/sessions.service.ts`
- `backend/src/sync/sync.service.ts`
- `backend/src/sync/mutation-ledger.service.ts`
- `backend/src/open-shifts/open-shifts.service.ts`
- `backend/src/requests/requests.service.ts`
- `backend/src/approvals/approvals.service.ts`
- `backend/src/announcements/announcements.service.ts`
- `src/db/database.ts`
- `src/db/repositories.ts`
- `src/services/sync/sync-engine.ts`
- `src/services/flexshift-actions.ts`
- `src/context/sync-context.tsx`
- `src/services/flexshift-service.ts`
- `src/screens/employee/employee-dashboard-screen.tsx`
- `src/screens/manager/manager-dashboard-screen.tsx`

This phase intentionally puts the code in real repo files instead of pasting pseudo-code into the handoff.

## I. Offline, Sync And Conflict Contract

### Local write flow

1. User action writes optimistic local state into SQLite.
2. A pending mutation row is created with `clientMutationId` and `dedupeKey`.
3. Sync engine attempts immediate flush if a remote session exists.
4. If send succeeds, the mutation is marked completed and removed after cleanup.
5. Pull sync runs after flush and rehydrates authoritative state.

### Optimistic flow

- open shift create: local row created immediately
- open shift claim: local schedule is updated immediately
- leave/yield request: local request row appears immediately
- approval decision: local request state changes immediately
- announcement acknowledgement: local ack state flips immediately

### Outbox lifecycle

Statuses:

- `queued`
- `sending`
- `failed`
- `conflict`
- `completed`

Retry semantics:

- network/offline errors move row to `failed`
- explicit 409 conflict moves row to `conflict`
- successful replay moves row to `completed` then cleanup removes it

### Retry/backoff

- current implementation tracks `retryCount` and retry-safe status
- next scheduler phase can add exponential backoff timings, but replay safety is already in place because server endpoints are idempotent

### Sync cursor rules

- server cursor comes from `SyncChange.id`
- local cursor only advances after payload application succeeds
- `serverCursor` is stored separately from `cursor` snapshot metadata for repair visibility

### Merge rules

- server payload wins for truth
- SQLite keeps UI-fast local projections
- after conflict, a fresh pull repairs stale local assumptions

### Duplicate prevention

- client sends `clientMutationId`
- client also sends stable `dedupeKey`
- backend mutation ledger checks both

### Current conflict codes

- `OPEN_SHIFT_ALREADY_CLAIMED`
- `SHIFT_CLAIM_OVERLAP`
- `DUPLICATE_PENDING_REQUEST`
- `REQUEST_ALREADY_REVIEWED`
- `APPROVAL_RACE_CONFLICT`

### Rollback and repair UI

- mutation stays visible in queue state
- sync banner shows degraded/offline/error state
- conflict response is surfaced instead of being silently swallowed
- user can refresh and see authoritative result after repair pull

### Stale data behavior

- sync snapshot persists:
  - `lastSuccessfulSyncAt`
  - `lastAttemptedSyncAt`
  - `pendingMutationCount`
  - `lastError`
- stale/offline state is shown in the banner

### Logout and account switch

- logout clears operational SQLite state
- account switch triggers user-scope guard and clears cross-user operational state before reuse

### App reinstall behavior

- server remains authoritative
- reinstall loses local queue/cache
- next login restores from sync pull
- idempotent server mutation ledger prevents duplicate remote writes if retry attempts reappear with the same identifiers

## J. Performance And Reliability Checklist

### Index checklist

- `Shift`: store/date/status, position/date, status/date, updatedAt
- `Request`: status/createdAt, createdById/status, shiftId/status, targetUserId/status, updatedAt
- `OpenShift`: status/date/updatedAt, store/date, claimedById/updatedAt
- `Notification`: userId/isRead/createdAt, updatedAt
- `Session`: userId/expiresAt, userId/deviceId/revokedAt
- `AuditLog`: actorUserId/createdAt, entityType/entityId/createdAt
- `SyncChange`: id/userId, domain/id, entityType/entityId

### N+1 checklist

- open shifts include store and position in one query
- requests include shift/store/position/actors in one query
- approvals preload request graph before review
- sync payloads preload required relations rather than hydrate per item

### Practical p95 targets

- cold app open to first useful local render: under 1.5s on normal mid-range device
- common sync cycle: under 2s for routine payload
- claim-shift roundtrip on good network: under 1.5s
- calendar refresh: under 2s
- statistics refresh: under 2.5s

### Startup strategy

- SQLite first render
- remote reconcile in background
- explicit sync banner instead of blocking splash forever

### Pagination strategy

- sync feed is cursor-based
- activity/checklists are capped in Phase 3 payloads
- notifications ordered newest-first and ready for incremental extension

### Memory/render considerations

- avoid unnecessary refetch on tab switches
- keep dashboard sections bounded
- use cached summaries instead of deep recomputation per render

### Failure recovery

- DB readiness path exists
- local queue persists through app restarts
- conflict state is recoverable through repair pull
- account switch clears contaminated local state

### Corrupted local cache repair

- clear operational state on logout
- clear operational user scope on user change
- full sync from cursor `0` remains the repair path

## K. QA Checklist

- login success
- login failure
- session restore
- refresh token rotation
- logout current session
- revoke another device session
- unauthorized access rejected
- `/api/health` returns ready
- `/api/health/readiness` hits DB and returns `database: up`
- app boot offline from SQLite
- app boot online with reconcile
- dashboard renders cached announcements/activity
- delta sync updates local state
- repeated retry keeps mutation idempotent
- claim shift success
- claim shift overlap conflict
- claim already-claimed shift conflict
- leave request success
- yield request success
- duplicate pending request conflict
- manager approve request
- manager reject request
- approval race conflict
- settings partial patch works
- notifications feed loads
- announcement acknowledgement works
- activity feed loads
- checklist payload loads
- app restart preserves queue and sync snapshot
- logout clears sensitive operational state
- role guards enforce manager-only routes
- conflict responses carry explicit codes
- stale snapshot can be repaired with full sync

## L. Verify And Run Checklist

### Required env files

- `backend/.env`
- optionally `backend/.env.local` to override machine-specific values

### Required local DBs

- `flexshift`
- `flexshift_shadow`

### Verified command order

```bash
npm --prefix backend run db:create
npm --prefix backend run prisma:generate
npm --prefix backend run typecheck
npm run typecheck
npm --prefix backend run db:check
npm --prefix backend run build
```

If local DB has no migration history yet, sync it first:

```bash
npm --prefix backend exec prisma db push -- --schema prisma/schema.prisma
```

### Verified outputs on April 10, 2026

- `npm --prefix backend run db:check`
  - returned status `ok`
  - returned `databaseUrl: postgresql://postgres:123456@127.0.0.1:5432/flexshift?schema=public`
  - returned server time `2026-04-10 20:39:05.145044+07`
- `npm --prefix backend run db:create`
  - verified `flexshift`
  - created `flexshift_shadow`
- live readiness probe on port `3100`
  - `/api/health/readiness` returned `status: ready`, `database: up`
  - `/api/health` returned `status: ready`, `liveness: alive`

### Health endpoint note

- Port `3000` was already occupied locally by `EonVPNRoutingService`.
- Verification therefore used `PORT=3100` for the backend process.

### Remaining migration note

- A baseline migration SQL file was generated at:
  - `backend/prisma/migrations/20260410_phase3_production_hardening/migration.sql`
- The existing local DB did not already have a clean Prisma migration history chain, so Phase 3 verification used `db push` for safe local convergence and kept the migration SQL artifact for controlled rollout.

## M. Risks, Technical Debt And Phase 4

### Current debt

- realtime remains pull-driven rather than websocket/push-native
- delta feed currently uses domain invalidation, not per-entity patch streaming
- checklist feature is foundational, not yet full workflow UI
- reporting/export is architecture-ready, not full reporting surface yet

### Temporary foundation choices

- `db push` was used to verify local DB convergence because the local DB was not already under a clean Prisma migration chain
- baseline migration SQL is present, but migration history rollout still needs a controlled environment strategy

### Phase 4 recommendations

- move Prisma config out of `package.json` into `prisma.config.ts`
- add background sync scheduler with exponential backoff timings
- extend conflict taxonomy for stale schedule/update tokens
- add manager log and handover UI on top of checklist/activity foundations
- add CSV export/reporting endpoints
- add push/email/Zalo OA provider abstraction wiring
- add richer announcement targeting by store/team
- add availability and recurring template domain models

### Recommended rollout strategy

- feature-flag announcements and checklists separately from sync hardening
- ship sync banner and outbox first
- ship audit/activity visibility next
- ship announcements/checklists to pilot stores
- hold exports and broader notification channels for Phase 4
