/**
 * expo-sqlite의 동기 API와 시그니처를 맞춘 최소 DB 인터페이스.
 * 리포지토리 계층은 이 인터페이스에만 의존하므로,
 * 앱에서는 expo-sqlite로, 테스트에서는 node:sqlite로 구동한다.
 */
export type SqlValue = string | number | null | Uint8Array;

export interface SqlDb {
  execSync(source: string): void;
  runSync(source: string, params?: SqlValue[]): void;
  getAllSync<T>(source: string, params?: SqlValue[]): T[];
  getFirstSync<T>(source: string, params?: SqlValue[]): T | null;
}
