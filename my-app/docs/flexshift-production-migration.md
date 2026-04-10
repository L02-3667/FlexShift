# FlexShift Production Migration

## Phần A — Production Product Positioning

FlexShift được định vị là ứng dụng điều phối ca làm mobile-first cho cửa hàng nhỏ và chuỗi cửa hàng vừa, nơi nhân sự part-time cần nhìn lịch rõ, nhận ca nhanh và xử lý thay đổi ca mà không phụ thuộc vào chat rời rạc.

Khác với app scheduling tổng quát, FlexShift ưu tiên 3 điểm:

- open shifts phải dễ nhận và có kiểm tra trùng lịch rõ ràng
- duyệt nghỉ hoặc nhường ca phải gắn chặt với lịch chứ không tách thành CRUD rời
- manager cần nhìn lịch chốt, khoảng trống và yêu cầu pending trong cùng một flow điều phối

## Phần B — Key UX Upgrades

Các nâng cấp UX bắt buộc đã phản ánh vào code mobile hiện tại:

- `dashboard` chuyển từ màn chỉ liệt kê sang màn quyết định, có CTA đi thẳng tới lịch, open shifts và statistics
- `calendar` trở thành màn trung tâm cho cả employee lẫn manager, dùng cùng foundation tuần + agenda
- `statistics` được tách thành màn riêng để không nhồi số liệu vào dashboard
- `settings` trở thành màn thật, có lưu preference cục bộ qua `user_settings`
- `activity feed` xuất hiện trên dashboard để tránh trải nghiệm im lặng hoàn toàn

Vai trò của từng màn:

- `Calendar`: trung tâm vận hành và đồng bộ nhận thức lịch
- `Statistics`: nhìn khối lượng ca, giờ làm, fill rate và backlog xử lý
- `Settings`: hoàn thiện cảm giác production, gom tài khoản, thông báo, reminder, theme, version

## Phần C — Reuse & Migration Strategy on Existing Codebase

### Giữ lại

- `app/(auth)`, `app/(employee)`, `app/(manager)` vì route groups hiện tại đã chia role khá đúng
- `src/components/cards/*` vì `ShiftCard`, `OpenShiftCard`, `RequestCard` đã đủ tốt để tái dùng
- `src/components/common/*` vì `EmptyState`, `MetricCard`, `PrimaryButton`, `SectionHeader`, `AppInput` là bộ foundation ổn
- `src/hooks/use-async-data.ts` vì phù hợp cho giai đoạn migration-first
- `src/utils/date.ts`, `src/utils/validation.ts`, `src/utils/routes.ts`

### Refactor nhẹ

- `src/screens/auth/login-screen.tsx` đổi microcopy sang sản phẩm nội bộ, bỏ giọng demo
- `app/_layout.tsx`, `src/context/app-context.tsx`, `src/db/sqlite-provider.*` bỏ thông điệp demo/local lộ liễu
- `src/constants/branding.ts` đổi tên app thành `FlexShift`

### Nâng cấp

- `src/screens/manager/confirmed-schedule-screen.tsx` được nâng cấp từ list lịch chốt sang calendar-centric manager view
- `src/screens/employee/employee-dashboard-screen.tsx` và `src/screens/manager/manager-dashboard-screen.tsx` thêm CTA sản phẩm + updates feed
- `src/services/flexshift-service.ts` từ service summary đơn giản thành data shaping layer cho dashboard, calendar và statistics
- `src/db/database.ts` + `src/db/repositories.ts` mở rộng để giữ SQLite như persistence/cache/supporting layer

### Thay thế có kiểm soát

- `src/screens/employee/employee-profile-screen.tsx` và `src/screens/manager/manager-profile-screen.tsx` đổi vai trò thành compatibility export cho settings mới thay vì giữ màn profile rời, sơ sài
- `app/(employee)/(tabs)/_layout.tsx` và `app/(manager)/(tabs)/_layout.tsx` được tổ chức lại để đưa `calendar`, `statistics`, `settings` vào IA chính
- `RequestType: swap` trong mobile hiện là legacy enum nội bộ. Khi nối backend nên map `swap -> yield` qua adapter để business wording và API thống nhất theo “nhường ca”.

### Vì sao không xóa phần cũ

- route groups hiện tại đã đúng hướng role-based, xóa đi để làm lại chỉ tăng rủi ro
- cards/common components đang có giá trị reuse trực tiếp
- repository SQLite hiện tại là ứng viên tốt để chuyển vai trò thành cache repository hoặc offline snapshot repository

## Phần D — Production Architecture

### Mobile

