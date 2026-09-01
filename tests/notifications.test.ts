import { describe, expect, it } from 'vitest';
import type { NotificationDriver, NotificationRequest, PermissionState } from '../src/notifications/driver';
import {
  cancelForSubscription,
  filterOffsetsForCycle,
  getAllowedOffsets,
  getPermissionState,
  requestNotificationPermission,
  rescheduleAll,
  SCHEDULED_NOTIFICATION_LIMIT,
  scheduleForSubscription,
} from '../src/notifications/scheduler';
import { getNotifyPermissionAsked, setSetting } from '../src/repos/settingsRepo';
import { createSubscription, getSubscription, updateSubscription } from '../src/repos/subscriptionRepo';
import { createTestDb } from './testDb';

// 로컬 2026-08-31 12:00 고정 (알림 시각 09:00보다 뒤라 당일 알림은 과거로 스킵됨)
const NOW = new Date(2026, 7, 31, 12, 0);

class FakeDriver implements NotificationDriver {
  scheduled = new Map<string, NotificationRequest>();
  cancelled: string[] = [];
  permission: PermissionState = 'undetermined';
  requestResult: PermissionState = 'granted';
  private seq = 0;

  async scheduleAsync(request: NotificationRequest): Promise<string> {
    const id = `n${(this.seq += 1)}`;
    this.scheduled.set(id, request);
    return id;
  }
  async cancelAsync(id: string): Promise<void> {
    this.cancelled.push(id);
    this.scheduled.delete(id);
  }
  async getPermissionsAsync(): Promise<PermissionState> {
    return this.permission;
  }
  async requestPermissionsAsync(): Promise<PermissionState> {
    this.permission = this.requestResult;
    return this.permission;
  }
}

describe('getAllowedOffsets / filterOffsetsForCycle', () => {
  it('주기별 허용 오프셋', () => {
    expect(getAllowedOffsets('YEARLY')).toEqual([30, 7, 3, 0]);
    expect(getAllowedOffsets('MONTHLY')).toEqual([7, 3, 0]);
    expect(getAllowedOffsets('WEEKLY')).toEqual([3, 0]);
  });

  it('MONTHLY에 30일 오프셋이 들어오면 걸러낸다 (상시 알림 버그 방지)', () => {
    expect(filterOffsetsForCycle([30, 7, 3, 0], 'MONTHLY')).toEqual([7, 3, 0]);
    expect(filterOffsetsForCycle([30], 'MONTHLY')).toEqual([]);
  });

  it('WEEKLY에 7일 오프셋도 걸러낸다', () => {
    expect(filterOffsetsForCycle([7, 3, 0], 'WEEKLY')).toEqual([3, 0]);
  });

  it('음수/비정수/중복 제거', () => {
    expect(filterOffsetsForCycle([3, 3, -1, 1.5, 0], 'MONTHLY')).toEqual([3, 0]);
  });
});

