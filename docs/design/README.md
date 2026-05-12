# Design references

이 폴더는 본 프로젝트의 디자인 mockup과 토큰 참조를 담습니다. 디자인 시스템은 [`DESIGN.md`](../../DESIGN.md) (Webflow-derived) 기준입니다.

## 파일

| 파일 | 내용 |
|---|---|
| [`00-design-tokens.svg`](./00-design-tokens.svg) | 컬러(primary + 5 chromatic accents + neutrals)·라디우스(2/4/8/full)·버튼·타이포 참조 |
| [`01-library.svg`](./01-library.svg) | 내 서재 (홈) — **dark shelf room** 모드: 3-up 그리드, 선반 plank + contact shadow로 입체감, 다양한 표지 디자인 |
| [`02-add-book-sheet.svg`](./02-add-book-sheet.svg) | 책 추가 모달 — ISBN/제목 검색 + 결과 카드 + 검정 primary CTA |
| [`03-book-detail.svg`](./03-book-detail.svg) | 책 상세 — 표지 hero, 구절 추가 CTA, hairline-bordered 구절 카드 |
| [`04-auth-modal.svg`](./04-auth-modal.svg) | 로그인 모달 — 이메일/패스워드 + Google + 게스트 진입 |

## Pencil 소스

[`lib/pencil/bookshelf.pen`](../../lib/pencil/bookshelf.pen)에 Pencil 디자인 아티팩트가 있습니다. Pencil 앱에서 열어 편집할 수 있습니다.

## 사용된 토큰 (Webflow-derived)

- **Primary**: `#080808` (near-black) — 모든 primary CTA, 헤딩, 워드마크. 절대 red/색상 CTA 사용 안 함.
- **Chromatic accents**: `#7a3dff`(purple) `#ed52cb`(pink) `#3b89ff`(blue) `#ff6b00`(orange) `#00d722`(green) — category-card 전용 풀필. 버튼 배경으로 사용 금지.
- **Neutrals**: canvas `#ffffff`, hairline `#d8d8d8` (1px border 전용), ink `#080808`, body `#363636`, body-mid `#5a5a5a`, mute `#898989`, mute-soft `#ababab`
- **Radii**: `none/xs(2)/sm(4)/md(8)/full(9999)` — sm=4px가 버튼, md=8px가 카드. Pill CTA 사용 안 함.
- **Spacing**: 2/4/8/12/16/20/24/32 (4px base)
- **Typography**: Inter (WF Visual Sans Variable 대체). 가중치는 400/500/600만 — **700 이상 금지**. display는 negative tracking.
- **Shadows**: 5-stop layered drop shadow (`shadow-layered`, `shadow-layered-strong`, `shadow-modal`) + Library-전용 `shadow-book` (책 contact shadow).
- **Shelf room (Library 전용)**: `shelf-bg #1a1a1a` 배경 + `shelf-edge #3a3a3a` 1px highlight + linear-gradient 그림자로 실제 책 진열대 느낌. 상세는 design spec §3.3.

본 SVG mockup은 Pencil MCP의 PNG 익스포트 한계로 손코딩되었습니다. Phase 4 구현 후 실제 Playwright 스크린샷으로 교체될 수 있습니다.

## 일러두기

책 표지의 컬러풀한 fill은 mockup에서 시각 변별을 위한 placeholder입니다. 실제 앱은 API로 받아온 책 표지 이미지를 사용합니다. 표지 이미지가 없을 때만 chromatic 톤 중 하나를 fallback으로 보여줍니다.
