# FlexShift Phase 2 Handoff

## A. Phase 2 Objective Summary

- Chuyen FlexShift tu login adapter + local-first shell sang auth that, API that, remote-first data flow.
- Giu Expo Router, SQLite layer, dashboard/calendar/statistics/settings UI hien co.
- Bo sung backend NestJS production foundation de mobile co the tiep tuc migrate ma khong rewrite app.

## B. Reuse & Migration Strategy on Current Codebase

### Giu nguyen

- `app/(auth)`, `app/(employee)`, `app/(manager)` va role-based route shell.
- Cac reusable card/common component.
- `useAsyncData` va pattern screen-level loading/error/empty state.
- SQLite schema co ban va repo local action/read layer.

### Refactor nhe

- `src/context/app-context.tsx`
  - doi tu role switcher sang auth/session context.
- `src/services/flexshift-service.ts`
  - doi tu local-only aggregator sang remote-first + cache fallback.
- `src/components/settings/SettingsScreenContent.tsx`
  - giu UI, doi data source sang backend-first.

### Nang cap

- `backend/`
  - auth, sessions, users, requests, approvals, calendar, statistics, settings, notifications, shifts, open-shifts.
- `src/services/api/*`
  - them API client, auth/session store, endpoint wrappers.
- `src/services/flexshift-actions.ts`
  - mutation adapter tu UI sang remote-first.

### Thay the co kiem soat

- `src/screens/auth/login-screen.tsx`
  - bo internal account switcher, doi sang email/password.
- business naming `swap` -> `yield` / "nhuong ca"
  - giu route compatibility qua `create-swap` de khong vo deep link cu.

## C. Phase-by-phase Patch Plan

### Phase 2A - Auth + Session + API foundation

- Sua:
  - `src/context/app-context.tsx`
  - `app/_layout.tsx`
  - `package.json`
  - `app.json`
- Tao moi:
  - `src/config/env.ts`
  - `src/providers/query-provider.tsx`
  - `src/services/api/api-client.ts`
  - `src/services/api/api-errors.ts`
  - `src/services/api/flexshift-api.ts`
  - `src/services/session/auth-storage.ts`
  - `src/services/session/session-store.ts`

### Phase 2B - Backend domain modules

- Tao moi / mo rong:
  - `backend/src/auth/*`
  - `backend/src/users/*`
  - `backend/src/sessions/*`
  - `backend/src/shifts/*`
  - `backend/src/open-shifts/*`
  - `backend/src/requests/*`
  - `backend/src/approvals/*`
  - `backend/src/calendar/*`
  - `backend/src/statistics/*`
  - `backend/src/settings/*`
  - `backend/src/notifications/*`
  - `backend/src/prisma/*`
  - `backend/prisma/schema.prisma`
  - `backend/prisma/seed.ts`

### Phase 2C - Mobile remote-first migration

- Sua:
  - `src/services/flexshift-service.ts`
  - `src/services/flexshift-actions.ts`
  - `src/db/repositories.ts`
  - `src/db/database.ts`

### Phase 2D - Calendar / Statistics / Settings / Notifications integration

- Sua:
  - `src/screens/employee/*`
  - `src/screens/manager/*`
  - `src/components/settings/SettingsScreenContent.tsx`
  - `src/components/cards/RequestCard.tsx`

### Phase 2E - Verification / scripts / build readiness

- Sua:
  - `package.json`
  - `backend/package.json`
  - `tsconfig.json`
  - `backend/.env.example`
  - `.env.example`

## D. npm Commands

### Mobile

```powershell
cd c:\Users\LUAN\Downloads\expo_test\my-app
& 'C:\nvm4w\nodejs\npm.ps1' install
& 'C:\nvm4w\nodejs\npm.ps1' run typecheck
& 'C:\nvm4w\nodejs\npm.ps1' run lint
& 'C:\nvm4w\nodejs\npm.ps1' run start
```

### Backend

```powershell
cd c:\Users\LUAN\Downloads\expo_test\my-app\backend
& 'C:\nvm4w\nodejs\npm.ps1' install
& 'C:\nvm4w\nodejs\npm.ps1' run prisma:generate
& 'C:\nvm4w\nodejs\npm.ps1' run prisma:migrate
& 'C:\nvm4w\nodejs\npm.ps1' run prisma:seed
& 'C:\nvm4w\nodejs\npm.ps1' run typecheck
& 'C:\nvm4w\nodejs\npm.ps1' run build
& 'C:\nvm4w\nodejs\npm.ps1' run start:dev
```

### Root helper scripts

```powershell
cd c:\Users\LUAN\Downloads\expo_test\my-app
& 'C:\nvm4w\nodejs\npm.ps1' run backend:prisma:generate
& 'C:\nvm4w\nodejs\npm.ps1' run backend:prisma:migrate
& 'C:\nvm4w\nodejs\npm.ps1' run backend:prisma:seed
& 'C:\nvm4w\nodejs\npm.ps1' run backend:dev
```

## E. File-by-file Change Map

### Mobile giu / reuse

