# Phase 1: Discovery

날짜: 2026-05-12

## 1. 두 프로젝트의 현재 상태 한눈에 보기

### A. `bookshelf` (현재 프로젝트, "The Ones I Read")
- **Next.js 15.5.18** + React 19.2 + TypeScript 5 + **Tailwind v3.4**
- **App Router**: `app/page.tsx` (검색), `app/dashboard/page.tsx` (스텁)
- **유일한 구현**: `utils/api.ts` — Korean library/book search API 클라이언트 (axios, env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_KEY`)
  - 파라미터: `srchTarget` (title/author/publisher/cheonggu), `kwd`, `systemType=오프라인자료`, `apiType=json`, `category=도서`
  - **응답 형태**: `data.result: Array<{ titleInfo, isbn }>` — ISBN 필드가 이미 있음
- **검색 UI**: 키 입력마다 fetch (debounce 없음), 결과 단순 리스트
- **앱 이름**: layout metadata에 `"The Ones I Read"`
- **폰트**: Geist VF (`app/fonts/`에 .woff 파일)
- **globals.css**: 라이트/다크 mode CSS 변수, 폰트는 Arial 폴백 (Geist 미적용)
- **테스트 인프라**: 없음
- **public**: Next.js 기본 SVG만

### B. `quote-sharing` (참고할 프로젝트)
- **Next.js 15.3.2** + React 19 + **Tailwind v4**
- **단일 페이지** `app/page.tsx` (client component)
- **유일한 기능**: 
  1. 화면에 정적인 한국어 문장(인용구) 표시
  2. `window.getSelection()`으로 마우스로 드래그한 텍스트 캡처
  3. **`html2canvas`로 인용구 박스를 PNG로 다운로드** (파일명 `quote.png`)
- **데이터/DB/auth/API 없음** — html2canvas 라이브러리가 핵심 자산

## 2. 합치기 매핑

| 사용자 요구사항 | 어디서 가져오나 |
|---|---|
| ISBN 검색 → 책 등록 | bookshelf의 `utils/api.ts` (이미 ISBN 반환) |
| 책 정보 (jacket/저자/출판사) | API 응답을 확장해야 함. 현재는 `titleInfo`, `isbn`만 — API 추가 필드 활용 필요 |
| 인용구/문장 캡처 → 공유 | quote-sharing의 `html2canvas` 패턴 → "이 책의 좋은 문장" 카드로 재사용 |
| 내 서재 (3-up 그리드) | 신규. DESIGN.md의 `pin-card` + `category-tile` 어휘 활용 |
| 좌상단 + 버튼 | DESIGN.md의 `button-icon-circular` (size 40, `rounded.full`) |
| 로그인/비로그인 | 신규. Phase 2에서 NextAuth vs Supabase vs 로컬 결정 |

## 3. DESIGN.md (Pinterest 시스템) 요약

- **컬러**: 단일 saturated red `#e60023` (오직 primary CTA만), 따뜻한 크림 뉴트럴 (`#f6f6f3`, `#fbfbf9`), 워치 그레이/잉크 텍스트
- **타이포**: Pin Sans (오픈 대체: **Inter** w400/500/600/700, display는 -1.2px tracking)
- **라디우스 어휘 (3가지뿐)**: `rounded.md` 16px (대부분) / `rounded.lg` 32px (큰 카드·모달) / `rounded.full` 9999px (검색바, chip, 아바타, 아이콘 버튼)
- **마손리**: 핀 그리드 column-based, 8px 거터 (이미지가 사실상 맞닿음), 자연 비율 보존
- **공간**: 8 단위, 섹션 64px 간격
- **버튼**: `button-primary` = Pinterest Red + on-primary white + button-md type + 16px radius + 40px height
- **그림자**: 카드는 **flat** (그림자 0). 모달만 16px 앰비언트 + 50% 다크 스크림
- **반응형**: 모바일 480px에서 1-up, 768px 2-up, 1024px 3-up... — 사용자가 원하는 "한 줄에 3개" 그리드는 데스크탑 small (1024+)에 해당 → 모바일에서는 2-up 또는 1-up이 자연스러움. 다만 사용자가 "마치 서점 베스트셀러 코너" 인상을 원했으므로 **모바일에서도 3-up** 고집할지는 디자인 결정으로 가져가야 함.

## 4. 핵심 의사결정 후보 (Phase 2에서 다룰 항목)

1. **모바일 배포 방식**
   - (a) Next.js 웹앱 + Capacitor/Cordova 같은 네이티브 wrap
   - (b) React Native (Expo) 전면 재작성
   - (c) PWA만 (네이티브 wrap 없음)
2. **인증**
   - (a) NextAuth.js (Google OAuth) + 게스트 모드
   - (b) Supabase Auth (DB까지 같이 해결)
   - (c) Firebase Auth
   - (d) 자체 (이메일/패스워드 + 쿠키)
3. **데이터 영속화**
   - (a) Supabase Postgres (인증과 패키지)
   - (b) Firebase Firestore
   - (c) 처음엔 IndexedDB(로컬 only), 클라우드 추후 (게스트=로컬, 로그인=클라우드)
4. **ISBN 책 메타데이터 소스**
   - 현재 API가 ISBN만 반환 — 표지·저자·출판사를 얻으려면:
     - (a) **카카오 책 검색 API** (한국어, 표지 URL 풍부)
     - (b) **알라딘 OpenAPI** (TTBKey)
     - (c) **국립중앙도서관 LOD/OpenAPI** (현재 사용 중일 가능성)
     - (d) Google Books API (한국 책 커버리지 약함)
5. **인용구 캡처 기능** 포함 여부
   - quote-sharing의 핵심 자산이므로, "책 상세 페이지에서 한 줄 발췌 → PNG 카드 공유" 로 자연스럽게 흡수 가능
6. **Tailwind 버전**
   - 현 bookshelf: v3.4 / quote-sharing: v4 — 하나로 결정. v3 유지가 안전
7. **테스트 프레임워크**
   - 현재 없음. **Vitest + Testing Library** 추가 필요 (TDD 위해)
8. **DESIGN.md 토큰을 Tailwind에 어떻게 주입?**
   - `tailwind.config.ts`의 `theme.extend.colors`에 DESIGN.md 컬러 토큰을 직접 등록
   - `globals.css`에 CSS custom property로도 노출 (Pencil 컴포넌트와 호환)

## 5. 기존 코드 자산 (재활용 가능 / 폐기)

| 자산 | 결정 |
|---|---|
| `utils/api.ts` (도서 검색 axios 클라이언트) | **재활용** — ISBN 기반 단건 조회 함수 `fetchBookByIsbn()` 추가 필요 |
| `app/page.tsx` 검색 UI | **폐기**. 홈은 "내 서재" 그리드로 교체. 검색은 "+추가" 모달 내부 컴포넌트로 이동 |
| `app/dashboard/page.tsx` | **폐기 or 재용도** — 예: `/library/[bookId]` 책 상세로 대체 |
| `app/layout.tsx` | 폰트 교체 (Geist → Inter), DESIGN.md 토큰 주입 |
| `app/globals.css` | DESIGN.md 컬러/스페이싱 CSS 변수로 재작성 |
| quote-sharing 정적 텍스트 | 폐기 — UI 패턴만 가져옴 |
| quote-sharing `html2canvas` 사용 패턴 | **재활용** — 책 상세 페이지의 "구절 카드" 생성에 |

## 6. Pencil 활용 계획 (요청사항)

- `pencil` MCP를 이용해 페이지 디자인을 **처음부터** 새로 그림.
- 그릴 페이지:
  1. **내 서재 (홈)** — 3-up 책 그리드, 상단 좌측 + 버튼, 우측 프로필/로그인
  2. **책 추가 모달/시트** — ISBN 입력, 검색 결과 책 카드 1개 + "내 서재에 담기" 버튼
  3. **책 상세** — 표지 hero (`pin-card-large`, 32px radius), 메타, 발췌 구절 카드 리스트, "구절 추가" 버튼
  4. **로그인 모달** — DESIGN.md의 `modal-card` 그대로 (Welcome to ... 헤더, 이메일/패스워드 인풋, primary CTA "계속", 게스트 진입 링크)
- 데이터 소스: **DESIGN.md 토큰 직접 사용** (페이즈 4 시작 시 `set_variables`로 Pencil에 주입)

## 7. 리스크 & 미해결

- **API 응답 형태 불확실**: 현재 `data.result[].titleInfo` 외에 표지/저자가 같이 오는지 확인 안 됨. 환경변수에 실제 키가 있는지(.env.local) 미확인. Phase 2 질문으로 확인 필요.
- **DB 없음**: "내 서재" 영속화 수단을 정해야 첫 태스크가 가능
- **모바일 UX vs 디자인 시스템 컬럼 수**: 사용자가 "한 줄 3개"를 명시 → 디자인 시스템 기본(모바일 2-up)과 충돌 — 사용자 의도 우선

---

**다음 단계:** Phase 2 Brainstorming — 8가지 핵심 의사결정을 사용자와 합의하고 설계 문서로 굳힘.
