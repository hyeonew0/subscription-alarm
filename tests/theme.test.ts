import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../src/theme/contrast';
import { buildDesignTokens } from '../src/theme/designTokens';
import {
  darkCard,
  darkColors,
  darkElevation,
  darkTheme,
  lightCard,
  lightColors,
  lightTheme,
  radius,
  spacing,
  typography,
  type ColorTokens,
} from '../src/theme/tokens';

const WCAG_AA = 4.5;

const THEMES: Array<[string, ColorTokens]> = [
  ['light', lightColors],
  ['dark', darkColors],
];

describe('contrastRatio 자체 검증', () => {
  it('흑백 대비는 21:1', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5);
  });

  it('같은 색은 1:1, 알파는 무시', () => {
    expect(contrastRatio('#2563EB', '#2563EB')).toBe(1);
    expect(contrastRatio('#000000A6', '#000000')).toBe(1);
  });
});

describe('WCAG AA (4.5:1) 전수 검증', () => {
  for (const [name, colors] of THEMES) {
    const textKeys = ['primary', 'secondary', 'tertiary'] as const;
    const bgKeys = ['canvas', 'surface', 'surfaceAlt'] as const;

    it(`${name}: 모든 text × bg 조합`, () => {
      for (const t of textKeys) {
        for (const b of bgKeys) {
          const ratio = contrastRatio(colors.text[t], colors.bg[b]);
          expect(ratio, `${name} text.${t} on bg.${b} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(WCAG_AA);
        }
      }
    });

    it(`${name}: brand.onPrimary / text.inverse on brand.primary`, () => {
      const on = contrastRatio(colors.brand.onPrimary, colors.brand.primary);
      expect(on, `${name} brand.onPrimary = ${on.toFixed(2)}`).toBeGreaterThanOrEqual(WCAG_AA);
      const inv = contrastRatio(colors.text.inverse, colors.brand.primary);
      expect(inv, `${name} text.inverse on brand = ${inv.toFixed(2)}`).toBeGreaterThanOrEqual(WCAG_AA);
    });

    it(`${name}: 카테고리 칩 배경 위 text.inverse 대비`, () => {
      for (const [key, value] of Object.entries(colors.category)) {
        const ratio = contrastRatio(colors.text.inverse, value);
        expect(ratio, `${name} text.inverse on category.${key} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(WCAG_AA);
      }
    });

    it(`${name}: status 텍스트 사용 시 canvas/surface 대비`, () => {
      for (const [key, value] of Object.entries(colors.status)) {
        for (const b of ['canvas', 'surface'] as const) {
          const ratio = contrastRatio(value, colors.bg[b]);
          expect(ratio, `${name} status.${key} on bg.${b} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(WCAG_AA);
        }
      }
    });
  }
});

describe('토큰 구조', () => {
  it('spacing은 4px 기준', () => {
    expect(spacing).toEqual({ xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 });
  });

  it('radius', () => {
    expect(radius).toEqual({ sm: 8, md: 12, lg: 16, full: 9999 });
  });

  it('typography는 fontSize/lineHeight/fontWeight를 모두 갖는다', () => {
    expect(typography.display).toEqual({ fontSize: 26, lineHeight: 34, fontWeight: '700' });
    expect(typography.micro).toEqual({ fontSize: 11, lineHeight: 15, fontWeight: '400' });
    for (const t of Object.values(typography)) {
      expect(t.lineHeight).toBeGreaterThan(t.fontSize);
    }
  });

  it('라이트/다크 색상 토큰의 키 구조가 동일하다', () => {
    const shape = (o: object): unknown =>
      Object.fromEntries(
        Object.entries(o).map(([k, v]) => [k, typeof v === 'string' ? true : shape(v as object)]),
      );
    expect(shape(lightColors)).toEqual(shape(darkColors));
  });

  it('다크 canvas는 순수 검정이 아니다 (#121212 계열)', () => {
    expect(darkColors.bg.canvas).not.toBe('#000000');
    expect(contrastRatio(darkColors.bg.canvas, '#000000')).toBeLessThan(1.5);
  });

  it('card 규격: 라이트는 은은한 그림자, 다크는 없음', () => {
    expect(lightCard).toMatchObject({ radius: 20, padding: 20, paddingTight: 16, gap: 16 });
    expect(darkCard).toMatchObject({ radius: 20, padding: 20, paddingTight: 16, gap: 16 });
    expect(lightCard.shadow.ios.shadowOpacity).toBeCloseTo(0.04);
    expect(lightCard.shadow.ios.shadowRadius).toBe(8);
    expect(lightCard.shadow.ios.shadowOffset.height).toBe(2);
    expect(darkCard.shadow.ios.shadowOpacity).toBe(0);
    expect(darkCard.shadow.android.elevation).toBe(0);
    expect(lightTheme.card).toBe(lightCard);
    expect(darkTheme.card).toBe(darkCard);
  });

  it('다크 테마 elevation은 그림자 없음 (surface 밝기 차이로 표현)', () => {
    expect(darkElevation.card.ios.shadowOpacity).toBe(0);
    expect(darkElevation.card.android.elevation).toBe(0);
    expect(darkTheme.elevation).toBe(darkElevation);
    expect(lightTheme.elevation.card.android.elevation).toBeGreaterThan(0);
  });
});

describe('design-tokens.json 동기화 (Figma Variables용)', () => {
  const FILE = resolve(process.cwd(), 'design-tokens.json');

  it('파일이 tokens.ts와 일치한다 (UPDATE_TOKENS=1 npm test 로 재생성)', () => {
    const expected = `${JSON.stringify(buildDesignTokens(), null, 2)}\n`;
    if (process.env.UPDATE_TOKENS) {
      writeFileSync(FILE, expected);
      return;
    }
    const actual = readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
    expect(actual).toBe(expected);
  });

  it('DTCG 형식: 리프마다 $type/$value', () => {
    const tokens = buildDesignTokens() as Record<string, any>;
    expect(tokens.color.light.bg.canvas).toEqual({ $type: 'color', $value: lightColors.bg.canvas });
    expect(tokens.color.dark.brand.primary).toEqual({ $type: 'color', $value: darkColors.brand.primary });
    expect(tokens.spacing.lg).toEqual({ $type: 'number', $value: 16 });
    expect(tokens.typography.body.$value).toEqual({ fontSize: 15, lineHeight: 22, fontWeight: 400 });
  });
});