- Expo + React Native + TypeScript + Expo Router
- Auth context giữ shell hiện tại, nhưng cần nâng cấp sang token-based session
- Domain data layer nên đi theo `API client -> repository -> screen service -> hook/screen`
- TanStack Query nên là bước tiếp theo sau giai đoạn patch hiện tại

### Backend

- NestJS
- PostgreSQL
- Prisma ORM
- JWT access token + refresh token
- role-based authorization cho `employee`, `manager`, mở rộng `admin`
- module boundaries:
  - `auth`
  - `users`
  - `stores`
  - `positions`
  - `shifts`
  - `open-shifts`
  - `requests`
  - `approvals`
  - `calendar`
  - `statistics`
  - `settings`
  - `notifications`
  - `sessions`
  - `audit-logs`

### Cache / Offline

- PostgreSQL là source of truth
- SQLite trên mobile giữ vai trò:
  - cache snapshot
  - persisted session/supporting data
  - pending mutation queue nếu mất mạng
  - user settings và lightweight offline fallback

## Phần E — Folder Structure

```text
my-app/
  app/
    (auth)/
    (employee)/
    (manager)/
  src/
    components/
      calendar/
      cards/
      common/
      settings/
    context/
    db/
    hooks/
    screens/
      auth/
      employee/
      manager/
    services/
    types/
    utils/
  docs/
    flexshift-production-migration.md

backend/
  src/
    auth/
    users/
    stores/
    positions/
    shifts/
    open-shifts/
    requests/
    approvals/
    calendar/
    statistics/
    settings/
    notifications/
    sessions/
    audit-logs/
  prisma/
    schema.prisma
  test/
```

## Phần F — Packages Cần Cài

### Mobile

Các package đang dùng ổn và nên giữ:

- `expo-router`
- `expo-sqlite`
- `react-native-safe-area-context`
- `react-native-reanimated`

Bước kế tiếp nên cài:

```bash
npm install @tanstack/react-query expo-secure-store expo-network
```

### Backend

```bash
npm install @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/throttler passport passport-jwt class-validator class-transformer prisma @prisma/client bcrypt
npm install -D prisma ts-node
```

## Phần G — Prisma Schema / Database Design

```prisma
enum UserRole {
  employee
  manager
  admin
}

enum ShiftStatus {
  scheduled
  completed
  cancelled
}

enum OpenShiftStatus {
  open
  claimed
  cancelled
}

enum RequestType {
  leave
  yield
}

enum RequestStatus {
  pending
  approved
  rejected
}

model User {
  id             String          @id @default(cuid())
  fullName       String
  email          String          @unique
  phone          String?         @unique
  passwordHash   String
  role           UserRole
  isActive       Boolean         @default(true)
  settings       UserSetting?
  assignments    ShiftAssignment[]
  requests       Request[]       @relation("CreatedRequests")
  targetRequests Request[]       @relation("TargetRequests")
  notifications  Notification[]
  sessions       Session[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

model Store {
  id         String      @id @default(cuid())
  name       String
  code       String      @unique
  shifts     Shift[]
  openShifts OpenShift[]
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
}

model Position {
  id         String      @id @default(cuid())
  name       String
  storeId    String?
  shifts     Shift[]
  openShifts OpenShift[]
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
}

model Shift {
  id           String            @id @default(cuid())
  storeId       String
  positionId    String
  date          DateTime
  startTime     String
  endTime       String
  status        ShiftStatus
  store         Store             @relation(fields: [storeId], references: [id])
  position      Position          @relation(fields: [positionId], references: [id])
  assignments   ShiftAssignment[]
  requests      Request[]
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  @@index([storeId, date])
  @@index([status, date])
}

model ShiftAssignment {
  id         String   @id @default(cuid())
  shiftId     String
  userId      String
  shift       Shift    @relation(fields: [shiftId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())

  @@unique([shiftId, userId])
  @@index([userId])
}

model OpenShift {
  id            String          @id @default(cuid())
  storeId        String
  positionId     String
  date           DateTime
  startTime      String
  endTime        String
  note           String
  status         OpenShiftStatus
  claimedById    String?
  store          Store           @relation(fields: [storeId], references: [id])
  position       Position        @relation(fields: [positionId], references: [id])
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  @@index([status, date])
  @@index([storeId, date])
}

model Request {
  id                String         @id @default(cuid())
  type              RequestType
  status            RequestStatus
  createdById       String
  targetUserId      String?
  shiftId           String
  reason            String
  managerNote       String?
  createdBy         User           @relation("CreatedRequests", fields: [createdById], references: [id])
  targetUser        User?          @relation("TargetRequests", fields: [targetUserId], references: [id])
  shift             Shift          @relation(fields: [shiftId], references: [id])
  approvalActions   ApprovalAction[]
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  @@index([status, createdAt])
  @@index([createdById, status])
}

model ApprovalAction {
  id          String   @id @default(cuid())
  requestId    String
  managerId    String
  action       RequestStatus
  note         String?
  request      Request  @relation(fields: [requestId], references: [id])
  createdAt    DateTime @default(now())

  @@index([requestId, createdAt])
}

model Notification {
  id          String   @id @default(cuid())
  userId      String
  title       String
  body        String
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
}

model UserSetting {
  userId                 String   @id
  notificationsEnabled   Boolean  @default(true)
  approvalUpdatesEnabled Boolean  @default(true)
  openShiftAlertsEnabled Boolean  @default(true)
  remindersEnabled       Boolean  @default(true)
  reminderMinutesBefore  Int      @default(60)
  language               String   @default("vi")
  theme                  String   @default("system")
  updatedAt              DateTime @updatedAt
  user                   User     @relation(fields: [userId], references: [id])
}

model Session {
  id            String   @id @default(cuid())
  userId        String
  refreshToken  String   @unique
  expiresAt     DateTime
  revokedAt     DateTime?
  user          User     @relation(fields: [userId], references: [id])

  @@index([userId, expiresAt])
}
```

