import type { Cycle } from './types';

/**
 * date-only 달력 산술 모듈.
 * 모든 계산은 {year, month, day} 정수로만 수행하고, Date 객체는
 * 로컬 타임존 getter/생성자(로컬 자정)로만 오간다. UTC 경유가 없으므로
 * 타임존에 의한 하루 밀림이 구조적으로 불가능하다.
 */
export interface YMD {
  year: number;
  /** 1-12 */
  month: number;
  day: number;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function daysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) return 29;
  return DAYS_IN_MONTH[month - 1];
}

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;

/** ISO 문자열의 날짜 부분만 취한다. 'YYYY-MM-DDTHH:mm...'도 date 부분만 파싱. */
export function parseISODate(value: string): YMD {
  const m = ISO_DATE_RE.exec(value);
  if (!m) throw new Error(`Invalid ISO date: ${value}`);
  const ymd = { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  if (
    ymd.month < 1 ||
    ymd.month > 12 ||
    ymd.day < 1 ||
    ymd.day > daysInMonth(ymd.year, ymd.month)
  ) {
    throw new Error(`Invalid ISO date: ${value}`);
  }
  return ymd;
}

export function formatYMD({ year, month, day }: YMD): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${String(year).padStart(4, '0')}-${mm}-${dd}`;
}

/** Date → 로컬 달력 날짜 (로컬 getter만 사용) */
export function fromLocalDate(date: Date): YMD {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

/** 달력 날짜 → 로컬 자정 Date */
export function toLocalDate({ year, month, day }: YMD): Date {
  return new Date(year, month - 1, day);
}

/** Date를 로컬 기준 'YYYY-MM-DD'로 */
export function formatISODate(date: Date): string {
  return formatYMD(fromLocalDate(date));
}

function toYMD(value: string | Date): YMD {
  return typeof value === 'string' ? parseISODate(value) : fromLocalDate(value);
}

/** 대소 비교용 정수 키 */
function ymdKey({ year, month, day }: YMD): number {
  return year * 10000 + month * 100 + day;
}

/** 1970-01-01 기준 경과 일수 (순수 정수 산술, Howard Hinnant civil algorithm) */
export function daysFromCivil({ year, month, day }: YMD): number {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

export function civilFromDays(z: number): YMD {
  z += 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor(
    (doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365,
  );
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp < 10 ? mp + 3 : mp - 9;
  return { year: month <= 2 ? y + 1 : y, month, day };
}

export function addDaysYMD(ymd: YMD, days: number): YMD {
  return civilFromDays(daysFromCivil(ymd) + days);
}

/**
 * 앵커의 day를 유지한 채 개월을 더한다. 대상 월에 그 날이 없으면
 * 말일로 clamp하되, 앵커 day 자체는 보존되므로 다음 계산에서 복원된다.
 * (앵커 1/31 → 2/28 → 3/31)
 */
export function addMonthsClamped(anchor: YMD, months: number): YMD {
  const totalMonths = anchor.year * 12 + (anchor.month - 1) + months;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12 + 12) % 12 + 1;
  return { year, month, day: Math.min(anchor.day, daysInMonth(year, month)) };
}

/**
 * anchor_date를 원본으로 삼아 from 이후(당일 포함) 첫 결제일을 계산한다.
 * 항상 앵커에서 k주기를 더해 구하므로 next_billing_at에 누적할 때 생기는
 * 날짜 드리프트(1/31 → 2/28 → 3/28)가 발생하지 않는다.
 *
 * @param anchorDate 최초 결제일 (ISO 'YYYY-MM-DD' 또는 Date)
 * @param from 이 날짜 이후 첫 결제일을 찾는다. 기본값은 오늘(로컬).
 * @returns 로컬 자정 기준 Date
 */
export function calcNextBilling(
  anchorDate: string | Date,
  cycle: Cycle,
  cycleCount = 1,
  from: string | Date = new Date(),
): Date {
  if (!Number.isInteger(cycleCount) || cycleCount < 1) {
    throw new Error(`cycleCount must be a positive integer, got ${cycleCount}`);
  }
  const anchor = toYMD(anchorDate);
  const target = toYMD(from);

  if (cycle === 'WEEKLY') {
    const step = 7 * cycleCount;
    const anchorDays = daysFromCivil(anchor);
    const targetDays = daysFromCivil(target);
    const k = anchorDays >= targetDays ? 0 : Math.ceil((targetDays - anchorDays) / step);
    return toLocalDate(civilFromDays(anchorDays + k * step));
  }

  const stepMonths = cycle === 'MONTHLY' ? cycleCount : 12 * cycleCount;
  const monthDiff = (target.year - anchor.year) * 12 + (target.month - anchor.month);
  // 시작 추정치는 항상 target보다 이전 달을 가리키므로 undershoot만 존재한다.
  let k = Math.max(0, Math.floor(monthDiff / stepMonths) - 1);
  let candidate = addMonthsClamped(anchor, k * stepMonths);
  while (ymdKey(candidate) < ymdKey(target)) {
    k += 1;
    candidate = addMonthsClamped(anchor, k * stepMonths);
  }
  return toLocalDate(candidate);
}
