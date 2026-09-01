# 알림 실기기 검증 절차

App.tsx의 임시 검증 화면(버튼 4개 + 로그)으로 scheduler.ts / expoDriver.ts의 실기기 동작을 확인한다.

## 실행 방법

```bash
npx expo start        # Expo Go로 QR 스캔 (안드로이드)
```

- **Expo Go 제한**: SDK 53부터 안드로이드 Expo Go에서 **원격 푸시**는 지원되지 않지만,
  이 앱이 쓰는 **로컬 예약 알림은 Expo Go에서 동작**한다.
- 단, 아래 항목 중 **재부팅 복구·배터리 최적화 검증은 Expo Go 프로세스 특성상 신뢰도가 낮으므로
  development build로 최종 확인**할 것:
  ```bash
  # 방법 1: 로컬 빌드 (Android Studio/SDK 필요)
  npx expo run:android
  # 방법 2: EAS 클라우드 빌드
  npx eas build --profile development --platform android
  ```
  (expo-notifications 아이콘/색 커스텀이 필요해지면 app.json plugins에 expo-notifications 항목 추가)

## 검증 체크리스트

### 1. 예약 시각이 실제 로컬 09:00인지
1. [권한 요청] → granted 확인
2. [시드 5건 예약] → notification_map의 fire_at이 `…T09:00`인지 로그 확인
3. [예약 목록 조회] → OS(getAllScheduledNotificationsAsync)가 보고하는 발화 시각이
   기기 시간대 기준 **오전 9:00**인지 확인
4. 기기 시간대를 다른 지역으로 바꾼 뒤 재예약해도 "그 지역의 09:00"으로 잡히는지 확인
   (UTC 밀림이 있으면 시각이 어긋난다)

- [ ] fire_at 로컬 09:00 확인
- [ ] OS 예약 시각 로컬 09:00 확인
- [ ] 시간대 변경 후에도 로컬 09:00 유지

### 2. 앱 완전 종료(스와이프) 후 알림 수신
1. [10초 뒤 알림] 실행
2. 즉시 앱을 최근 앱 목록에서 스와이프로 종료
3. 10초 뒤 알림 배너가 오는지 확인

- [ ] 종료 상태에서 수신됨

### 3. 기기 재부팅 후 예약 생존
1. [10초 뒤 알림] 대신 여유 있는 예약을 만든다
   (시드 예약 또는 10초 버튼을 수정해 5분으로)
2. 기기를 재부팅하고 앱을 **열지 않은 채** 발화 시각까지 대기
3. 수신 여부 확인 — expo-notifications는 안드로이드에서 BOOT_COMPLETED 리시버로
   재부팅 후 재예약을 시도하지만, 제조사/OS에 따라 실패할 수 있다
4. 실패한다면: 앱 실행 시 `rescheduleAll()`을 호출하는 현재 설계가 복구 수단이 된다
   (포그라운드 진입 시 재예약) — 이 경우 "재부팅 후 앱을 한 번 열어야 알림 복구"를
   알려진 제약으로 문서화할 것

- [ ] 재부팅 후 앱 미실행 상태로 수신됨 (또는 제약 문서화)

### 4. 삼성 배터리 최적화 상태에서 수신
1. 설정 → 배터리 → 백그라운드 사용 제한에서 앱이
   "절전 앱(Sleeping)"/"완전 절전(Deep sleeping)" 목록에 없는지 확인
2. 기본 상태(최적화 켜짐)에서 [10초 뒤 알림] + 앱 종료 → 수신 확인
3. 앱을 "절전 앱"에 수동 추가한 뒤 같은 테스트 반복 → 차단되면
   설정 화면에 "배터리 최적화 예외 안내" 배너가 필요하다는 근거가 됨

- [ ] 기본 최적화 상태 수신 확인
- [ ] 절전 앱 지정 시 동작 기록

## 검증 결과 기록 (2026-09-01, 실기기·development build)

| 항목 | 결과 |
|---|---|
| 알림 권한 요청/허용 | ✅ 정상 |
| 예약 시각 로컬 09:00 | ✅ 정상 (fire_at·OS 예약 모두 09:00) |
| 오프셋 계산 (7/3일 전 + 트라이얼 3/0일) | ✅ 정상 (9건 구성 분해로 확인, 중복 없음) |
| 배터리 "제한(Restricted)" | ❌ **발화 안 됨** — 권한 허용 상태에서도 09:00 예약이 차단됨. "최적화"로 변경하자 밀려 있던 알림이 **즉시 발화** → 예약은 유지되나 OS가 발화만 차단하는 구조 |
| 배터리 "최적화"(기본값) | ✅ 정상 발화 |
| 앱 완전 종료(스와이프) 상태 수신 | ✅ 정상 (preview build, 배터리 '최적화' + 완전 종료 + 10분 대기 → 수신, OS 예약 목록에서 제거 확인) |
| 재부팅 후 예약 생존 | ❌ **전부 소실 확인** (preview build, 시드 5건 예약 후 재부팅 → OS 예약 목록 비어 있음) |

