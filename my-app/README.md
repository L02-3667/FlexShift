# FlexShift Mobile

FlexShift là ứng dụng điều phối ca làm việc cho nhân viên và quản lý, gồm:

- mobile app dùng Expo + React Native + Expo Router
- backend API dùng NestJS + Prisma
- PostgreSQL là source of truth
- SQLite là mobile operational store để render nhanh, chạy offline và giữ queue đồng bộ

Phiên bản hiện tại đã đi qua Phase 5 theo hướng `resilience-first`, `release-gated`, `offline-aware`, `concurrency-safe`.

## 1. Kiến trúc ngắn gọn

- `app/`: route Expo Router
- `src/`: UI, state, services, sync engine, SQLite store
- `backend/`: NestJS API, Prisma schema, seed, integration tests
- `docs/`: tài liệu Phase 2-5 và migration notes
- `maestro/`: flow E2E
- `reports/`: report sinh ra từ test, coverage, release gate

Luồng dữ liệu chính:

1. Mobile boot từ SQLite để có first render nhanh.
2. Sync engine flush outbox nếu có pending mutation.
3. Mobile gọi `GET /api/sync/pull` để lấy delta mới.
4. PostgreSQL giữ business truth, mobile chỉ giữ projection cục bộ để UX mượt và an toàn khi mất mạng.

## 2. Yêu cầu môi trường

Chuẩn của dự án:

- Node `23.11.0`
- `npm`
- PostgreSQL đang chạy local
- Android Studio emulator hoặc thiết bị thật
- Tùy chọn: iOS simulator, Maestro CLI cho E2E

Không dùng:

- `yarn`
- `pnpm`
- `bun`

Khuyến nghị:

- Android emulator dùng `10.0.2.2` để trỏ về backend local
- Thiết bị thật cần đổi `EXPO_PUBLIC_API_BASE_URL` sang IP LAN của máy dev

## 3. Cài dependencies

Ở thư mục gốc dự án:

```bash
npm install
```

Trong backend:

```bash
npm --prefix backend install
```

## 4. Cấu hình biến môi trường

Tạo file mobile trong PowerShell:

```bash
Copy-Item .env.example .env.development
```