Relation quan trọng:

- `ShiftAssignment` tách assignment khỏi `Shift` để mở rộng nhiều người hoặc audit sau này
- `Request` gắn với `Shift` để approval luôn quay về lịch
- `Session` tách refresh token ra khỏi `User`
- `UserSetting` 1-1 để settings có thể sync với mobile cache

## Phần H — API Contract

### Auth

- `POST /auth/login`
  - body: `{ email, password }`
  - response: `{ accessToken, refreshToken, user }`
  - errors: `401`, `422`
- `POST /auth/refresh`
  - body: `{ refreshToken }`
  - response: token pair mới
- `POST /auth/logout`
  - auth: required
  - body: `{ refreshToken }`

### Me

- `GET /me`
  - auth: required
  - response: current user profile

### Shifts

- `GET /shifts`
  - auth: required
  - query: `from`, `to`, `storeId`, `userId`, `status`
  - roles: employee thấy ca của mình, manager thấy team
- `GET /shifts/:id`
- `POST /shifts`
  - roles: manager
- `PATCH /shifts/:id`
  - roles: manager

### Open Shifts

- `GET /open-shifts`
- `GET /open-shifts/:id`
- `POST /open-shifts`
  - roles: manager
- `POST /open-shifts/:id/claim`
  - roles: employee
  - validation: check overlap, status must be `open`

### Requests / Approvals

- `GET /requests`
  - employee: requests của mình
  - manager: pending + filter theo store/status/type
- `POST /requests/leave`
- `POST /requests/yield`
- `GET /requests/:id`
- `POST /approvals/:id/approve`
  - roles: manager
  - body: `{ note? }`
- `POST /approvals/:id/reject`

### Calendar

- `GET /calendar`
  - query: `view=week|month`, `from`, `to`, `storeId`, `roleScope`
  - response: grouped agenda items cho shift, open-shift, request

### Statistics

- `GET /statistics/employee`
- `GET /statistics/manager`

### Settings

- `GET /settings/me`
- `PATCH /settings/me`

### Notifications

- `GET /notifications`
- `PATCH /notifications/:id/read`
- `POST /notifications/test`
  - internal/dev only

## Phần I — File-by-File Change Map

### Giữ nguyên

- `src/components/common/PrimaryButton.tsx`
- `src/components/common/MetricCard.tsx`
- `src/components/common/SectionHeader.tsx`
- `src/components/cards/ShiftCard.tsx`
- `src/components/cards/OpenShiftCard.tsx`
- `src/components/cards/RequestCard.tsx`
- `src/hooks/use-async-data.ts`
- `src/utils/date.ts`
- `src/utils/validation.ts`

### Sửa / nâng cấp

- `app/_layout.tsx`
- `app/(employee)/(tabs)/_layout.tsx`
- `app/(manager)/(tabs)/_layout.tsx`
- `app/(employee)/_layout.tsx`
- `app/(manager)/_layout.tsx`
- `app.json`
- `src/constants/branding.ts`
- `src/context/app-context.tsx`
- `src/db/database.ts`
- `src/db/repositories.ts`
- `src/services/flexshift-service.ts`
- `src/screens/auth/login-screen.tsx`
- `src/screens/employee/employee-dashboard-screen.tsx`
- `src/screens/manager/manager-dashboard-screen.tsx`
- `src/screens/manager/confirmed-schedule-screen.tsx`
- `src/screens/manager/approval-detail-screen.tsx`
- `src/screens/manager/approvals-screen.tsx`
- `src/screens/employee/open-shift-detail-screen.tsx`