describe('scheduleForSubscription', () => {
  it('next_billing_at - offset일, 로컬 09:00 정각에 예약된다 (UTC 밀림 없음)', async () => {
    const db = createTestDb();
    const driver = new FakeDriver();
    const sub = createSubscription(
      db,
      { name: '넷플릭스', category: 'OTT', amount: 13500, cycle: 'MONTHLY', anchorDate: '2026-09-15', notifyOffsets: [7, 3] },
      NOW,
    );
    await scheduleForSubscription(db, driver, sub, NOW);

    const dates = [...driver.scheduled.values()].map((r) => r.triggerDate);
    expect(dates).toHaveLength(2);
    for (const d of dates) {
      expect([d.getHours(), d.getMinutes()]).toEqual([9, 0]); // 로컬 09:00
    }
    // 9/15 결제 → 9/8, 9/12 (로컬 달력 기준)
    expect(dates.map((d) => [d.getMonth() + 1, d.getDate()])).toEqual([[9, 8], [9, 12]]);
  });

  it('notify_offsets가 없으면 settings의 default_notify_offsets([7,3])를 쓴다', async () => {
    const db = createTestDb();
    const driver = new FakeDriver();
    const sub = createSubscription(
      db,
      { name: 'A', category: 'ETC', amount: 1000, cycle: 'MONTHLY', anchorDate: '2026-09-20' },
      NOW,
    );
    await scheduleForSubscription(db, driver, sub, NOW);
    expect(driver.scheduled.size).toBe(2); // 9/13, 9/17
  });

  it('과거 시각은 스킵한다 (NOW 12:00 > 당일 09:00)', async () => {
    const db = createTestDb();
    const driver = new FakeDriver();
    // 결제일이 오늘(8/31)이므로 0일 오프셋 알림은 오늘 09:00 = 과거
    const sub = createSubscription(
      db,
      { name: 'B', category: 'ETC', amount: 1000, cycle: 'MONTHLY', anchorDate: '2026-08-31', notifyOffsets: [0] },
      NOW,
    );
    await scheduleForSubscription(db, driver, sub, NOW);
    expect(driver.scheduled.size).toBe(0);
  });

  it('trial_end_at이 있으면 trial_notify_offsets([3,0])로 별도 예약된다', async () => {
    const db = createTestDb();
    const driver = new FakeDriver();
    const sub = createSubscription(
      db,
      {
        name: '왓챠',
        category: 'OTT',
        amount: 7900,
        cycle: 'MONTHLY',
        anchorDate: '2026-09-07',
        trialEndAt: '2026-09-07',
        notifyOffsets: [3],
      },
      NOW,
    );
    await scheduleForSubscription(db, driver, sub, NOW);
    const reqs = [...driver.scheduled.values()];
    // BILLING: 9/4 (3일 전) + TRIAL: 9/4 (3일 전), 9/7 (당일)
    expect(reqs).toHaveLength(3);
    expect(reqs.filter((r) => r.title.includes('무료체험 종료'))).toHaveLength(2);
  });

  it('구독 수정 시 기존 알림이 취소되고 재예약된다', async () => {
    const db = createTestDb();
    const driver = new FakeDriver();
    const sub = createSubscription(
      db,
      { name: 'C', category: 'ETC', amount: 1000, cycle: 'MONTHLY', anchorDate: '2026-09-15', notifyOffsets: [7, 3] },
      NOW,
    );
    await scheduleForSubscription(db, driver, sub, NOW);
    const firstIds = [...driver.scheduled.keys()];
    expect(firstIds).toHaveLength(2);

    const updated = updateSubscription(db, sub.id, { anchorDate: '2026-09-20' }, NOW);
    await scheduleForSubscription(db, driver, updated, NOW);

    expect(driver.cancelled).toEqual(firstIds); // 기존 예약 전부 취소됨
    expect(driver.scheduled.size).toBe(2); // 새 날짜로 재예약
    const dates = [...driver.scheduled.values()].map((r) => [r.triggerDate.getMonth() + 1, r.triggerDate.getDate()]);
    expect(dates).toEqual([[9, 13], [9, 17]]);
  });

  it('ACTIVE가 아닌 구독은 취소만 하고 예약하지 않는다', async () => {
    const db = createTestDb();
    const driver = new FakeDriver();
    const sub = createSubscription(
      db,
      { name: 'D', category: 'ETC', amount: 1000, cycle: 'MONTHLY', anchorDate: '2026-09-15' },
      NOW,
    );
    await scheduleForSubscription(db, driver, sub, NOW);
    expect(driver.scheduled.size).toBe(2);

    const paused = updateSubscription(db, sub.id, { status: 'PAUSED' }, NOW);
    await scheduleForSubscription(db, driver, paused, NOW);
    expect(driver.scheduled.size).toBe(0);
  });

  it('권한이 거부 상태여도 예약 로직은 정상 실행된다', async () => {
    const db = createTestDb();
    const driver = new FakeDriver();
    driver.permission = 'denied';
    const sub = createSubscription(
      db,
      { name: 'E', category: 'ETC', amount: 1000, cycle: 'MONTHLY', anchorDate: '2026-09-15' },
      NOW,
    );
    await scheduleForSubscription(db, driver, sub, NOW);
    expect(driver.scheduled.size).toBe(2);
  });
});

