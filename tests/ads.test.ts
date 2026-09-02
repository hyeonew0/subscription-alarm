import { describe, expect, it } from 'vitest';
import { PROD_BANNER_UNIT_ID, resolveBannerUnitId } from '../src/lib/ads';

const TEST_ID = 'ca-app-pub-3940256099942544/9214589741';

describe('resolveBannerUnitId', () => {
  it('개발 빌드는 실제 ID가 있어도 항상 테스트 ID (실제 단위로 테스트 시 계정 정지 위험)', () => {
    expect(resolveBannerUnitId({ isDev: true, prodId: 'ca-app-pub-1/2', testId: TEST_ID })).toBe(TEST_ID);
    expect(resolveBannerUnitId({ isDev: true, prodId: null, testId: TEST_ID })).toBe(TEST_ID);
  });

  it('프로덕션은 실제 ID, 없으면 null (배너 미렌더)', () => {
    expect(resolveBannerUnitId({ isDev: false, prodId: 'ca-app-pub-1/2', testId: TEST_ID })).toBe('ca-app-pub-1/2');
    expect(resolveBannerUnitId({ isDev: false, prodId: null, testId: TEST_ID })).toBeNull();
    expect(resolveBannerUnitId({ isDev: false, prodId: '   ', testId: TEST_ID })).toBeNull();
  });

  it('실제 ID가 채워졌다면 광고 단위 형식이고 Google 샘플 계정(3940256099942544)이 아니어야 한다', () => {
    if (PROD_BANNER_UNIT_ID !== null) {
      expect(PROD_BANNER_UNIT_ID).toMatch(/^ca-app-pub-\d{16}\/\d+$/);
      expect(PROD_BANNER_UNIT_ID).not.toContain('3940256099942544');
    }
  });
});
