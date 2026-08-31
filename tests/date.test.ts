import { describe, expect, it } from 'vitest';
import { calcNextBilling, formatISODate, parseISODate, toLocalDate } from '../src/domain/date';

/** 결과를 로컬 getter 기반 ISO 문자열로 비교한다 */
function next(anchor: string, cycle: 'WEEKLY' | 'MONTHLY' | 'YEARLY', count: number, from: string): string {
  return formatISODate(calcNextBilling(anchor, cycle, count, from));
}

describe('calcNextBilling — 월말 clamp와 복원', () => {
  it('앵커 1/31: 2월은 28일로 clamp, 3월엔 31일로 복원된다', () => {
    expect(next('2025-01-31', 'MONTHLY', 1, '2025-02-01')).toBe('2025-02-28');
    expect(next('2025-01-31', 'MONTHLY', 1, '2025-03-01')).toBe('2025-03-31');
    expect(next('2025-01-31', 'MONTHLY', 1, '2025-04-01')).toBe('2025-04-30');
    expect(next('2025-01-31', 'MONTHLY', 1, '2025-05-01')).toBe('2025-05-31');
  });

  it('앵커 1/31, 윤년 2월은 29일로 clamp된다', () => {
    expect(next('2024-01-31', 'MONTHLY', 1, '2024-02-01')).toBe('2024-02-29');
    expect(next('2024-01-31', 'MONTHLY', 1, '2024-03-01')).toBe('2024-03-31');
  });

  it('from이 결제일 당일이면 그날을 반환한다', () => {
    expect(next('2025-01-31', 'MONTHLY', 1, '2025-02-28')).toBe('2025-02-28');
  });

  it('from이 clamp된 결제일 직후면 다음 달 복원일로 간다', () => {
    expect(next('2025-01-31', 'MONTHLY', 1, '2025-03-01')).toBe('2025-03-31');
  });
});

describe('calcNextBilling — 윤년 2/29 앵커', () => {
  it('MONTHLY: 평달엔 29일, 2월엔 말일로 clamp', () => {
    expect(next('2024-02-29', 'MONTHLY', 1, '2024-03-01')).toBe('2024-03-29');
    expect(next('2024-02-29', 'MONTHLY', 1, '2025-02-01')).toBe('2025-02-28');
    expect(next('2024-02-29', 'MONTHLY', 1, '2025-03-01')).toBe('2025-03-29');
  });

  it('YEARLY: 평년엔 2/28, 윤년엔 2/29로 복원', () => {
    expect(next('2024-02-29', 'YEARLY', 1, '2024-03-01')).toBe('2025-02-28');
    expect(next('2024-02-29', 'YEARLY', 1, '2027-03-01')).toBe('2028-02-29');
  });
});

describe('calcNextBilling — 연말 넘김', () => {
  it('12/15 앵커의 다음 결제일은 1/15', () => {
    expect(next('2025-12-15', 'MONTHLY', 1, '2025-12-16')).toBe('2026-01-15');
  });

  it('12/31 앵커 → 1/31', () => {
    expect(next('2025-12-31', 'MONTHLY', 1, '2026-01-01')).toBe('2026-01-31');
  });
});

describe('calcNextBilling — cycle_count', () => {
  it('MONTHLY + 3 (3개월 결제): 앵커에서 3개월 간격으로만 떨어진다', () => {
    expect(next('2025-01-31', 'MONTHLY', 3, '2025-02-15')).toBe('2025-04-30');
    expect(next('2025-01-31', 'MONTHLY', 3, '2025-05-01')).toBe('2025-07-31');
    expect(next('2025-01-31', 'MONTHLY', 3, '2025-08-01')).toBe('2025-10-31');
  });

  it('YEARLY + 2 (2년 결제)', () => {
    expect(next('2024-05-10', 'YEARLY', 2, '2024-06-01')).toBe('2026-05-10');
    expect(next('2024-05-10', 'YEARLY', 2, '2026-05-11')).toBe('2028-05-10');
  });

  it('WEEKLY + 2 (격주 결제)', () => {
    expect(next('2025-08-04', 'WEEKLY', 2, '2025-08-05')).toBe('2025-08-18');
    expect(next('2025-08-04', 'WEEKLY', 2, '2025-08-18')).toBe('2025-08-18');
    expect(next('2025-08-04', 'WEEKLY', 2, '2025-08-19')).toBe('2025-09-01');
  });

  it('cycleCount가 1 미만이거나 정수가 아니면 던진다', () => {
    expect(() => calcNextBilling('2025-01-01', 'MONTHLY', 0, '2025-01-01')).toThrow();
    expect(() => calcNextBilling('2025-01-01', 'MONTHLY', 1.5, '2025-01-01')).toThrow();
  });
});

describe('calcNextBilling — 드리프트 없음 (누적 방식 금지 검증)', () => {
  it('1/31 앵커를 12개월 연속 조회해도 항상 앵커 day 기준으로 계산된다', () => {
    const expected = [
      '2025-02-28', '2025-03-31', '2025-04-30', '2025-05-31', '2025-06-30',
      '2025-07-31', '2025-08-31', '2025-09-30', '2025-10-31', '2025-11-30',
      '2025-12-31', '2026-01-31',
    ];
    for (let i = 0; i < expected.length; i += 1) {
      const from = `2025-${String(i + 2).padStart(2, '0')}-01`;
      const fromFixed = i + 2 > 12 ? `2026-01-01` : from;
      expect(next('2025-01-31', 'MONTHLY', 1, fromFixed)).toBe(expected[i]);
    }
  });

  it('from이 앵커 이전이면 앵커 자체가 다음 결제일이다', () => {
    expect(next('2025-06-20', 'YEARLY', 1, '2025-01-01')).toBe('2025-06-20');
  });

  it('아주 오래된 앵커(10년 전)도 정확히 계산된다', () => {
    expect(next('2015-01-31', 'MONTHLY', 1, '2025-03-01')).toBe('2025-03-31');
    expect(next('2015-02-28', 'YEARLY', 1, '2025-03-01')).toBe('2026-02-28');
  });
});

describe('타임존 안전성 — UTC 경유로 하루 밀리지 않음', () => {
  it('반환된 Date는 로컬 자정이다', () => {
    const d = calcNextBilling('2025-01-31', 'MONTHLY', 1, '2025-02-01');
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate()]).toEqual([2025, 2, 28]);
    expect([d.getHours(), d.getMinutes(), d.getSeconds()]).toEqual([0, 0, 0]);
  });

  it('parse → format 왕복이 날짜를 보존한다 (UTC 자정 경계 케이스 포함)', () => {
    for (const iso of ['2025-01-01', '2025-12-31', '2024-02-29', '2025-06-15']) {
      expect(formatISODate(toLocalDate(parseISODate(iso)))).toBe(iso);
    }
  });

  it('Date 인자(로컬 자정)로 넘겨도 문자열 인자와 결과가 같다', () => {
    const fromDate = new Date(2025, 1, 1); // 로컬 2025-02-01
    const a = formatISODate(calcNextBilling('2025-01-31', 'MONTHLY', 1, fromDate));
    const b = next('2025-01-31', 'MONTHLY', 1, '2025-02-01');
    expect(a).toBe(b);
  });

  it('한 해 전체의 날짜에 대해 왕복 변환이 무손실이다', () => {
    for (let i = 0; i < 365; i += 1) {
      const d = new Date(2025, 0, 1 + i);
      expect(formatISODate(toLocalDate(parseISODate(formatISODate(d))))).toBe(formatISODate(d));
    }
  });
});
