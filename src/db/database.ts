import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import type { SqlDb, SqlValue } from './adapter';
import { migrate } from './schema';
import { seedSubscriptions } from './seed';

/** expo-sqlite 인스턴스를 SqlDb 인터페이스로 감싼다. */
export function wrapExpoDb(raw: SQLiteDatabase): SqlDb {
  return {
    execSync: (source) => raw.execSync(source),
    runSync: (source, params: SqlValue[] = []) => {
      raw.runSync(source, params);
    },
    getAllSync: (source, params: SqlValue[] = []) => raw.getAllSync(source, params),
    getFirstSync: (source, params: SqlValue[] = []) => raw.getFirstSync(source, params),
  };
}

let cached: SqlDb | null = null;

/** 앱 전역에서 사용할 DB. 최초 호출 시 마이그레이션과 시드를 수행한다. */
export function getDb(): SqlDb {
  if (!cached) {
    const raw = openDatabaseSync('subscription-alarm.db');
    raw.execSync('PRAGMA journal_mode = WAL');
    const db = wrapExpoDb(raw);
    migrate(db);
    seedSubscriptions(db);
    cached = db;
  }
  return cached;
}
