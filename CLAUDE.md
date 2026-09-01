@AGENTS.md

# 프로젝트 규칙

## 코드
- 날짜 계산은 반드시 anchor_date 기준. next_billing_at 누적 금지
- 모든 날짜는 {year, month, day} 정수 산술. Date 객체 UTC 변환 금지
- 금액은 최소 화폐단위 정수. KRW=원, USD=센트
- 스키마 변경 시 PRAGMA user_version 올리고 마이그레이션 무손실 테스트 필수

## 디자인
- 색/간격/타이포는 반드시 Variables 바인딩. hex 하드코딩 금지
- 새 색상 추가 시 WCAG AA(4.5:1) 검증 필수
- 카드 규격: radius 20 / padding 20 / paddingTight 16 / gap 16
- 모든 콘텐츠는 카드 안에. 배경에 직접 놓인 요소 없음
- tokens.ts 변경 시 design-tokens.json + Figma Variables 3곳 동기화

## 작업
- Figma 목업 완료 후 라이트/다크 스크린샷 둘 다 제공
- 스크롤 콘텐츠 하단에 FAB 높이만큼(72px) 여백 확보

# 현재 진행 상황 (2026-09-02)

## 완료
- 데이터 레이어 (스키마 v4, 결제일 계산 엔진, 알림 스케줄러, 카탈로그 46종)
- 디자인 토큰 (라이트/다크, WCAG AA 전수 검증, Figma Variables 연동, design-tokens.json 골든파일)
- 알림 실기기 검증 (배터리 최적화 조건별 실증, 재부팅 소실 → 포그라운드 복구 + 일 1회 백그라운드 태스크)
- Figma 목업 14종 + FigJam 화면 플로우 보드
- expo-router 네비게이션 뼈대 + 탭바 + FAB
- 등록 플로우 (그리드 + 바텀시트 + 직접 입력, 첫 등록 시 권한 안내)
- 홈 화면 (총액/구독리스트(D-순·금액순 토글)/카테고리 스택바/광고 자리표시자, 빈 상태 + 빠른 시작 → `/add?preset=<id>` 시트 자동 오픈)
  - 전월 대비 증감 문구는 TODO (지난달 실제 결제분 열거 필요 — TotalCard.tsx 주석 참고)
- 목록 화면 (카테고리 카드(소계 큰 순)/앵커 칩 스크롤 이동/정렬 시트 4종/해지함 확장/빈 상태, 구독행은 SubscriptionRow로 공용화)
- 구독 상세 (서비스 카드/결제 정보/알림/메모, 플랜 라벨은 카탈로그 매칭 planLabelFor)
- 해지·재개 (⋯ 메뉴 시트(수정/해지·재개) + ConfirmDialog(10_해지확인 규격), 해지=softDelete+알림 취소, 재개=updateSubscription(ACTIVE)이 anchor 기준 재계산+재예약, 해지 상세엔 배지·재개 버튼) → 등록·조회·수정·해지 사이클 완성
- 수정 폼 (기본정보/금액+환산 미리보기/주기+결제일/알림 체크리스트/메모, 저장 시 scheduleForSubscription 재예약, 결제일 변경 시 anchor_date 갱신·미변경 시 보존, dirty면 나가기 확인)
  - 공용 폼 부품: `src/components/form/` (FieldLabel·FormTextInput·AmountRow·OptionSheet·CheckRow) — ManualSheet·SortSheet도 이걸 쓰도록 리팩터링됨
- 설정 화면 (알림 시점/시각 변경 시 rescheduleAll, 권한·배터리 상태는 AppState 복귀 시 재확인, 테마·환율·금액 숨기기, 해지함→`/list?expandCancelled=1`, 개발자 도구는 __DEV__만)
  - TODO 스텁: 데이터 내보내기(expo-file-system+expo-sharing 네이티브 모듈 필요 — dev client 재빌드 시점에), 오픈소스 라이선스
- 통계 화면 (연간 예상/결제일 히트맵(`src/domain/billingDayStats.ts` 집계·피크·강도 3단)/카테고리 진행바/인사이트/월별 추이 빈상태 고정(스냅샷 테이블 생기면 교체 — stats.tsx TODO)/빈 상태)
  - 공용화: SectionCard(heading+구분선 카드) · EmptyStateCard(목록·통계 빈상태) — 상세·목록도 이걸 쓰도록 리팩터링
- **화면 6종 전부 구현 완료 (홈·목록·등록·상세·수정·해지·설정·통계)**
- 개인정보처리방침 (`docs/privacy.html`, GitHub Pages 호스팅 대상 — URL은 `src/lib/links.ts` PRIVACY_POLICY_URL, 설정 정보 카드에 링크 행)