Giá trị mặc định trong `.env.development`:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000/api
EXPO_PUBLIC_SYNC_INTERVAL_MS=60000
```

Tạo file backend trong PowerShell:

```bash
Copy-Item backend/.env.example backend/.env
```

Biến backend tối thiểu:

```env
APP_ENV=development
PORT=3000
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_DB=flexshift
POSTGRES_SHADOW_DB=flexshift_shadow
POSTGRES_USER=postgres
POSTGRES_PASSWORD=123456
DATABASE_URL=postgresql://postgres:123456@127.0.0.1:5432/flexshift?schema=public
DIRECT_URL=postgresql://postgres:123456@127.0.0.1:5432/flexshift?schema=public
SHADOW_DATABASE_URL=postgresql://postgres:123456@127.0.0.1:5432/flexshift_shadow?schema=public
JWT_ACCESS_SECRET=flexshift-access-secret
JWT_REFRESH_SECRET=flexshift-refresh-secret
SYNC_BATCH_LIMIT=250
SYNC_DEFAULT_STALE_MS=300000
```

Lưu ý:

- backend tự đọc lần lượt `.env`, `.env.development`, `.env.local`
- nếu `PORT=3000` đang bị chiếm, hãy đổi sang cổng khác và cập nhật `EXPO_PUBLIC_API_BASE_URL`

## 5. Chuẩn bị database

Tạo database chính và shadow database:

```bash
npm run backend:db:create
```

Kiểm tra kết nối PostgreSQL:

```bash
npm run backend:db:check
```

Generate Prisma client:

```bash
npm run backend:prisma:generate
```

Nếu database mới hoàn toàn, chạy migrate:

```bash
npm run backend:prisma:migrate
```

Nếu đang xử lý local DB cũ và cần đồng bộ schema có kiểm soát, đọc thêm:

- `docs/flexshift-phase-3-production.md`
- `docs/flexshift-production-migration.md`

Seed dữ liệu mẫu:

```bash
npm run backend:prisma:seed
```

Lưu ý quan trọng:

- script seed hiện tại sẽ reset dữ liệu các bảng nghiệp vụ trước khi bơm lại dữ liệu mẫu

## 6. Chạy dự án

Mở backend:

```bash
npm run backend:dev
```

Mở mobile:

```bash
npm run start
```

Lệnh nhanh khác:

```bash
npm run android
npm run ios
npm run web
```

## 7. Tài khoản mẫu sau khi seed

- Quản lý: `manager@flexshift.app` / `FlexShift123!`
- Nhân viên: `an.nguyen@flexshift.app` / `FlexShift123!`

Ngoài ra seed còn tạo thêm nhân viên `linh.tran@flexshift.app` và `minh.pham@flexshift.app` để test open shift, approval race và sync repair.

## 8. Bộ lệnh làm việc hằng ngày

Static checks:

```bash
npm run typecheck
npm run typecheck:backend
npm run lint
npm run prettier:check
npm run audit:static
```

Mobile tests:

```bash
npm run test:unit
npm run test:components
npm run test:snapshots
npm run test:resilience
npm run test:coverage
```

Backend tests:

```bash
npm run test:backend
npm run test:backend:integration
npm run test:backend:concurrency
npm run test:backend:coverage
```

E2E:

```bash
npm run test:e2e:ready
npm run test:e2e
```

## 9. Release gate

Entrypoint chính:

```bash
npm run verify:release
```

Gate này sẽ chạy theo thứ tự:

1. mobile typecheck
2. backend typecheck
3. ESLint
4. Prettier check
5. static audits của repo
6. mobile unit/component/snapshot/resilience tests
7. backend test suite
8. mobile coverage
9. backend coverage
10. Maestro E2E

Nguyên tắc cứng:

- chỉ cần 1 bước fail là dừng
- nếu fail thì không build
- luôn sinh report vào `reports/`

Chạy gate kèm build:

```bash
npm run verify:release:build
```

Hoặc:

```bash
npm run build:guarded
```

## 10. Reports được sinh ở đâu

- `reports/release/`: tổng hợp release gate dạng JSON + Markdown + log từng bước
- `reports/static/`: anti-hardcode, anti-fake-icon, accessibility label, SOLID hotspots
- `reports/e2e/`: trạng thái Maestro, output log, blocker nếu CLI chưa có
- `reports/tests/coverage/mobile/`: coverage mobile
- `reports/tests/coverage/backend/`: coverage backend
- `reports/tests/junit/mobile/`: JUnit mobile
- `reports/tests/junit/backend/`: JUnit backend

Các file nên xem đầu tiên khi có lỗi:

- `reports/release/release-gate-summary.md`
- `reports/static/static-audits.md`
- `reports/e2e/maestro-summary.md`

## 11. No-server, offline và sync

FlexShift không chạy theo kiểu "backend chết là app chết ngay". Luồng mong đợi:

- app có thể boot từ SQLite nếu đã có cache cũ
- banner sync/offline sẽ báo trạng thái stale hoặc queued
- mutation có thể vào outbox thay vì mất hẳn
- khi server phục hồi, queue sẽ replay và sync lại từ server-authoritative state

Một số test quan trọng đã có sẵn:

- degraded mode khi boot offline
- queue/replay/idempotent mutation
- conflict khi claim open shift hoặc review request đồng thời
- timeout / retry / resilience flow

## 12. Hướng dẫn chạy E2E bằng Maestro

Project đã có flow ở thư mục `maestro/`, nhưng máy chạy test cần có Maestro CLI.

Kiểm tra CLI:

```bash
npm run test:e2e:ready
```

Nếu thiếu CLI, release gate sẽ dừng đúng chỗ E2E và ghi blocker vào report. Đây là hành vi mong muốn, không phải bug của gate.

Flow hiện có:

- `maestro/login-and-claim-open-shift.yaml`
- `maestro/manager-review-request.yaml`
- `maestro/offline-queue-smoke.yaml`

## 13. UI/UX hiện tại

Giao diện đã được refresh theo hướng:

- nền kem sáng, điểm nhấn cam ấm, typography đậm
- card bo lớn, phân cấp rõ, CTA dễ thấy
- icon đi qua `AppIcon` wrapper để giữ nhất quán
- tăng chất lượng visual nhưng không thêm animation nặng hoặc render path đắt

Các nguyên tắc giữ hiệu năng:

- tận dụng shared components thay vì dựng UI riêng lẻ cho từng màn
- không thêm gradient runtime nặng hoặc list effect phức tạp
- ưu tiên shadow nhẹ, shape tĩnh, spacing rõ
- tiếp tục giữ SQLite-first boot và sync nền

## 14. Troubleshooting

`Không kết nối được backend từ Android emulator`

- kiểm tra `EXPO_PUBLIC_API_BASE_URL`
- với Android emulator nên dùng `http://10.0.2.2:3000/api`

`Cổng 3000 đã bị chiếm`

- đổi `PORT` trong `backend/.env`
- cập nhật lại `EXPO_PUBLIC_API_BASE_URL`

`Seed chạy xong nhưng dữ liệu biến mất`

- đúng hành vi hiện tại vì seed có reset bảng nghiệp vụ

`verify:release` fail ở E2E

- xem `reports/e2e/maestro-summary.md`
- nguyên nhân thường là máy chưa cài Maestro CLI

`Prisma generate hoặc migrate lỗi do lock trên Windows`

- đóng process đang giữ file Prisma
- chạy lại `npm run backend:prisma:generate`
- nếu vẫn lỗi, kiểm tra terminal/editor đang giữ backend build artifacts

## 15. Tài liệu nên đọc tiếp

- `docs/flexshift-phase-3-production.md`
- `docs/flexshift-production-migration.md`
- `reports/release/release-gate-summary.md`
- `reports/static/static-audits.md`

## 16. Thứ tự khởi động nhanh cho người mới

```bash
npm install
npm --prefix backend install
npm run backend:db:create
npm run backend:prisma:generate
npm run backend:prisma:seed
npm run backend:dev
npm run start
```

Nếu cần verify toàn bộ trước khi build:

```bash
npm run verify:release
```
