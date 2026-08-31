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

# Figma MCP 작업 주의사항

- **`setBoundVariableForPaint`가 paint opacity를 보존하지 않는다.** base paint에 `opacity`를 넣거나 반환된 paint를 스프레드해서 opacity를 붙여도 불투명(100%)으로 렌더된다. 이 환경에서 반복 발생하는 이슈 (urgentTint, 플랜 선택 8% 배경에서 두 번 재현).
- **반투명 배경(틴트/오버레이)이 필요하면**: 변수 바인딩된 불투명 fill의 별도 rect를 만들고 **노드 opacity**로 처리할 것 (`layoutPositioning='ABSOLUTE'` + `constraints: STRETCH` + `rect.opacity = 0.08` 패턴).
- 참고: 숨긴(visible=false) 노드는 인스턴스 트리에서 아예 제외되므로, 인스턴스에서 토글할 노드는 컴포넌트에서 기본 '보임'으로 두고 인스턴스에서 끌 것.
