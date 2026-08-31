@AGENTS.md

# Figma MCP 작업 주의사항

- **`setBoundVariableForPaint`가 paint opacity를 보존하지 않는다.** base paint에 `opacity`를 넣거나 반환된 paint를 스프레드해서 opacity를 붙여도 불투명(100%)으로 렌더된다. 이 환경에서 반복 발생하는 이슈 (urgentTint, 플랜 선택 8% 배경에서 두 번 재현).
- **반투명 배경(틴트/오버레이)이 필요하면**: 변수 바인딩된 불투명 fill의 별도 rect를 만들고 **노드 opacity**로 처리할 것 (`layoutPositioning='ABSOLUTE'` + `constraints: STRETCH` + `rect.opacity = 0.08` 패턴).
- 참고: 숨긴(visible=false) 노드는 인스턴스 트리에서 아예 제외되므로, 인스턴스에서 토글할 노드는 컴포넌트에서 기본 '보임'으로 두고 인스턴스에서 끌 것.
