import type { SQLiteDatabase } from '@/src/db/sqlite-provider';

import {
  buildSeedNotifications,
  buildSeedOpenShifts,
  buildSeedRequests,
  buildSeedShifts,
  buildSeedUsers,
} from '@/src/db/seed';
import { runInWriteTransaction } from '@/src/db/transaction';

export async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY NOT NULL,
      employee_id TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      store_name TEXT NOT NULL,
      position TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY(employee_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS open_shifts (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      store_name TEXT NOT NULL,
      position TEXT NOT NULL,
      note TEXT NOT NULL,
      status TEXT NOT NULL,
      claimed_by_employee_id TEXT,
      FOREIGN KEY(claimed_by_employee_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      created_by_employee_id TEXT NOT NULL,
      shift_id TEXT NOT NULL,
      target_employee_id TEXT,
      reason TEXT NOT NULL,
      status TEXT NOT NULL,
      manager_note TEXT,
      created_at TEXT NOT NULL,
      reviewed_at TEXT,
      FOREIGN KEY(created_by_employee_id) REFERENCES users(id),
      FOREIGN KEY(target_employee_id) REFERENCES users(id),
      FOREIGN KEY(shift_id) REFERENCES shifts(id)
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY NOT NULL,
      notifications_enabled INTEGER NOT NULL DEFAULT 1,
      approval_updates_enabled INTEGER NOT NULL DEFAULT 1,
      open_shift_alerts_enabled INTEGER NOT NULL DEFAULT 1,
      reminders_enabled INTEGER NOT NULL DEFAULT 1,
      reminder_minutes_before INTEGER NOT NULL DEFAULT 60,
      language TEXT NOT NULL DEFAULT 'vi',
      theme TEXT NOT NULL DEFAULT 'system',
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      requires_ack INTEGER NOT NULL DEFAULT 0,
      acknowledged_at TEXT,
      published_at TEXT NOT NULL,
      expires_at TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      summary TEXT NOT NULL,
      actor_user_id TEXT,
      actor_user_name TEXT,
      payload TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS checklists (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      assignee_id TEXT,
      due_at TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY NOT NULL,
      checklist_id TEXT NOT NULL,
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      FOREIGN KEY(checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_cursors (
      domain TEXT PRIMARY KEY NOT NULL,
      cursor INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pending_mutations (
      client_mutation_id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      entity_id TEXT,
      entity_type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      last_error TEXT,
      requires_network INTEGER NOT NULL DEFAULT 1,
      dedupe_key TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_shifts_employee_date ON shifts(employee_id, date, start_time);
    CREATE INDEX IF NOT EXISTS idx_open_shifts_status ON open_shifts(status, date, start_time);
    CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status, created_at);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_pending_mutations_status ON pending_mutations(status, created_at);
    CREATE INDEX IF NOT EXISTS idx_checklists_updated_at ON checklists(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist ON checklist_items(checklist_id, sort_order);
  `);

  await db.execAsync(`
    UPDATE requests SET type = 'yield' WHERE type = 'swap';
  `);

  const existing = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) as total FROM users',
  );

  if (existing?.total) {
    return;
  }

  await seedDatabase(db);
}

export async function seedDatabase(db: SQLiteDatabase) {
  const users = buildSeedUsers();
  const shifts = buildSeedShifts();
  const openShifts = buildSeedOpenShifts();
  const requests = buildSeedRequests();
  const notifications = buildSeedNotifications();

  await runInWriteTransaction(db, async () => {
    for (const user of users) {
      await db.runAsync(
        `INSERT INTO users (id, full_name, role, phone, email, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        user.id,
        user.fullName,
        user.role,
        user.phone,
        user.email,
        user.status,
      );
    }

    for (const shift of shifts) {
      await db.runAsync(
        `INSERT INTO shifts (id, employee_id, date, start_time, end_time, store_name, position, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        shift.id,
        shift.employeeId,
        shift.date,
        shift.startTime,
        shift.endTime,
        shift.storeName,
        shift.position,
        shift.status,
      );
    }

    for (const openShift of openShifts) {
      await db.runAsync(
        `INSERT INTO open_shifts (id, date, start_time, end_time, store_name, position, note, status, claimed_by_employee_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        openShift.id,
        openShift.date,
        openShift.startTime,
        openShift.endTime,
        openShift.storeName,
        openShift.position,
        openShift.note,
        openShift.status,
        openShift.claimedByEmployeeId,
      );
    }

    for (const request of requests) {
      await db.runAsync(
        `INSERT INTO requests (
          id,
          type,
          created_by_employee_id,
          shift_id,
          target_employee_id,
          reason,
          status,
          manager_note,
          created_at,
          reviewed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        request.id,
        request.type,
        request.createdByEmployeeId,
        request.shiftId,
        request.targetEmployeeId,
        request.reason,
        request.status,
        request.managerNote,
        request.createdAt,
        request.reviewedAt,
      );
    }

    for (const notification of notifications) {
      await db.runAsync(
        `INSERT INTO notifications (id, title, body, type, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        notification.id,
        notification.title,
        notification.body,
        notification.type,
        notification.isRead ? 1 : 0,
        notification.createdAt,
      );
    }
  });
}
