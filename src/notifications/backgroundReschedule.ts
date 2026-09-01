import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { getDb } from '../db/database';
import { runBackgroundReschedule } from './autoReschedule';
import { createExpoNotificationDriver } from './expoDriver';

/**
 * 일 1회 백그라운드 재예약 태스크.
 * 재부팅으로 OS 예약이 소실됐을 때 앱을 열지 않아도 최대 하루 안에 복구하는 안전망.
 * (삼성 '제한'/'절전 앱' 상태에서는 WorkManager도 차단될 수 있음 — 완화책이지 해결책 아님)
 *
 * 이 모듈은 앱 시작 시(모듈 스코프에서 defineTask가 실행되도록) App.tsx에서 import해야 한다.
 */
export const BACKGROUND_RESCHEDULE_TASK = 'background-reschedule';

TaskManager.defineTask(BACKGROUND_RESCHEDULE_TASK, async () => {
  try {
    const db = getDb();
    const driver = createExpoNotificationDriver();
    await runBackgroundReschedule(db, driver);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/** 앱 시작 시 1회 호출. 이미 등록돼 있으면 no-op. */
export async function registerBackgroundReschedule(): Promise<void> {
  const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_RESCHEDULE_TASK);
  if (registered) return;
  await BackgroundTask.registerTaskAsync(BACKGROUND_RESCHEDULE_TASK, {
    minimumInterval: 60 * 24, // 분 단위 = 일 1회. 정확한 시각은 OS 재량(WorkManager 배치)
  });
}

/** 개발 빌드 전용: 백그라운드 워커를 즉시 강제 실행 (실기기 검증용) */
export async function triggerBackgroundTaskForTesting(): Promise<void> {
  await BackgroundTask.triggerTaskWorkerForTestingAsync();
}

export async function getBackgroundTaskStatus(): Promise<string> {
  const status = await BackgroundTask.getStatusAsync();
  return status === BackgroundTask.BackgroundTaskStatus.Available ? 'available' : 'restricted';
}
