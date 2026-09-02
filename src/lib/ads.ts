/**
 * AdMob 연동 진입점 (react-native-google-mobile-ads).
 *
 * ID 관리
 * - 네이티브 앱 ID는 app.json 플러그인 androidAppId (지금은 Google 공식 샘플 앱 ID)
 * - 배너 광고 단위: __DEV__면 라이브러리 TestIds(Google 공식 데모 단위), 프로덕션이면 PROD_BANNER_UNIT_ID
 * - 전면 광고는 쓰지 않는다 (등록 완주율 우선)
 *
 * 지연 로딩
 * - 이 패키지는 import 시점에 TurboModuleRegistry.getEnforcing으로 네이티브 모듈을 찾고 없으면 throw 한다.
 *   네이티브 모듈은 dev client를 다시 빌드해야 들어오므로, 정적 import 대신 require를 try/catch로 감싸
 *   모듈이 없는 빌드에서는 광고 기능 전체를 조용히 끈다.
 */
type AdsModule = typeof import('react-native-google-mobile-ads');

/**
 * TODO(출시 직전): AdMob 콘솔 → 앱 → 광고 단위(배너)에서 발급받아 채울 것. 형식 ca-app-pub-XXXX/YYYY
 * null이면 프로덕션에서 배너를 아예 그리지 않는다. 앱 ID(app.json androidAppId)도 같이 교체 + 재빌드.
 */
export const PROD_BANNER_UNIT_ID: string | null = null;

let cached: AdsModule | null | undefined;

/** 네이티브 모듈이 있으면 패키지, 없으면 null (한 번만 시도) */
export function getAdsModule(): AdsModule | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('react-native-google-mobile-ads') as AdsModule;
  } catch {
    cached = null;
  }
  return cached;
}

/** SDK 초기화. 앱 시작 시 한 번 호출. 모듈이 없거나 실패해도 앱 흐름엔 영향 없음 */
export async function initializeAds(): Promise<boolean> {
  const ads = getAdsModule();
  if (!ads) return false;
  try {
    await ads.default().initialize();
    return true;
  } catch {
    return false;
  }
}

/**
 * 빌드 종류에 맞는 배너 광고 단위 ID (순수 함수, 테스트용으로 분리).
 * 개발 빌드는 실제 ID가 있어도 항상 테스트 ID — 실제 단위로 테스트 클릭하면 계정 정지 사유.
 * 프로덕션인데 실제 ID가 없으면 null → 배너 미렌더.
 */
export function resolveBannerUnitId(input: { isDev: boolean; prodId: string | null; testId: string }): string | null {
  if (input.isDev) return input.testId;
  return input.prodId && input.prodId.trim().length > 0 ? input.prodId : null;
}

/** 현재 빌드에서 쓸 배너 단위 ID. 모듈이 없으면 null */
export function getBannerUnitId(): string | null {
  const ads = getAdsModule();
  if (!ads) return null;
  // 앵커드 적응형 배너용 데모 단위 (ca-app-pub-3940256099942544/9214589741)
  return resolveBannerUnitId({ isDev: __DEV__, prodId: PROD_BANNER_UNIT_ID, testId: ads.TestIds.ADAPTIVE_BANNER });
}