## 다음
실기기 통합 검증 (dev build 설치 후 전 화면 라이트/다크 확인) → AdMob 연동 · 데이터 내보내기 · 전월 대비 증감

## Figma
- 디자인 파일: https://www.figma.com/design/lnQi0U1HDFLD7H5U7ifGfC (fileKey `lnQi0U1HDFLD7H5U7ifGfC`)
- 플로우 보드(FigJam): https://www.figma.com/board/59Xr6yZkxjzBbzwczVvoyT
- 프레임 좌표 (모두 y=0, 393×852):
  | 프레임 | x | 프레임 | x |
  |---|---|---|---|
  | 01_홈 | 0 | 01_홈_빈상태 | 2958 |
  | 02_목록 | 493 | 02_목록_빈상태 | 3451 |
  | 03_등록_그리드 | 986 | 05_통계_빈상태 | 3944 |
  | 03_등록_시트 | 1479 | 06_배터리_안내 | 4437 |
  | 04_설정 | 1972 | 07_구독상세 | 4930 |
  | 05_통계 | 2465 | 08_수정폼 | 5423 |
  | 09_알림권한_안내 | 5916 | 10_해지확인 | 6409 |
- 컴포넌트 마스터: 구독카드 (500,1000) · 구독리스트카드 (900,1000) · 구독행 variant set shade=1|2|3 (500,1120) · 서비스셀 (500,1250)
- 컬렉션: color(Light/Dark) · spacing · radius · typography · card / 이펙트 스타일 card/shadow-light
- 스크린샷 익스포트: `screenshots/` (폴더 구조는 screenshots/README.md)

## 주요 파일 위치
- 도메인: `src/domain/date.ts`(calcNextBilling·달력 산술) · `src/domain/money.ts`(환산·포맷·마스킹) · `src/domain/types.ts`
- DB: `src/db/schema.ts`(마이그레이션 v1~v4) · `src/db/database.ts`(expo 진입점) · `src/db/seed.ts`
- 리포지토리: `src/repos/subscriptionRepo.ts` · `src/repos/settingsRepo.ts`
- 알림: `src/notifications/scheduler.ts`(예약·오프셋) · `expoDriver.ts` · `battery.ts` · `autoReschedule.ts`(포그라운드 복구) · `backgroundReschedule.ts`(일 1회 태스크)
- 카탈로그: `src/data/catalog.ts`(46종) · `src/data/catalogSearch.ts`(초성 검색·draft)
- 테마: `src/theme/tokens.ts`(토큰·getCategoryChipColors) · `ThemeProvider.tsx` · `designTokens.ts`(DTCG 빌더, UPDATE_TOKENS=1로 JSON 재생성)
- 컴포넌트: `src/components/` (Screen·Card·Fab·AppText·ServiceChip·SubscriptionRow(구독행 공용)·CurrencyToggle·CycleSegment·DateField·BottomSheet·register/*·home/*·list/*)
- 홈·목록 로직: `src/domain/categoryStats.ts`(카테고리 집계·그룹핑·라벨) · `src/domain/listSort.ts`(목록 정렬 4종) · `src/theme/rowShades.ts`(셰이드: 혼합 카드 1→2→3 반복 computeRowShades, 단일 카테고리 선형 분배 distributeShades) · `date.ts daysUntil·formatCycleShort·formatCycleSchedule·formatKoreanFullDate` · `money.ts formatUsd` · `catalog.ts initialForServiceName·planLabelFor`
- 라우트: `app/` (expo-router — (tabs)/·add/·subscription/[id]·debug)
- 문서: `notes/notification-testing.md`(실기기 검증 기록·확인 방법) · `docs/`는 GitHub Pages 공개 폴더(privacy.html만)

# Figma MCP 작업 주의사항

- **`setBoundVariableForPaint`가 paint opacity를 보존하지 않는다.** base paint에 `opacity`를 넣거나 반환된 paint를 스프레드해서 opacity를 붙여도 불투명(100%)으로 렌더된다. 이 환경에서 반복 발생하는 이슈 (urgentTint, 플랜 선택 8% 배경에서 두 번 재현).
- **반투명 배경(틴트/오버레이)이 필요하면**: 변수 바인딩된 불투명 fill의 별도 rect를 만들고 **노드 opacity**로 처리할 것 (`layoutPositioning='ABSOLUTE'` + `constraints: STRETCH` + `rect.opacity = 0.08` 패턴).
- 참고: 숨긴(visible=false) 노드는 인스턴스 트리에서 아예 제외되므로, 인스턴스에서 토글할 노드는 컴포넌트에서 기본 '보임'으로 두고 인스턴스에서 끌 것.
