# 카탈로그 46종 가격 검증 보고 (2026-09-02)

대상: `src/data/catalog.ts` 46종 · 기준: 공식 사이트 우선, 접근 불가 시 2차 출처 표기.
**코드는 미수정 — 보고서만.** 금액은 모두 월 단위·VAT 포함(별도 표기 없으면), USD는 웹 결제 기준.

## 요약

| 구분 | 건수 |
|---|---|
| 일치 | 26 |
| 금액 변경 필요 | 14 |
| 플랜 구성 변경(추가·명칭·폐기·모델링) | 12 (금액 변경과 중복 포함) |
| 검증 불충분(2차 출처만) | 8 |

핵심 패턴
- **음원 3사(멜론·지니·플로)**: 카탈로그가 VAT 별도 가격을 사용 → 실 결제액과 불일치
- **게임 구독 3종(PS Plus·Game Pass·닌텐도)**: 2025~2026 대폭 인상, 카탈로그는 구 가격
- **iCloud+·Microsoft 365·윌라·밀리**: 2025~2026 인상 반영 안 됨
- **서비스 자체 변화**: 신세계 유니버스(2026-12-31 종료·신규 불가), Notion AI 애드온(폐지), 네이버웹툰 쿠키(월 정액 아님), 배민클럽(2026-10-01 신상품)

---

## 1. 변경 필요 항목 (우선순위순)

우선순위 = 가격 차이 크기 × 서비스 인기. P1은 지금 등록하면 알림 금액이 틀리는 것.

