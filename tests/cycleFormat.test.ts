import { describe, expect, it } from 'vitest';
import { displayPlanLabel, initialForSubscription } from '../src/data/catalog';
import {
  formatCycleSchedule,
  formatCycleShort,
  formatKoreanFullDate,
  formatKoreanTime,
  parseISODate,
} from '../src/domain/date';
import { formatOffsets, offsetLabel } from '../src/domain/offsets';

describe('formatCycleShort', () => {
  it('기본 주기', () => {
    expect(formatCycleShort('MONTHLY')).toBe('매월');
    expect(formatCycleShort('WEEKLY')).toBe('매주');
    expect(formatCycleShort('YEARLY')).toBe('매년');
  });

  it('cycleCount > 1', () => {
    expect(formatCycleShort('MONTHLY', 3)).toBe('3개월마다');
    expect(formatCycleShort('WEEKLY', 2)).toBe('2주마다');
    expect(formatCycleShort('YEARLY', 2)).toBe('2년마다');
  });
});

describe('formatCycleSchedule', () => {
  it('매월: 앵커 day 유지', () => {
    expect(formatCycleSchedule('2026-06-03', 'MONTHLY')).toBe('매월 3일');
  });

  it('매주: 앵커 요일 (2026-06-03은 수요일)', () => {
    expect(formatCycleSchedule('2026-06-03', 'WEEKLY')).toBe('매주 수요일');
  });

  it('매년: 앵커 월·일', () => {
    expect(formatCycleSchedule('2026-06-03', 'YEARLY')).toBe('매년 6월 3일');
  });

  it('cycleCount > 1', () => {
    expect(formatCycleSchedule('2026-06-03', 'MONTHLY', 3)).toBe('3개월마다 3일');
  });
});

describe('formatKoreanFullDate', () => {
  it('YYYY년 M월 D일', () => {
    expect(formatKoreanFullDate(parseISODate('2026-06-03'))).toBe('2026년 6월 3일');
  });
});

describe('displayPlanLabel', () => {
  it('저장된 플랜명을 그대로 반환한다', () => {
    expect(displayPlanLabel({ planLabel: '스탠다드' })).toBe('스탠다드');
  });

  it("'직접 입력'(금액을 손수 고친 카탈로그 구독)이면 null", () => {
    expect(displayPlanLabel({ planLabel: '직접 입력' })).toBeNull();
  });

  it('직접 입력 구독(planLabel null)이면 null', () => {
    expect(displayPlanLabel({ planLabel: null })).toBeNull();
  });
});

describe('initialForSubscription', () => {
  it('catalogId가 있으면 이름과 무관하게 카탈로그 이니셜', () => {
    expect(initialForSubscription({ name: 'Claude', catalogId: 'claude' })).toBe('C');
    expect(initialForSubscription({ name: '넷플릭스', catalogId: 'netflix' })).toBe('N');
  });

  it('catalogId가 없어도 이름이 카탈로그와 같으면 카탈로그 이니셜', () => {
    expect(initialForSubscription({ name: '넷플릭스', catalogId: null })).toBe('N');
  });

  it('직접 입력은 첫 글자', () => {
    expect(initialForSubscription({ name: '동네 헬스장', catalogId: null })).toBe('동');
  });
});

describe('formatKoreanTime', () => {
  it('오전/오후 12시간제', () => {
    expect(formatKoreanTime(9, 0)).toBe('오전 9:00');
    expect(formatKoreanTime(14, 30)).toBe('오후 2:30');
  });

  it('경계: 0시=오전 12시, 12시=오후 12시', () => {
    expect(formatKoreanTime(0, 5)).toBe('오전 12:05');
    expect(formatKoreanTime(12, 0)).toBe('오후 12:00');
  });
});

describe('offsetLabel / formatOffsets', () => {
  it('당일·일·개월 표기', () => {
    expect(offsetLabel(0)).toBe('당일');
    expect(offsetLabel(3)).toBe('3일 전');
    expect(offsetLabel(30)).toBe('1개월 전');
    expect(offsetLabel(60)).toBe('2개월 전');
  });

  it('구분자 결합', () => {
    expect(formatOffsets([7, 3])).toBe('7일 전, 3일 전');
    expect(formatOffsets([7, 0], ' · ')).toBe('7일 전 · 당일');
  });
});
