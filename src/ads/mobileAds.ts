/**
 * react-native-google-mobile-ads 지연 로딩.
 *
 * 이 패키지는 import 시점에 TurboModuleRegistry.getEnforcing으로 네이티브 모듈을 찾고,
 * 없으면 throw 한다. 네이티브 모듈은 dev client를 다시 빌드해야 들어오므로
 * (현재 설치된 577d4626 빌드에는 없음) 정적 import 대신 require를 try/catch로 감싸
 * 모듈이 없으면 광고 기능 전체를 조용히 끈다.
 */
type AdsModule = typeof import('react-native-google-mobile-ads');

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
