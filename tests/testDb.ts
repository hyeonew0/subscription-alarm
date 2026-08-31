import { DatabaseSync } from 'node:sqlite';
import type { SqlDb, SqlValue } from '../src/db/adapter';
import { migrate } from '../src/db/schema';

/** 마이그레이션 미적용 인메모리 DB (마이그레이션 자체를 테스트할 때 사용) */
export function createEmptyDb(): SqlDb {
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
  return db;
}

/** 최신 스키마까지 마이그레이션된 테스트 DB */
export function createTestDb(): SqlDb {
  const db = createEmptyDb();
  migrate(db);
  return db;
}