describe('cancelForSubscription', () => {
  it('매핑 기반으로 해당 구독의 알림만 전부 취소한다', async () => {
    const db = createTestDb();
    const driver = new FakeDriver();
    const a = createSubscription(
      db,
      { name: 'A', category: 'ETC', amount: 1, cycle: 'MONTHLY', anchorDate: '2026-09-15' },
      NOW,
    );
    const b = createSubscription(
      db,
      { name: 'B', category: 'ETC', amount: 1, cycle: 'MONTHLY', anchorDate: '2026-09-20' },
      NOW,
    );
    await scheduleForSubscription(db, driver, a, NOW);
    await scheduleForSubscription(db, driver, b, NOW);
    expect(driver.scheduled.size).toBe(4);

    await cancelForSubscription(db, driver, a.id);
    expect(driver.scheduled.size).toBe(2);
    const remaining = db.getAllSync<{ subscription_id: string }>('SELECT subscription_id FROM notification_map');
    expect(remaining.every((r) => r.subscription_id === b.id)).toBe(true);
  });
});

describe('rescheduleAll', () => {
  it('64개 초과 시 가까운 순으로 잘라서 예약한다', async () => {
    const db = createTestDb();
    const driver = new FakeDriver();
    // 25개 구독 × 3 오프셋 = 75 후보 > 64
    for (let i = 0; i < 25; i += 1) {
      const day = String((i % 28) + 1).padStart(2, '0');
      createSubscription(
        db,
        { name: `구독${i}`, category: 'ETC', amount: 1000, cycle: 'MONTHLY', anchorDate: `2026-10-${day}`, notifyOffsets: [7, 3, 0] },
        NOW,
      );
    }
    await rescheduleAll(db, driver, NOW);

    expect(driver.scheduled.size).toBe(SCHEDULED_NOTIFICATION_LIMIT);

    // 기대값을 독립적으로 계산: 75개 발화 시각 중 가장 가까운 64개
    const allExpected: string[] = [];
    for (let i = 0; i < 25; i += 1) {
      for (const off of [7, 3, 0]) {
        const d = new Date(2026, 9, (i % 28) + 1 - off, 9, 0); // JS Date가 월 경계 정규화
        const pad = (n: number) => String(n).padStart(2, '0');
        allExpected.push(
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T09:00`,
        );
      }
    }
    const expected = allExpected.sort().slice(0, SCHEDULED_NOTIFICATION_LIMIT);

    const fireAts = db
      .getAllSync<{ fire_at: string }>('SELECT fire_at FROM notification_map ORDER BY fire_at ASC')
      .map((r) => r.fire_at);
    expect(fireAts).toEqual(expected);
  });

  it('지난 next_billing_at을 anchor 기준으로 재계산 후 예약한다', async () => {
    const db = createTestDb();
    const driver = new FakeDriver();
    const created = new Date(2026, 5, 1); // 2026-06-01에 생성
    const sub = createSubscription(
      db,
      { name: '오래된', category: 'ETC', amount: 1000, cycle: 'MONTHLY', anchorDate: '2026-05-31', notifyOffsets: [3] },
      created,
    );
    expect(sub.nextBillingAt).toBe('2026-06-30');

    // 두 달 뒤 포그라운드 진입 (NOW = 2026-08-31)
    await rescheduleAll(db, driver, NOW);
    expect(getSubscription(db, sub.id)?.nextBillingAt).toBe('2026-08-31'); // 5/31 앵커 복원
    // 8/31 - 3일 = 8/28 09:00은 과거이므로 스킵, 예약 0건
    expect(driver.scheduled.size).toBe(0);
  });

  it('재호출 시 기존 예약을 전부 취소하고 다시 예약한다 (중복 없음)', async () => {
    const db = createTestDb();
    const driver = new FakeDriver();
    createSubscription(
      db,
      { name: 'A', category: 'ETC', amount: 1, cycle: 'MONTHLY', anchorDate: '2026-09-15' },
      NOW,
    );
    await rescheduleAll(db, driver, NOW);
    const firstIds = [...driver.scheduled.keys()];
    await rescheduleAll(db, driver, NOW);
    expect(driver.cancelled).toEqual(expect.arrayContaining(firstIds));
    expect(driver.scheduled.size).toBe(2);
    const mapCount = db.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM notification_map');
    expect(mapCount?.c).toBe(2);
  });
});

describe('maybeRescheduleAll — 포그라운드 자동 복구', () => {
  it('첫 호출은 실행, 스로틀 간격 안 재호출은 스킵, 간격 지나면 다시 실행', async () => {
    const { maybeRescheduleAll } = await import('../src/notifications/autoReschedule');
    const db = createTestDb();
    const driver = new FakeDriver();
    createSubscription(
      db,
      { name: 'A', category: 'ETC', amount: 1, cycle: 'MONTHLY', anchorDate: '2026-09-15' },
      NOW,
    );
    const HOUR = 60 * 60 * 1000;

    expect(await maybeRescheduleAll(db, driver, NOW, HOUR)).toBe(true);
    const count = driver.scheduled.size;
    expect(count).toBeGreaterThan(0);

    // 30분 뒤: 스킵 (예약 그대로)
    const later30 = new Date(NOW.getTime() + 30 * 60 * 1000);
    expect(await maybeRescheduleAll(db, driver, later30, HOUR)).toBe(false);
    expect(driver.scheduled.size).toBe(count);

    // 2시간 뒤: 다시 실행 (기존 취소 후 재예약 → 중복 없음)
    const later2h = new Date(NOW.getTime() + 2 * HOUR);
    expect(await maybeRescheduleAll(db, driver, later2h, HOUR)).toBe(true);
    expect(driver.scheduled.size).toBe(count);
    expect(driver.cancelled.length).toBe(count);
  });
});

describe('runBackgroundReschedule — 일 1회 백그라운드 재예약', () => {
  it('스로틀 없이 재예약하고 실행 이력 두 키를 기록한다', async () => {
    const { maybeRescheduleAll, runBackgroundReschedule } = await import(
      '../src/notifications/autoReschedule'
    );
    const { getBackgroundTaskLastRunAt } = await import('../src/repos/settingsRepo');
    const db = createTestDb();
    const driver = new FakeDriver();
    createSubscription(
      db,
      { name: 'A', category: 'ETC', amount: 1, cycle: 'MONTHLY', anchorDate: '2026-09-15' },
      NOW,
    );

    await runBackgroundReschedule(db, driver, NOW);
    expect(driver.scheduled.size).toBeGreaterThan(0);
    expect(getBackgroundTaskLastRunAt(db)).toBe(NOW.toISOString());

    // 직후 포그라운드 진입은 스로틀로 스킵 (타임스탬프 공유 확인)
    const shortly = new Date(NOW.getTime() + 5 * 60 * 1000);
    expect(await maybeRescheduleAll(db, driver, shortly)).toBe(false);
  });
});

describe('권한', () => {
  it('requestNotificationPermission은 상태를 반환하고 asked 플래그를 기록한다', async () => {
    const db = createTestDb();
    const driver = new FakeDriver();
    expect(getNotifyPermissionAsked(db)).toBe(false);

    const state = await requestNotificationPermission(db, driver);
    expect(state).toBe('granted');
    expect(getNotifyPermissionAsked(db)).toBe(true);
  });

  it('getPermissionState는 현재 상태를 그대로 반환한다', async () => {
    const driver = new FakeDriver();
    expect(await getPermissionState(driver)).toBe('undetermined');
    driver.permission = 'denied';
    expect(await getPermissionState(driver)).toBe('denied');
  });
});

describe('설정 커스터마이즈', () => {
  it('notify_time을 바꾸면 그 시각으로 예약된다', async () => {
    const db = createTestDb();
    const driver = new FakeDriver();
    setSetting(db, 'notify_time', '21:30');
    const sub = createSubscription(
      db,
      { name: 'F', category: 'ETC', amount: 1, cycle: 'MONTHLY', anchorDate: '2026-09-15', notifyOffsets: [3] },
      NOW,
    );
    await scheduleForSubscription(db, driver, sub, NOW);
    const d = [...driver.scheduled.values()][0].triggerDate;
    expect([d.getHours(), d.getMinutes()]).toEqual([21, 30]);
  });
});