- `src/db/database.ts`
- `src/db/repositories.ts`
- `src/hooks/use-async-data.ts`
- reusable card/common components
- route groups employee/manager/auth

### Mobile refactor / nang cap

- `src/context/app-context.tsx`
- `src/services/flexshift-service.ts`
- `src/components/settings/SettingsScreenContent.tsx`
- `src/screens/auth/login-screen.tsx`
- `src/screens/employee/employee-dashboard-screen.tsx`
- `src/screens/employee/my-requests-screen.tsx`
- `src/screens/employee/open-shifts-screen.tsx`
- `src/screens/employee/open-shift-detail-screen.tsx`
- `src/screens/employee/create-leave-request-screen.tsx`
- `src/screens/employee/create-yield-request-screen.tsx`
- `src/screens/manager/manager-dashboard-screen.tsx`
- `src/screens/manager/approvals-screen.tsx`
- `src/screens/manager/approval-detail-screen.tsx`
- `src/screens/manager/create-open-shift-screen.tsx`

### Mobile moi

- `src/services/api/api-client.ts`
- `src/services/api/api-errors.ts`
- `src/services/api/flexshift-api.ts`
- `src/services/session/auth-storage.ts`
- `src/services/session/session-store.ts`
- `src/services/flexshift-actions.ts`
- `src/providers/query-provider.tsx`
- `src/hooks/use-app-query-client.ts`
- `src/config/env.ts`
- `app/(employee)/requests/create-yield.tsx`

### Backend moi / mo rong

- `backend/src/app.module.ts`
- `backend/src/main.ts`
- `backend/src/prisma/prisma.module.ts`
- `backend/src/prisma/prisma.service.ts`
- `backend/src/auth/*`
- `backend/src/users/*`
- `backend/src/sessions/*`
- `backend/src/shifts/*`
- `backend/src/open-shifts/*`
- `backend/src/requests/*`
- `backend/src/approvals/*`
- `backend/src/calendar/*`
- `backend/src/statistics/*`
- `backend/src/settings/*`
- `backend/src/notifications/*`
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts`

## F. Full Code

- Full implementation da nam truc tiep trong repo hien tai.
- Cac diem vao chinh de review:
  - `src/context/app-context.tsx`
  - `src/services/api/api-client.ts`
  - `src/services/flexshift-service.ts`
  - `src/services/flexshift-actions.ts`
  - `backend/src/auth/auth.service.ts`
  - `backend/src/open-shifts/open-shifts.service.ts`
  - `backend/src/requests/requests.service.ts`
  - `backend/src/approvals/approvals.service.ts`
  - `backend/prisma/schema.prisma`
  - `backend/prisma/seed.ts`

## G. Auth & Session Flow

1. Login screen goi `loginRequest`.
2. Session duoc luu qua `session-store` + `auth-storage`.
3. `AppProvider` restore session luc bootstrap.
4. API client tu gan bearer token.
5. Gap `401` se thu `/auth/refresh`.
6. Refresh fail se clear session va route tro ve `/(auth)/login`.
7. Logout goi `/auth/logout`, xoa local session va clear shell state.

## H. Data Flow & Cache Strategy

- Source of truth:
  - backend NestJS + PostgreSQL/Prisma
- Local role moi cua SQLite:
  - cache user shell
  - cache shifts/open shifts/requests/settings/notifications
  - fallback khi request remote fail
- Screen read path:
  - `screen -> flexshift-service -> API first -> sync SQLite -> fallback SQLite khi can`
- Mutation path:
  - `screen -> flexshift-actions -> API first`
  - `refreshData()` invalidates shell state sau mutation

## I. QA Checklist

- [ ] Login success
- [ ] Login failure
- [ ] Session restore sau khi restart app
- [ ] Refresh token sau 401
- [ ] Logout flow
- [ ] Claim open shift
- [ ] Conflict detection khi claim
- [ ] Create leave request
- [ ] Create yield request
- [ ] Manager approve request
- [ ] Manager reject request
- [ ] Calendar load tu backend
- [ ] Statistics load tu backend
- [ ] Settings sync remote/local
- [ ] Notifications/feed render

## J. Verify & Run Checklist

- Da verify:
  - mobile `npm run typecheck`
  - mobile `npm run lint`
  - backend `npm run prisma:generate`
  - backend `npm run typecheck`
  - backend `npm run build`
- Chua verify:
  - runtime API voi PostgreSQL that
  - login end-to-end tren device
  - seed/write flow voi DB that

## K. Risks & Next Phase

- SQLite cache hien tai la best-effort cache, chua co stale eviction day du cho moi bang.
- Chua co queue offline mutation; hien tai la fallback read-first.
- Chua co push notification that; notifications dang la backend list/feed abstraction.
- Chua co test tu dong cho module backend va mobile auth flow.
- Next phase nen uu tien:
  1. PostgreSQL local/staging + Prisma migrate/seed chay that
  2. smoke test device auth/session/calendar/request
  3. them API integration tests cho auth, requests, approvals
  4. bo sung invalidation/offline policy sau khi runtime on dinh
