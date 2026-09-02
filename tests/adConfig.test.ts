import { describe, expect, it } from 'vitest';
import { PROD_BANNER_UNIT_ID, resolveBannerUnitId, TEST_BANNER_UNIT_ID } from '../src/ads/adConfig';

describe('resolveBannerUnitId', () => {
  it('개발 빌드는 실제 ID가 있어도 항상 테스트 ID (실제 ID로 테스트 시 계정 정지 위험)', () => {
    expect(resolveBannerUnitId({ isDev: true, prodId: 'ca-app-pub-1/2' })).toBe(TEST_BANNER_UNIT_ID);
    expect(resolveBannerUnitId({ isDev: true, prodId: null })).toBe(TEST_BANNER_UNIT_ID);
  });

  it('프로덕션은 실제 ID, 없으면 null (배너 미렌더)', () => {
    expect(resolveBannerUnitId({ isDev: false, prodId: 'ca-app-pub-1/2' })).toBe('ca-app-pub-1/2');
    expect(resolveBannerUnitId({ isDev: false, prodId: null })).toBeNull();
    expect(resolveBannerUnitId({ isDev: false, prodId: '   ' })).toBeNull();
  });

  it('테스트 ID는 Google 샘플 배너 단위 형식이다', () => {
    expect(TEST_BANNER_UNIT_ID).toMatch(/^ca-app-pub-3940256099942544\/\d+$/);
  });

  it('실제 ID가 채워졌다면 샘플 계정(3940256099942544)이 아니어야 한다', () => {
    if (PROD_BANNER_UNIT_ID !== null) {
      expect(PROD_BANNER_UNIT_ID).toMatch(/^ca-app-pub-\d{16}\/\d+$/);
      expect(PROD_BANNER_UNIT_ID).not.toContain('3940256099942544');
    }
  });
});
