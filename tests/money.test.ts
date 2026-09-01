import { describe, expect, it } from 'vitest';
import {
  AMOUNT_MASK,
  formatUsd,
  toBaseAmount,
  toMonthly,
  toYearly,
  type MoneyFields,
} from '../src/domain/money';

const RATE = 1400;

function sub(partial: Partial<MoneyFields>): MoneyFields {
  return { amount: 0, currency: 'KRW', cycle: 'MONTHLY', cycleCount: 1, ...partial };
}

describe('toBaseAmount — USD 환산 정확도', () => {
  it('KRW는 그대로 반환한다', () => {
    expect(toBaseAmount(sub({ amount: 13500, currency: 'KRW' }), RATE)).toBe(13500);
  });

  it('USD는 센트이므로 /100 후 환율을 곱한다 ($20.00 → 28,000원)', () => {
    expect(toBaseAmount(sub({ amount: 2000, currency: 'USD' }), RATE)).toBe(28000);
  });

  it('센트 끝자리가 있어도 정수로 반올림된다 ($19.99 → 27,986원)', () => {
    expect(toBaseAmount(sub({ amount: 1999, currency: 'USD' }), RATE)).toBe(27986);
  });

  it('환율이 소수여도 정수를 반환한다', () => {
    expect(toBaseAmount(sub({ amount: 2000, currency: 'USD' }), 1387.5)).toBe(27750);
    expect(Number.isInteger(toBaseAmount(sub({ amount: 1999, currency: 'USD' }), 1387.5))).toBe(true);
  });
});

describe('toMonthly', () => {
  it('MONTHLY는 기준 금액 그대로', () => {
    expect(toMonthly(sub({ amount: 13500 }), RATE)).toBe(13500);
    expect(toMonthly(sub({ amount: 2000, currency: 'USD' }), RATE)).toBe(28000);
  });

  it('MONTHLY + cycleCount 3 (3개월 결제)은 3으로 나눈다', () => {
    expect(toMonthly(sub({ amount: 30000, cycleCount: 3 }), RATE)).toBe(10000);
  });

  it('YEARLY는 12로 나눈다 ($215/년, 1400원 → 월 25,083원)', () => {
    expect(toMonthly(sub({ amount: 21500, currency: 'USD', cycle: 'YEARLY' }), RATE)).toBe(25083);
  });

  it('WEEKLY는 × 52 / 12', () => {
    expect(toMonthly(sub({ amount: 3000, cycle: 'WEEKLY' }), RATE)).toBe(13000);
  });

  it('WEEKLY + cycleCount 2 (격주)는 주당 절반', () => {
    expect(toMonthly(sub({ amount: 3000, cycle: 'WEEKLY', cycleCount: 2 }), RATE)).toBe(6500);
  });
});

describe('toYearly', () => {
  it('MONTHLY × 12', () => {
    expect(toYearly(sub({ amount: 13500 }), RATE)).toBe(162000);
  });

  it('YEARLY는 기준 금액 그대로 ($215 → 301,000원)', () => {
    expect(toYearly(sub({ amount: 21500, currency: 'USD', cycle: 'YEARLY' }), RATE)).toBe(301000);
  });

  it('YEARLY + cycleCount 2 (2년 결제)는 절반', () => {
    expect(toYearly(sub({ amount: 20000, cycle: 'YEARLY', cycleCount: 2 }), RATE)).toBe(10000);
  });

  it('WEEKLY × 52', () => {
    expect(toYearly(sub({ amount: 3000, cycle: 'WEEKLY' }), RATE)).toBe(156000);
  });
});

describe('formatUsd — 홈 구독행 표시', () => {
  it('센트가 0이면 소수부를 생략한다 ($20)', () => {
    expect(formatUsd(2000)).toBe('$20');
  });

  it('센트가 있으면 2자리로 표시한다 ($15.99)', () => {
    expect(formatUsd(1599)).toBe('$15.99');
  });

  it('달러부는 천 단위 그루핑한다', () => {
    expect(formatUsd(123456)).toBe('$1,234.56');
  });

  it('hidden이면 마스크를 반환한다', () => {
    expect(formatUsd(2000, true)).toBe(AMOUNT_MASK);
  });
});
