## 📚 TL;DR

`quote-sharing` 프로젝트의 자산(html2canvas 기반 인용구 캡처 패턴)을 본 `bookshelf` 프로젝트로 흡수하고, **ISBN 기반 개인 전자 책꽂이**의 *기반*을 다지는 PR. 이 PR은 **설계 · 디자인 시스템 · 툴체인 · mockup**까지를 land하고, 실제 데이터/Auth/UI 컴포넌트 구현(Tasks 6–24)은 후속 PR로 나눠 진행합니다.

---

## 🏗 무엇이 들어갔나 (커밋 흐름)

| Phase | 산출물 |
|---|---|
| **1. Discovery** | 두 프로젝트(`bookshelf` + `quote-sharing`) 전수 분석 → `.feature-dev/01-discovery.md` |
| **2. Brainstorming** | 8가지 핵심 의사결정 → [`docs/superpowers/specs/2026-05-12-bookshelf-design.md`](docs/superpowers/specs/2026-05-12-bookshelf-design.md) |
| **3. Planning** | 24 태스크 분해 (TDD 포함) → [`docs/superpowers/plans/2026-05-12-bookshelf-merge.md`](docs/superpowers/plans/2026-05-12-bookshelf-merge.md) |
| **4. Implementation (Tasks 1–5)** | 툴체인 + 토큰 + 폰트 + Pencil/SVG mockup |
| **4-bis. Design swap** | Pinterest → Webflow 디자인 시스템 교체 |
| **4-tris. Library shelf depth** | 라이트 모드 진열대 입체감 적용 |

---

## ⚙️ 핵심 아키텍처 결정 (잊기 쉽지만 중요)

### 모바일 배포 전략 → **PWA + Capacitor wrap**
- Next.js 웹앱 그대로 유지, Capacitor로 iOS/Android wrap (후속 PR)
- React Native 전면 재작성 안 함 — 단일 코드베이스 유지
- 본 PR엔 manifest/service-worker 준비만 (Task 20)

### 인증 + 데이터 → **Supabase (Auth + Postgres)**
- 게스트는 **IndexedDB** 로컬 저장 (`idb-keyval`)
- 로그인 시 단일 함수 `migrateLocalToCloud()`로 자동 이전 (idempotent)
- UI는 `LibraryStorage` 인터페이스에만 의존 — IndexedDB ↔ Supabase 다형성 교체

### 책 메타데이터 소스 → **기존 한국 도서 API 우선**
- 기존 `utils/api.ts`의 `fetchBooks` 유지 + `fetchBookByIsbn` 추가 예정 (Task 11)
- 표지/저자/출판사가 빠지면 알라딘·카카오 보조 API는 별도 태스크로 분리 (스코프 밖)

### 인용구 캡처 → **포함**
- `quote-sharing`의 `html2canvas` 패턴을 책 상세의 "구절 → PNG 카드"로 흡수 (Task 19)

### 모바일 그리드 → **모든 BP에서 3-up 고정**
- 사용자 요구: "서점 베스트셀러 코너" 느낌
- 표지 비율 2:3, 8px 거터

---

## 🎨 디자인 시스템 (Webflow-derived)

### 출처
[`DESIGN.md`](DESIGN.md)는 `npx getdesign@latest add webflow`로 받아온 Webflow-derived 시스템.

### 핵심 토큰 (코드 기준 [`tailwind.config.ts`](tailwind.config.ts))
- **Primary**: `#080808` (near-black) — 모든 primary CTA. **빨강/색상 CTA 금지**
- **Chromatic accents** (5-stop): `#7a3dff` purple · `#ed52cb` pink · `#3b89ff` blue · `#ff6b00` orange · `#00d722` green — *category-card fill 전용, 버튼 배경 금지*
- **Radii**: `xs 2px · sm 4px (버튼) · md 8px (카드) · full 9999px (아이콘 원형)`. Pill CTA 금지.
- **폰트**: Inter (WF Visual Sans Variable 대체). 가중치 400/500/600만 — **700+ 금지**
- **Shadows**: `shadow-layered`, `shadow-layered-strong`, `shadow-modal`, `shadow-book`, `shadow-shelf`

### 디자인 시스템 swap 기록 (잊기 쉬움)
초기엔 **Pinterest-derived** (Pinterest Red `#e60023`, 16/32/full radius) 으로 시작 → 사용자 요청으로 Webflow로 전체 교체. 모든 SVG mockup, tailwind config, globals.css, design spec §3 컴포넌트 매핑 모두 그에 맞춰 재작성됨. Git history `feat(design): swap design system from Pinterest to Webflow` 커밋 참고.

### Library 페이지 한정 "Shelf plank" 디테일
사용자가 Apple Books 스타일 진열대 스샷을 reference로 줘서 입체감 추가:
- 배경은 **라이트 유지** (`canvas #ffffff`) — 다크 모드 시도했다가 되돌림
- 각 줄 아래 1px hairline + **강한 34px linear-gradient 그림자** (opacity `0.42 → 0`)
- 각 책 아래 radial elliptical contact shadow
- `shadow-book`은 3-stop multi-offset 강조 레시피
- 상세는 design spec §3.3

---

## 🧰 환경/툴체인 주의사항

| 항목 | 결정 | 이유 |
|---|---|---|
| Vitest | **2.1.9** (4 아님) | Node 20.11이 `node:util`의 `styleText` 미지원 |
| jsdom | **25.x** (29 아님) | Vitest 2 + Node 20.11 ESM 호환 이슈 |
| 신규 npm scripts | `test`, `test:watch`, `typecheck` | TDD 진행에 필요 |
| 폰트 | Inter (`next/font/google`) | Geist 제거 |
| 환경변수 | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_KEY` (기존) · `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Task 21 예정) | `.env.local.example` 신설 예정 |

