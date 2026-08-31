import { describe, expect, it } from 'vitest';
import { AMOUNT_MASK, formatAmount, formatKrw, maskAmount, parseAmountInput, previewKrw } from '../src/domain/money';
import { getHideAmounts, setHideAmounts } from '../src/repos/settingsRepo';
import { createTestDb } from './testDb';

const RATE = 1400;

describe('formatAmount', () => {
  it('KRW는 원화 표기', () => {
    expect(formatAmount({ amount: 13500, currency: 'KRW' }, RATE)).toBe('13,500원');
    expect(formatAmount({ amount: 500, currency: 'KRW' }, RATE)).toBe('500원');
    expect(formatAmount({ amount: 1234567, currency: 'KRW' }, RATE)).toBe('1,234,567원');
  });

  it('USD는 달러 + 원화 근사 병기', () => {
    expect(formatAmount({ amount: 2000, currency: 'USD' }, RATE)).toBe('$20.00 (≈28,000원)');
    expect(formatAmount({ amount: 21500, currency: 'USD' }, RATE)).toBe('$215.00 (≈301,000원)');
    expect(formatAmount({ amount: 1999, currency: 'USD' }, RATE)).toBe('$19.99 (≈27,986원)');
  });

  it('formatKrw 단독 사용', () => {
    expect(formatKrw(0)).toBe('0원');
    expect(formatKrw(1000000)).toBe('1,000,000원');
  });
});

describe('parseAmountInput', () => {
  it('USD "20.00" → 2000센트', () => {
    expect(parseAmountInput('20.00', 'USD')).toBe(2000);
    expect(parseAmountInput('20', 'USD')).toBe(2000);
    expect(parseAmountInput('20.5', 'USD')).toBe(2050);
    expect(parseAmountInput('19.99', 'USD')).toBe(1999);
    expect(parseAmountInput('1,215.50', 'USD')).toBe(121550);
  });

  it('KRW는 정수 원', () => {
    expect(parseAmountInput('13500', 'KRW')).toBe(13500);
    expect(parseAmountInput('13,500', 'KRW')).toBe(13500);
  });

  it('유효하지 않은 입력은 null', () => {
    expect(parseAmountInput('', 'KRW')).toBeNull();
    expect(parseAmountInput('  ', 'USD')).toBeNull();
    expect(parseAmountInput('abc', 'KRW')).toBeNull();
    expect(parseAmountInput('12.34', 'KRW')).toBeNull(); // KRW에 소수 불가
    expect(parseAmountInput('20.999', 'USD')).toBeNull(); // 소수 3자리 불가
    expect(parseAmountInput('20.', 'USD')).toBeNull();
    expect(parseAmountInput('-5', 'KRW')).toBeNull();
  });
});

describe('금액 숨기기', () => {
  it('maskAmount: hidden이면 마스크, 아니면 원본', () => {
    expect(maskAmount('13,500원', true)).toBe(AMOUNT_MASK);
    expect(maskAmount('13,500원', false)).toBe('13,500원');
  });

  it('formatAmount/formatKrw가 hidden 인자를 거친다', () => {
    expect(formatAmount({ amount: 2000, currency: 'USD' }, RATE, true)).toBe(AMOUNT_MASK);
    expect(formatAmount({ amount: 13500, currency: 'KRW' }, RATE, true)).toBe(AMOUNT_MASK);
    expect(formatKrw(13500, true)).toBe(AMOUNT_MASK);
    expect(formatAmount({ amount: 13500, currency: 'KRW' }, RATE, false)).toBe('13,500원');
  });

  it('settings hide_amounts: 기본 false, setter로 토글', () => {
    const db = createTestDb();
    expect(getHideAmounts(db)).toBe(false);
    setHideAmounts(db, true);
    expect(getHideAmounts(db)).toBe(true);
    setHideAmounts(db, false);
    expect(getHideAmounts(db)).toBe(false);
  });
});

describe('previewKrw — 입력 폼 실시간 미리보기', () => {
  it('USD 입력을 KRW로 환산', () => {
    expect(previewKrw('20.00', 'USD', RATE)).toBe(28000);
    expect(previewKrw('19.99', 'USD', RATE)).toBe(27986);
  });

  it('KRW 입력은 그대로', () => {
    expect(previewKrw('13500', 'KRW', RATE)).toBe(13500);
  });

  it('파싱 불가면 null', () => {
    expect(previewKrw('', 'USD', RATE)).toBeNull();
    expect(previewKrw('x', 'KRW', RATE)).toBeNull();
  });
});
