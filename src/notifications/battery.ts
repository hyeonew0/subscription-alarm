import * as Battery from 'expo-battery';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';

/**
 * 배터리 최적화 상태 (안드로이드 전용).
 * 실기기 검증(2026-09-01): "제한(Restricted)"은 예약 알림 발화를 차단하고,
 * "최적화"(기본값)는 정상 발화한다.
 *
 * 한계: expo-battery의 isBatteryOptimizationEnabledAsync는
 * "최적화 예외(제한 없음) 여부"만 알려주므로 '최적화'와 '제한'을 구분하지 못한다.
 * '제한'의 정밀 감지는 ActivityManager.isBackgroundRestricted() 네이티브 모듈이
 * 필요하다 — 추가 전까지 상태는 3단계가 아닌 2단계로 보고한다.
 */
export type BatteryOptimizationStatus =
  /** 최적화 예외(제한 없음) — 가장 안전 */
  | 'unrestricted'
  /** 최적화 적용 중 ('최적화' 또는 '제한' — 구분 불가) */
  | 'optimized'
  /** iOS 등 해당 없음 */
  | 'not-applicable';

/** 이 앱이 배터리 최적화 예외(제한 없음)인지 */
export async function isIgnoringBatteryOptimizations(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const optimizationEnabled = await Battery.isBatteryOptimizationEnabledAsync();
  return !optimizationEnabled;
}

export async function getBatteryOptimizationStatus(): Promise<BatteryOptimizationStatus> {
  if (Platform.OS !== 'android') return 'not-applicable';
  return (await isIgnoringBatteryOptimizations()) ? 'unrestricted' : 'optimized';
}

/** 배터리 최적화 설정 화면으로 이동 (안드로이드 전용, iOS는 no-op) */
export async function openBatteryOptimizationSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await IntentLauncher.startActivityAsync(
    IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS,
  );
}

/**
 * 알림 권한 허용 직후 배터리 안내를 띄울지 여부.
 * TODO: isBackgroundRestricted 네이티브 감지를 붙이면 '제한'일 때만 true로 좁힌다.
 * 현재는 최적화 예외가 아닌 모든 경우 후보로 반환하므로, 호출부(UI)에서
 * "한 번만 노출 + 나중에 선택 시 재노출 안 함" 정책과 함께 쓸 것.
 */
export async function shouldShowBatteryGuidance(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  return !(await isIgnoringBatteryOptimizations());
}