---

## 🖼 Mockup (Pencil → SVG 피벗)

Pencil MCP의 `batch_design`/`set_variables` 작업이 디스크의 `.pen` 파일에 **persist되지 않아** PNG export가 전부 빈 이미지로 나옴 (259바이트 stub 상태로 유지됨). 환경 한계 확인 후 손코딩 SVG로 우회.

[`docs/design/`](docs/design/) 5개 SVG:
- [`00-design-tokens.svg`](docs/design/00-design-tokens.svg) — Webflow 토큰 참조 시트
- [`01-library.svg`](docs/design/01-library.svg) — 내 서재 (라이트 진열대, 강한 그림자)
- [`02-add-book-sheet.svg`](docs/design/02-add-book-sheet.svg) — 책 추가 모달
- [`03-book-detail.svg`](docs/design/03-book-detail.svg) — 책 상세 + 구절 카드
- [`04-auth-modal.svg`](docs/design/04-auth-modal.svg) — 로그인 모달

[`lib/pencil/bookshelf.pen`](lib/pencil/bookshelf.pen) — Pencil 앱에서 직접 편집할 출발점 (스텁).

> 실제 구현이 끝나면 SVG mockup은 Playwright로 찍은 컴포넌트 실 스크린샷으로 교체 권장.

---

## 🚧 본 PR이 *하지 않은* 일 (Tasks 6–24)

| Task | 영역 |
|---|---|
| 6 | 도메인 타입 `lib/db/types.ts` (Book / Quote / LibraryEntry) |
| 7 | `LibraryStorage` 인터페이스 |
| 8 | IndexedDB 구현 (`idb-keyval`, TDD 6 케이스) |
| 9 | Supabase 구현 (mock client TDD) |
| 10 | Storage 팩토리 + 마이그레이션 |
| 11 | `fetchBookByIsbn` + 매핑 (TDD) |
| 12–15 | UI primitives (Button/IconButton/Input/SearchBar/Modal) + BookCard/Grid + AddBookSheet |
| 16 | Auth Provider/Modal/ProfileChip + Supabase 클라이언트 |
| 17 | LibraryView 합성 + 마이그 트리거 |
| 18 | 책 상세 페이지 + 구절 추가 |
| 19 | `QuoteCardCapture` (html2canvas, TDD) |
| 20 | PWA manifest + `@serwist/next` service worker |
| 21 | `.env.local.example` + cleanup |
| 22 | Supabase SQL 마이그레이션 (RLS 포함) |
| 23 | README 재작성 + 디자인 mockup 임베드 |
| 24 | 최종 검증 (test/lint/typecheck/build) |

세부 코드와 검증 명령은 [`docs/superpowers/plans/2026-05-12-bookshelf-merge.md`](docs/superpowers/plans/2026-05-12-bookshelf-merge.md) 참고.

---

## 📁 미래의 자기 자신을 위한 파일 안내

| 경로 | 무엇 |
|---|---|
| [`DESIGN.md`](DESIGN.md) | Webflow-derived 디자인 시스템 (`getdesign add webflow` 출처) |
| [`docs/superpowers/specs/2026-05-12-bookshelf-design.md`](docs/superpowers/specs/2026-05-12-bookshelf-design.md) | **설계 문서 (단일 source of truth)** |
| [`docs/superpowers/plans/2026-05-12-bookshelf-merge.md`](docs/superpowers/plans/2026-05-12-bookshelf-merge.md) | 24 태스크 구현 plan (TDD 포함) |
| [`docs/design/`](docs/design/) | 5개 SVG mockup + 토큰 참조 |
| `.feature-dev/` | Phase별 작업 로그 (`01-discovery`, `02-design`, `03-plan`, `04-implementation-log`, `state.json`) |
| `lib/pencil/bookshelf.pen` | Pencil 출발점 (스텁) |

---

## ⚠️ 알아두면 좋은 caveat

1. **데이터 모델 부재**: 책/구절을 저장할 인터페이스/구현이 아직 없음. UI는 아직 어디에도 wired되지 않았음.
2. **API 응답 필드 확정 안 됨**: 표지 URL/저자/출판사 필드명은 Task 11에서 실제 API 호출로 검증 필요 (mock에는 가정한 필드명 사용 중).
3. **현재 검색 UI는 dead code**: `app/page.tsx`는 여전히 옛 검색 폼. Task 17에서 LibraryView로 교체 예정.
4. **테스트 1개만 존재** (`tests/sanity.test.ts`). 본격 TDD는 Task 6부터.
5. **`app/dashboard/page.tsx`** 스텁은 Task 17에서 제거 예정.
6. **DESIGN.md의 chromatic 5색**은 *category-card fill 전용*. Primary CTA에 사용하지 말 것.
7. **Library 페이지만** shelf-depth 효과 사용. 다른 페이지는 light Webflow base.

---

## ✅ 검증

이 PR 시점:
- `npm test` → 1 passed (sanity)
- `npm run lint` → 미실행 (UI 코드 추가 전)
- `npm run typecheck` → 미실행 (현재 컴파일 대상 변경 없음)
- `npm run build` → 미실행 (다음 PR에서 검증)

Tasks 6–24 마지막에 빌드 게이트 통과 후 production-ready 판정.

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