### Tạo mới

- `app/(employee)/(tabs)/calendar.tsx`
- `app/(employee)/(tabs)/statistics.tsx`
- `app/(employee)/(tabs)/settings.tsx`
- `app/(manager)/(tabs)/calendar.tsx`
- `app/(manager)/(tabs)/statistics.tsx`
- `app/(manager)/(tabs)/settings.tsx`
- `src/components/cards/ActivityCard.tsx`
- `src/components/calendar/WeekCalendarStrip.tsx`
- `src/components/settings/SettingsScreenContent.tsx`
- `src/screens/employee/employee-calendar-screen.tsx`
- `src/screens/employee/employee-statistics-screen.tsx`
- `src/screens/employee/employee-settings-screen.tsx`
- `src/screens/manager/manager-statistics-screen.tsx`
- `src/screens/manager/manager-settings-screen.tsx`
- `docs/flexshift-production-migration.md`

### Bỏ vai trò cũ / compatibility layer

- `src/screens/employee/employee-profile-screen.tsx`
- `src/screens/manager/manager-profile-screen.tsx`

Hai file này không nên xóa vì route cũ vẫn có thể được tham chiếu. Chúng đang đóng vai trò adapter, export sang settings screen mới.

## Phần J — Full Code

Trong turn này, code đã được patch trực tiếp vào mobile app hiện có cho:

- calendar employee + manager
- statistics employee + manager
- settings employee + manager
- activity feed ở dashboard
- user settings persistence bằng SQLite
- tab IA mới

Backend foundation đã được scaffold ở mức tối thiểu:

- `backend/package.json`
- `backend/.env.example`
- `backend/src/main.ts`
- `backend/src/app.module.ts`
- `backend/src/health/*`
- `backend/prisma/schema.prisma`

Phần còn thiếu cho backend production hoàn chỉnh là auth, modules domain, Prisma service, repositories, DTOs và guards.

## Phần K — Migration Plan Từ Bản Cũ

### Phase 1

- giữ SQLite làm source vận hành hiện tại
- thêm calendar, statistics, settings, updates feed
- dọn microcopy và route IA

### Phase 2

- tạo `backend/` NestJS trong cùng repo
- thêm Prisma schema và migrations
- xây auth thật với access/refresh token
- thêm API client trên mobile

### Phase 3

- chuyển repository mobile sang adapter:
  - `remoteRepository` cho online path
  - `sqliteCacheRepository` cho offline snapshot
- mutation flow:
  - gửi API
  - cập nhật cache
  - invalidate query

### Phase 4

- bỏ `loginAsUser`
- thay bằng auth session persisted qua secure storage
- giữ SQLite cho `user_settings`, session snapshot, offline queue

## Phần L — QA Checklist

- đăng nhập nội bộ còn điều hướng đúng role
- nhận ca không cho phép khi trùng lịch
- tạo đơn xin nghỉ tạo status `pending`
- tạo đề nghị nhường ca hiển thị đúng người nhận
- manager duyệt và từ chối vẫn cập nhật list
- calendar employee phản ánh ca đã chốt, ca mở, yêu cầu
- calendar manager phản ánh ca chốt, ca mở, yêu cầu
- statistics employee đúng số ca và số giờ
- statistics manager đúng fill rate, open shift count, pending count
- settings lưu lại sau refresh app

## Phần M — Release Readiness Checklist

- `app.json` đã đổi tên app thành `FlexShift`
- giữ `scheme: flexshift`
- tiếp theo cần bổ sung:
  - `APP_ENV`
  - `EXPO_PUBLIC_API_BASE_URL`
  - icon/splash final asset
  - package id staging/prod tách bạch nếu cần
  - release signing notes cho Android

## Phần N — Risks & Trade-offs

- rủi ro lớn nhất là auth hiện vẫn là internal login, chưa phải auth production
- SQLite hiện vẫn là source dữ liệu mobile vì backend chưa được scaffold trong repo
- chưa nên refactor toàn bộ sang TanStack Query trước khi có API thật
- chưa nên xóa repository SQLite cũ vì nó sẽ là lớp cache/offline quan trọng
- technical debt chấp nhận tạm thời:
  - data service vẫn tập trung trong `src/services/flexshift-service.ts`
  - chưa có shared DTO package giữa mobile/backend
  - chưa có notification center riêng, mới ở mức updates feed trên dashboard

Các file còn thiếu để patch backend chính xác ở turn tiếp theo:

- cấu trúc repo mong muốn cho `backend/`
- env strategy dev/staging/prod
- package id / app-store branding cuối
- yêu cầu auth thật: email/password hay phone/OTP
