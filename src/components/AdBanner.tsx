import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { getAdsModule, getBannerUnitId } from '../lib/ads';
import { Card } from './Card';

/** 광고 로드 전 카드가 0 높이로 접혔다 펴지지 않도록 예약하는 높이 (표준 배너 50) */
const RESERVED_HEIGHT = 50;

/**
 * AdMob 배너 카드. 카드 규격 안에 앵커드 적응형 배너를 카드 안쪽 폭에 맞춰 넣는다.
 *
 * - __DEV__면 Google 데모 단위(TestIds), 프로덕션이면 실제 ID (없으면 렌더 안 함) — src/lib/ads.ts
 * - 네이티브 모듈이 없는 빌드(구 dev client)나 로드 실패 시 아무것도 그리지 않는다 → 빈 카드 없음
 * - 좌우 패딩은 0으로 두고 배너 폭을 카드 안쪽 폭에 맞춘다. 적응형 배너의 최소 폭(320)이
 *   360dp 기기에서도 확보되도록 (360 − 화면 좌우 32 = 328)
 */
export function AdBanner() {
  const ads = useMemo(() => getAdsModule(), []);
  const unitId = useMemo(() => getBannerUnitId(), []);
  const [width, setWidth] = useState(0);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');

  if (!ads || !unitId || status === 'failed') return null;

  const { BannerAd, BannerAdSize } = ads;
  return (
    <Card variant="tight" style={{ paddingHorizontal: 0 }}>
      <View
        onLayout={(e) => setWidth(Math.floor(e.nativeEvent.layout.width))}
        style={{
          alignItems: 'center',
          minHeight: status === 'loaded' ? undefined : RESERVED_HEIGHT,
          justifyContent: 'center',
        }}
      >
        {width > 0 && (
          <BannerAd
            unitId={unitId}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            width={width}
            onAdLoaded={() => setStatus('loaded')}
            onAdFailedToLoad={(err) => {
              if (__DEV__) console.warn('[AdBanner] 광고 로드 실패', err?.message);
              setStatus('failed');
            }}
          />
        )}
      </View>
    </Card>
  );
}
