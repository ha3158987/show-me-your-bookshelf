# Design references

이 폴더는 본 프로젝트의 디자인 mockup과 토큰 참조를 담습니다.

## 파일

| 파일 | 내용 |
|---|---|
| [`00-design-tokens.svg`](./00-design-tokens.svg) | DESIGN.md의 컬러 팔레트·라디우스 스케일·버튼 스타일·타이포그래피 참조 |
| [`01-library.svg`](./01-library.svg) | 내 서재 (홈) — 3-up 그리드, 좌상단 + 버튼, 우상단 로그인 |
| [`02-add-book-sheet.svg`](./02-add-book-sheet.svg) | 책 추가 모달 — ISBN/제목 검색 바 + 결과 카드 |
| [`03-book-detail.svg`](./03-book-detail.svg) | 책 상세 — 표지 hero, 구절 추가 CTA, 구절 카드 리스트 |
| [`04-auth-modal.svg`](./04-auth-modal.svg) | 로그인 모달 — 이메일/패스워드 + Google OAuth + 게스트 진입 |

## Pencil 소스

[`lib/pencil/bookshelf.pen`](../../lib/pencil/bookshelf.pen)에 Pencil 디자인 파일이 보관되어 있습니다. Pencil 앱에서 열어 편집할 수 있습니다.

> **참고:** 본 SVG mockup들은 Pencil MCP 환경에서 PNG 익스포트가 동작하지 않는 임시 한계 때문에 손으로 작성한 정적 references입니다. Phase 4 구현이 완료된 뒤 실제 컴포넌트의 Playwright 스크린샷으로 교체될 수 있습니다.

## 일러두기

모든 mockup은 다음 토큰을 직접 사용합니다 (DESIGN.md ↔ `tailwind.config.ts`):

- 컬러: `primary #e60023`, `canvas #ffffff`, `surface-card #f6f6f3`, `ink #000000`, `body #33332e`, `mute #62625b`, `ash #91918c`
- 라디우스: `md 16px` (대부분), `lg 32px` (큰 카드·모달), `full 9999px` (검색바·아이콘 버튼·아바타)
- 폰트: Inter (Pin Sans 대체)
- 그리드: 3-up 고정, gap 8px

표지 색감은 mockup 시각 식별을 위한 placeholder입니다. 실제 앱은 API로 받아온 책 표지 이미지를 사용합니다.
