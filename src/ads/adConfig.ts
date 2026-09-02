/**
 * AdMob ID 모음. 네이티브 앱 ID는 app.json 플러그인(androidAppId)에 있고,
 * 여기는 JS에서 쓰는 광고 단위 ID만 둔다.
 *
 * - 테스트 ID는 Google이 공개한 샘플 (https://developers.google.com/admob/android/test-ads)
 * - 실제 ID는 AdMob 콘솔 → 앱 → 광고 단위에서 발급. null이면 프로덕션에서 배너를 아예 그리지 않는다
 *   (자리표시자·빈 카드 방지)
 */

/** Google 샘플 배너 광고 단위 (Android). 개발 빌드는 항상 이걸 쓴다 */
export const TEST_BANNER_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111';

/** 실제 배너 광고 단위 ID. AdMob 콘솔에서 발급 후 채울 것 (형식: ca-app-pub-XXXX/YYYY) */
export const PROD_BANNER_UNIT_ID: string | null = null;

/**
 * 빌드 종류에 맞는 배너 광고 단위 ID.
 * 개발 빌드는 테스트 ID(실제 ID로 테스트하면 계정 정지 사유), 프로덕션은 실제 ID.
 * 프로덕션인데 실제 ID가 없으면 null → 배너를 렌더하지 않는다.
 */
export function resolveBannerUnitId(input: {
  isDev: boolean;
  prodId: string | null;
  testId?: string;
}): string | null {
  const testId = input.testId ?? TEST_BANNER_UNIT_ID;
  if (input.isDev) return testId;
  return input.prodId && input.prodId.trim().length > 0 ? input.prodId : null;
}
