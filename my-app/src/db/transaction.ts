import type { SQLiteDatabase } from '@/src/db/sqlite-provider';

type TransactionRunner = <T>(task: () => Promise<T>) => Promise<T>;

type SQLiteDatabaseWithExclusiveTransactions = SQLiteDatabase & {
  withExclusiveTransactionAsync?: TransactionRunner;
};

export async function runInWriteTransaction<T>(
  db: SQLiteDatabase,
  task: () => Promise<T>,
) {
  const exclusiveRunner = (
    db as SQLiteDatabaseWithExclusiveTransactions
  ).withExclusiveTransactionAsync;

  if (typeof exclusiveRunner === 'function') {
    return exclusiveRunner.call(db, task);
  }

  return db.withTransactionAsync(task);
}
