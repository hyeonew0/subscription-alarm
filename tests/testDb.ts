import { DatabaseSync } from 'node:sqlite';
import type { SqlDb, SqlValue } from '../src/db/adapter';
import { migrate } from '../src/db/schema';

/** node:sqlite 인메모리 DB를 SqlDb 인터페이스로 감싼 테스트 더블 */
export function createTestDb(): SqlDb {
  const raw = new DatabaseSync(':memory:');
  const db: SqlDb = {
    execSync: (source) => {
      raw.exec(source);
    },
    runSync: (source, params: SqlValue[] = []) => {
      raw.prepare(source).run(...params);
    },
    getAllSync: <T>(source: string, params: SqlValue[] = []) =>
      raw.prepare(source).all(...params) as T[],
    getFirstSync: <T>(source: string, params: SqlValue[] = []) =>
      (raw.prepare(source).get(...params) ?? null) as T | null,
  };
  migrate(db);
  return db;
}
