import type { SqlDb } from '../db/adapter';
import { getSetting, setSetting } from '../repos/settingsRepo';
import type { NotificationDriver } from './driver';
import { rescheduleAll } from './scheduler';

const LAST_RUN_KEY = 'reschedule_last_run_at';
export const BACKGROUND_LAST_RUN_KEY = 'background_task_last_run_at';

/** 이 간격 안에서는 포그라운드 전환 때 재예약을 스킵한다 */
export const RESCHEDULE_MIN_INTERVAL_MS = 60 * 60 * 1000; // 1시간

/**
 * 앱 포그라운드 진입 시 호출하는 재예약 가드.
 * 재부팅으로 OS 예약이 소실된 경우의 복구 수단이다 — expo-notifications의
 * BOOT_COMPLETED 리시버가 있지만 실기기(삼성)에서 소실이 확인되어(2026-09-01)
 * 신뢰할 수 없고, 이 경로가 주 방어선이다.
 *
 * rescheduleAll 자체가 기존 예약을 전부 취소 후 재예약하므로 중복은 생기지 않고,
 * 마지막 실행 시각을 settings에 기록해 과도한 재실행을 막는다.
 *
 * @returns 실제로 재예약을 실행했으면 true
 */
export async function maybeRescheduleAll(
  db: SqlDb,
  driver: NotificationDriver,
  now: Date = new Date(),
  minIntervalMs: number = RESCHEDULE_MIN_INTERVAL_MS,
): Promise<boolean> {
  const last = getSetting(db, LAST_RUN_KEY);
  if (last) {
    const lastMs = Date.parse(last);
    if (Number.isFinite(lastMs) && now.getTime() - lastMs < minIntervalMs) return false;
  }
  await rescheduleAll(db, driver, now);
  setSetting(db, LAST_RUN_KEY, now.toISOString());
  return true;
}

/**
 * 일 1회 백그라운드 태스크 본문 (expo-background-task에서 호출).
 * 스로틀 없이 항상 재예약하고, 실행 이력을 settings에 남긴다 —
 * 설정 화면의 "알림 상태 진단"이 이 시각을 읽는다.
 * 포그라운드 스로틀 타임스탬프도 함께 갱신해 직후 앱 실행 시 불필요한 재실행을 막는다.
 */
export async function runBackgroundReschedule(
  db: SqlDb,
  driver: NotificationDriver,
  now: Date = new Date(),
): Promise<void> {
  await rescheduleAll(db, driver, now);
  setSetting(db, LAST_RUN_KEY, now.toISOString());
  setSetting(db, BACKGROUND_LAST_RUN_KEY, now.toISOString());
}