### 재부팅 소실 대응 (2026-09-01 구현)

- **사실 관계**: expo-notifications는 BOOT_COMPLETED 리시버 + 재등록 로직
  (`NotificationsService` SETUP_ACTIONS → `setupScheduledNotifications`)을 내장하고
  `RECEIVE_BOOT_COMPLETED` 권한도 라이브러리 매니페스트에 선언돼 있어 앱에 자동 병합된다.
  즉 선언상으로는 지원 — 그러나 **실기기(삼성)에서 재부팅 후 전부 소실**됨.
  제조사 절전 정책의 부팅 브로드캐스트 차단 또는 재등록 실패로 추정. 신뢰 불가.
- **주 방어선**: 앱 포그라운드 진입 시 자동 재예약 —
  `src/notifications/autoReschedule.ts`의 `maybeRescheduleAll()`을 App 최상위
  AppState 리스너에서 호출. rescheduleAll이 기존 예약을 전부 취소 후 재예약하므로
  중복 없음. 마지막 실행 시각(settings `reschedule_last_run_at`) 기준 1시간 스로틀.
- **보조 방어선 (2026-09-01 추가)**: expo-background-task로 **일 1회 백그라운드 재예약** —
  `src/notifications/backgroundReschedule.ts` (`background-reschedule` 태스크, WorkManager 기반,
  minimumInterval 1440분). 재부팅 후 앱을 열지 않아도 최대 하루 안에 예약이 복구된다.
  실행 이력은 settings `background_task_last_run_at`에 기록 → 설정 화면 "알림 상태 진단"용.
- **v1 잔여 제약**: 삼성 '제한'/'절전 앱' 상태에서는 WorkManager도 차단될 수 있어,
  그 경우엔 여전히 앱 실행(포그라운드 복구) 또는 배터리 설정 안내가 필요하다.

### 백그라운드 태스크 실기기 확인 방법

1. **검증 화면 [BG 작업 테스트] 버튼** (가장 쉬움, 개발 빌드 전용) —
   `BackgroundTask.triggerTaskWorkerForTestingAsync()`로 워커를 즉시 강제 실행하고
   `background_task_last_run_at` 변화를 로그로 보여준다.
2. **adb로 강제 실행** (release/preview 빌드 포함):
   ```bash
   # 등록된 WorkManager 잡 확인 (JOB_ID 파악)
   adb shell dumpsys jobscheduler | grep -A 4 com.hyeonew0.subscriptionalarm
   # 강제 실행
   adb shell cmd jobscheduler run -f com.hyeonew0.subscriptionalarm <JOB_ID>
   ```
3. **실행 이력 확인**: 앱 재실행 시 시작 로그의 "BG 태스크 등록됨 (…, 마지막 실행: …)"
   또는 [BG 작업 테스트] 버튼 출력에서 `background_task_last_run_at` 확인.
4. **자연 실행 확인**: 예약 이력 시각이 하루 주기로 갱신되는지 2일에 걸쳐 관찰.
   (WorkManager는 정확한 시각을 보장하지 않고 충전/유휴 상태에 맞춰 배치될 수 있음)

**결론**: 배터리 "제한" 상태 감지·안내가 필요하다.
- 상태 조회: `src/notifications/battery.ts` (expo-battery 기반. '최적화'와 '제한'의 구분은
  ActivityManager.isBackgroundRestricted 네이티브 모듈 추가 전까지 불가 — 2단계로만 보고)
- 설정 화면 "배터리 최적화" 진단 행 + 권한 허용 직후 안내 다이얼로그 목업 반영 (04_설정, 06_배터리_안내)

## 참고
- 포그라운드 수신은 App.tsx의 `setNotificationHandler`(banner/list 표시)로 확인 가능
- 안드로이드 채널: `default` 채널을 HIGH 중요도로 생성함 — 채널 중요도를 낮추면
  배너 없이 조용히 수신되므로 검증 시 채널 설정도 함께 확인할 것
- 검증 완료 후 App.tsx의 임시 화면은 정식 UI로 교체 예정