| 순위 | id | 플랜 | 현재값 | 실제값 | 차이 | 출처 | 신뢰도 |
|---|---|---|---|---|---|---|---|
| P1 | adobe-cc | 모든 앱 | 62,000 | **78,100** | +16,100 | [adobe.com/kr plans](https://www.adobe.com/kr/creativecloud/plans.html) 공식 (Chrome 직접 확인, 연간 구독 월별 청구) | high |
| P1 | adobe-cc | 포토그래피 | 11,000 | **26,400** (Lr+Ps 1TB) / Lightroom 단일 13,200 | +15,400 | 동일 공식 페이지. 구 포토그래피 20GB 11,000은 카드에 없음(신규 판매 종료) | high |
| P1 | xbox-game-pass | Ultimate | 13,500 | **19,000** | +5,500 | [xbox.com/ko-kr](https://www.xbox.com/ko-kr/games/store/xbox-game-pass-ultimate/cfq7ttc0khs0) 공식 | high |
| P1 | nintendo-online | 개인 (연간) | 19,900 | **24,900** | +5,000 | [store.nintendo.co.kr](https://store.nintendo.co.kr/nintendo-switch-online) 공식 (2026-07-01 인상) | high |
| P1 | ps-plus | 에센셜 | 7,500 | **12,000** | +4,500 | [store.playstation.com](https://store.playstation.com/ko-kr/concept/10004507) 공식 (2026-05-20 인상) | high |
| P1 | microsoft-365 | Personal (월간) | 8,900 | **12,500** | +3,600 | [microsoft.com/ko-kr](https://www.microsoft.com/ko-kr/microsoft-365/buy/compare-all-microsoft-365-products) 공식 | high |
| P1 | microsoft-365 | Personal (연간) | 89,000 | **125,000** | +36,000/년 | 동일 | high |
| P1 | icloud-plus | 2TB | 11,100 | **14,000** | +2,900 | [support.apple.com/ko-kr/108047](https://support.apple.com/ko-kr/108047) 공식 | high |
| P1 | icloud-plus | 200GB | 3,300 | **4,400** | +1,100 | 동일 | high |
| P1 | netflix | 광고형 스탠다드 | 5,500 | **7,000** | +1,500 | [help.netflix.com/ko/node/24926](https://help.netflix.com/ko/node/24926) 공식 (2025-05 인상) | high |
| P1 | welaaa | 오디오북 멤버십 | 9,900 | **베이직 12,500** | +2,600 | [welaaa.com](https://www.welaaa.com) 공식 (패밀리 16,900) | high |
| P2 | millie | 정기구독 | 9,900 | **11,900** (웹) | +2,000 | 피클플러스·나무위키 (2025-06-10 인상; Play 12,900 / iOS 14,900) | medium |
| P2 | melon | 스트리밍 플러스 | 10,900 | **11,990** | +1,090 | [melon.com 이용권](https://www.melon.com/buy/pamphlet/all.htm) 공식 | high |
| P2 | genie | 음악감상 | 8,400 | **9,240** | +840 | [pay.genie.co.kr](https://pay.genie.co.kr/product/productMain) 공식 | high |
| P2 | flo | 무제한 듣기 | 7,900 | **8,690** | +790 | FLO 공식 상품 API (`/api/purchase/v2/product/display/general`) | high |
| P2 | figma | Professional | $15 | **Full seat $20** (월간) / $16 (연간) | +$5 | [figma.com/pricing](https://www.figma.com/pricing/) 공식($16 연간), 월간 $20은 2차 | medium-high |
| P2 | kakao-emoticon-plus | 이모티콘 플러스 | 4,900 | **3,900** (웹) | -1,000 | [cs.kakao.com](https://cs.kakao.com/helps_html/1073202256?locale=ko) 공식. 4,900은 현재 어느 채널에도 없음 (Play 5,700 / App Store 6,900) | high |
| P3 | bugs | 듣기 무제한 | 8,900 | **8,690** ('무제한 듣기') | -210 | [music.bugs.co.kr/pay](https://music.bugs.co.kr/pay/public) 공식 | high |
| P3 | melon | 모바일 스트리밍 | 7,600 | **7,590** ('모바일 스트리밍클럽') | -10 | melon.com 공식 | high |

## 2. 플랜 구성이 바뀐 서비스

| id | 변경 유형 | 내용 | 권장 조치 | 출처 |
|---|---|---|---|---|
| shinsegae-universe | **서비스 종료** | 2026-01-01부터 신규 가입·자동연장 중단, **2026-12-31 종료**. 후속은 G마켓 '꼭 멤버십' 2,900/월 (2026-04 출시) | 카탈로그에서 제거(기존 등록 행은 v5 스냅샷으로 유지) 또는 '꼭 멤버십'으로 교체 | [G마켓 공지](https://help.gmarket.co.kr/Tcs/Notice/NoticeDetail?kind=N&noticeNo=345937) 공식 / 꼭 멤버십 가격은 언론 |
| notion-ai | **상품 폐지** | AI 애드온 $10 상품 없음. AI는 Business 이상 전용 (KR Business ₩36,000 월간 / ₩30,000 연간) | 항목 삭제, 또는 `notion`에 Business 플랜 추가로 흡수 | [notion.com/ko/pricing](https://www.notion.com/ko/pricing) · [AI FAQ](https://www.notion.com/help/notion-ai-faqs) 공식 |
| naver-webtoon-cookie | **모델링 불일치** | 자동충전은 월 정액이 아니라 잔여량 기준 충전. 최소 단위 20개 2,000원(웹 개당 100원). "월 10개 1,200"은 존재하지 않는 옵션 | '자동충전 20개' 2,000원으로 바꾸거나 카탈로그 제외 (직접 입력 유도) | ddaily·나무위키 (공식 help.naver.com 차단) |
| adobe-cc | **명칭·라인업 변경** | '모든 앱' 카드는 유지(78,100). 포토그래피는 Lr+Ps 1TB 26,400 / Lightroom 13,200 2종 구조 | 포토그래피 → 26,400, 'Lightroom' 13,200 추가 검토 | adobe.com/kr 공식 |
| laftel | **플랜명·누락** | 단일 '멤버십' → **베이직 9,900 + 프리미엄 14,900** (2021-09~) | 라벨 '베이직'으로 변경 + 프리미엄 추가 | help.laftel.net 403 → 나무위키 등 2차 |
| google-one | **명칭 변경** | '프리미엄 2TB' 11,900 → **Google AI Plus (2TB)** 11,900. AI Pro 5TB 29,000은 `gemini`와 동일 상품 | 라벨 변경. gemini와 중복 관계 정리 | [one.google.com](https://one.google.com/about/plans?hl=ko) 공식 (gemini.google 페이지와 값 상충) |
| microsoft-365 | **플랜 추가** | Family 15,500/155,000 · **Premium 29,000/290,000 신설**. Basic 미표시 | Family 추가 검토 | microsoft.com/ko-kr 공식 |
| icloud-plus | **플랜 추가** | 6TB 44,000 · 12TB 88,000 | 선택 | support.apple.com 공식 |
| chatgpt | **플랜 추가 + 통화** | **Go $8 추가**, Pro **$100(5x)** 티어 추가($200 유지). 한국은 **원화 청구 전환**: Go ₩13,000 / Plus ₩29,000 / Pro ₩159,000~ | Go 추가. 한국 신규 가입자는 KRW라 통화 정책 결정 필요 | [chatgpt.com/ko-KR/pricing](https://chatgpt.com/ko-KR/pricing/) · [Pro tiers](https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers) 공식 |
| claude | **플랜 누락** | Max **$200** 티어 누락. 한국 표시가는 VAT 10% 포함 $22 / $110 | Max $200 추가. VAT 표기 여부 결정 | [claude.com/pricing](https://claude.com/pricing) 공식 |
| perplexity / cursor | **플랜 추가** | Perplexity Max $200 · Cursor Pro+ $60, Ultra $200 | 선택 | 각 공식 pricing |
| youtube-premium | **플랜 추가** | **프리미엄 라이트 8,500** (2026-01-30 한국 출시) | 추가 권장(인기) | [blog.youtube ko-kr](https://blog.youtube/intl/ko-kr/news-and-events/yt-premium-lite-kr/) 공식 |
| wavve | **플랜 추가** | **광고형 스탠다드 5,500** (2025-10) + 티빙 더블 이용권 5종 | 광고형 추가 권장 | [contentwavve.com 뉴스룸](http://www.contentwavve.com/news/articleView.html?idxno=722) 공식 |
| tving | **플랜 추가** | 더블 이용권(티빙+웨이브) 7,000/9,500/13,500/15,000/19,500. 공정위 조건으로 2026-12-31까지 인상 금지 | 선택 | mkt.tving.com 프로모션 페이지(준공식) |
| melon | **표준 플랜 누락** | **스트리밍클럽 8,690** (가장 일반적인 상품) 누락 | 추가 권장 | melon.com 공식 |
| baemin-club | **개편 예정** | 현재 3,990 유지. **2026-10-01 신규 배민클럽 출시, 가격 미정** (기존 상품 9/30까지만 신규 가입) | 10월 재확인 | 아시아경제·머니투데이 2026-09-01 |
| nintendo-online | **플랜 소멸** | 3개월 플랜 소멸. 1개월 5,900 · 패밀리 47,900 · 확장팩 49,900/84,900 | 1개월 추가 검토 | store.nintendo.co.kr 공식 |
| xbox-game-pass | **개편** | Core/Standard → Essential 10,800 / Premium 14,900 / Ultimate 19,000 / PC 15,500 | Essential·PC 추가 검토 | xbox.com/ko-kr 공식 |
| ps-plus | **가격 인상(다단)** | 에센셜 12,000 / 3개월 31,000 / 12개월 86,400. 스페셜·디럭스는 출처 불일치 | 스페셜·디럭스 추가는 스토어 앱 확인 후 | store.playstation.com 공식(에센셜만) |

## 3. 일치 확인 항목

| id | 플랜 | 금액 | 출처 | 신뢰도 |
|---|---|---|---|---|
| netflix | 스탠다드 / 프리미엄 | 13,500 / 17,000 | help.netflix.com 공식 | high |
| tving | 광고형/베이직/스탠다드/프리미엄 | 5,500 / 9,500 / 13,500 / 17,000 | LG U+ 유독·mkt.tving.com (준공식; tving.com 상품 페이지 404) | medium-high |
| wavve | 베이직/스탠다드/프리미엄 | 7,900 / 10,900 / 13,900 | 나무위키·ambitstock (wavve.com JS 렌더) | medium |
| coupang-play | 와우 포함 | 7,890 | [news.coupang.com](https://news.coupang.com/archives/38866/) 공식 | high |
| disney-plus | 스탠다드/프리미엄 | 9,900 / 13,900 | [disneyplus.com/ko-kr](https://www.disneyplus.com/ko-kr) 공식 | high |
| watcha | 베이직/프리미엄 | 7,900 / 12,900 (웹) | App Store 인앱 목록(준공식; 공식 403). iOS 베이직 9,500, 프리미엄 iOS 판매중단 | medium |
| laftel | (베이직) | 9,900 | 2차 — 플랜명만 불일치 | medium |
| apple-tv-plus | 월간 | 6,500 | [tv.apple.com/kr](https://tv.apple.com/kr) 공식 (미국 2회 인상에도 한국 유지) | high |
| youtube-premium | 개인 | 14,900 (iOS 19,500) | blog.youtube 공식 | high |
| chatgpt | Plus / Pro | $20 / $200 | help.openai.com 공식 | high |
| claude | Pro / Max | $20 / $100 | claude.com 공식 | high |
| gemini | Google AI Pro | ₩29,000 | one.google.com 공식 | high |
| perplexity | Pro | $20 | perplexity.ai 공식 | high |
| cursor | Pro | $20 | cursor.com 공식 | high |
| github-copilot | Pro / Pro+ | $10 / $39 | [github.com/features/copilot/plans](https://github.com/features/copilot/plans) 공식 | high |
| midjourney | Basic / Standard | $10 / $30 | [docs.midjourney.com](https://docs.midjourney.com/hc/en-us/articles/27870484040333) 공식 | high |
| coupang-wow | 와우 | 7,890 | news.coupang.com 공식 | high |
| naver-plus | 멤버십 | 4,900 (연간 46,800) | 나무위키·뱅크샐러드 (공식 차단) | medium |
| kurly-members | 멤버스 | 1,900 | ZDNet 2026-02 (kurly.com JS 렌더) | medium-high |
| baemin-club | 배민클럽 | 3,990 | 언론 2026-09-01 (10월 개편) | high(현재) |
| yogipass | 요기패스X | 2,900 | [요기요 파트너 공지](https://partner.yogiyo.co.kr) 공식 (정가 4,900 프로모션 성격 — 복귀 리스크) | medium-high |
| youtube-music | 개인 | 11,990 (iOS 14,900) | 공식 | high |
| spotify | Premium 개인 | 11,990 | [spotify.com/kr-ko](https://www.spotify.com/kr-ko/premium/) 공식 | high |
| apple-music | 개인 | 8,900 | [apple.com/kr](https://www.apple.com/kr/apple-music/) 공식 (미국 2026-07 인상 한국 미반영 — 주시) | high |
| ridi-select | 셀렉트 | 4,900 | ridihelp 공식 | high |
| google-one | 베이식 100GB | 2,400 | one.google.com 공식 | high |
| icloud-plus | 50GB | 1,100 | support.apple.com 공식 | high |
| dropbox | Plus | $11.99 (한국도 USD) | [dropbox.com/ko/plans](https://www.dropbox.com/ko/plans) 공식 | high |
| notion | Plus | $12 (한국 표시 ₩16,800 월간 / ₩14,000 연간) | notion.com/ko 공식(KRW), USD는 2차 | medium |
| x-premium | Premium | $8 | help.x.com 403 → 2차 3곳 일치 | medium |

## 4. 검증 불충분 항목 (사유)

공식 페이지를 직접 확인하지 못해 2차 출처에 의존한 것. 금액 자체는 복수 출처가 일치하지만 출시 전 재확인 권장.

| id | 사유 | 미확인 부분 |
|---|---|---|
| tving | tving.com/membership 404, help.tving.com 미해석 | 단독 4종은 LG U+·프로모션 페이지로 교차 확인. 더블 이용권 세부가 |
| wavve | wavve.com/voucher JS 렌더 | 기존 3종 (광고형만 공식 뉴스룸) |
| watcha | help.watcha.com·pricing 403. **회생절차 중, 키노라이츠 인수 확정(2026-08)** → 개편 가능성 | 웹 결제가·프리미엄 판매 여부 |
| laftel | help.laftel.net 403 | 베이직/프리미엄 금액 (나무위키 등 일관) |
| naver-plus | nid.naver.com·help.naver.com 크롤러 차단 | 4,900 (2차 다수 일치) |
| naver-webtoon-cookie | help.naver.com·comic.naver.com 차단 | 개당 단가·자동충전 최소 단위 |
| millie | millie.co.kr 미확인 | 11,900 (피클플러스·나무위키) |
| x-premium | help.x.com 403 | USD $8 (2차 일치) · KRW 표시가는 출처 간 상충(₩9,000~12,400)으로 **low** |
| ps-plus (스페셜·디럭스) | 스토어 상품 페이지 리다이렉트 | 스페셜 16,200 vs 18,000 · 디럭스 19,000 vs 21,000 출처 불일치 |
| notion / notion-ai | notion.com/ko가 KRW 고정 | USD 원가(Plus $12·Business $24)는 2차 |
| gemini (Plus·Ultra) | one.google.com(₩11,900)과 gemini.google(₩7,500) 상충 | AI Plus 가격 — 카탈로그 항목(Pro)엔 영향 없음 |
| shinsegae-universe 후속 | 신세계그룹 뉴스룸 fetch 실패 | '꼭 멤버십' 2,900 (언론 다수) |

## 5. 정책 결정이 필요한 사항 (코드 수정 전)

1. **VAT 포함가 원칙 명문화** — 음원 3사 불일치의 원인. 실 결제액(VAT 포함) 기준으로 통일 권장.
2. **결제 채널 기준** — 웹 vs 인앱 가격이 다른 서비스(카카오 3,900/5,700/6,900, 유튜브 14,900/19,500, 왓챠, 라프텔, 밀리). 카탈로그는 **웹 결제가**로 통일하고 플랜 라벨이나 안내 문구로 인앱 차이를 알릴지 결정.
3. **USD→KRW 청구 전환 서비스** — ChatGPT는 한국 신규 가입 시 KRW 청구(Plus ₩29,000). Claude는 USD지만 VAT 10% 가산($22). 카탈로그를 USD로 둘지, KRW 실청구액으로 둘지 결정.
4. **폐기·종료 항목 처리** — 신세계 유니버스·Notion AI 제거 시 기존 등록 행의 catalog_id 처리(v5 스냅샷은 동결이라 표시엔 영향 없으나 `findCatalogItem`이 null 반환 → 직접 입력 취급되는지 확인 필요).
5. **네이버웹툰 쿠키** — 정액 모델이 아니므로 제외가 깔끔함. 남길 경우 '20개 자동충전 2,000원'.

## 6. 재확인 일정

- **2026-10 초**: 배민클럽 신상품 가격
- **2026-12 이후**: 티빙·웨이브 인상 금지 해제(2026-12-31), 신세계 유니버스 종료
- **수시**: 애플뮤직·애플TV+ 한국 인상 여부, 왓챠 인수 후 개편, 요기패스X 4,900 복귀
