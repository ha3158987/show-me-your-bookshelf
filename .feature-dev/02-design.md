# The Ones I Read — Electronic Bookshelf Design

- **Date:** 2026-05-12
- **Status:** Approved (Phase 2 of /feature pipeline)
- **Author:** hyuna-park (with Claude)
- **Sources merged:** `bookshelf` (current Next.js project) + `quote-sharing` (sibling project)

---

## 0. 한 줄 요약

ISBN으로 책을 등록해 만드는 **개인 전자 책꽂이**. 홈은 한 줄에 책 3권씩 진열된 *"베스트셀러 코너"* 그리드. 책 상세에서는 좋아하는 구절을 PNG 카드로 캡처해 공유. 게스트는 IndexedDB로 로컬 저장, 로그인하면 Supabase로 자동 마이그레이션. 모바일 PWA 우선, Capacitor 네이티브 wrap은 후속.

## 1. 시스템 아키텍처 개요

```
┌────────────────────────────────────────────────────────────┐
│ Next.js 15 App Router + React 19 + Tailwind v3.4 (PWA)     │
│                                                            │
│  Routes                                                    │
│   /              내 서재 그리드 (3-up), +버튼, 프로필     │
│   /book/[id]     책 상세 (표지 hero, 구절 리스트)         │
│   /auth/callback Supabase OAuth callback                   │
│                                                            │
│  Data layer (lib/db/)                                      │
│   types.ts                                                 │
│   storage.ts          ─ LibraryStorage 인터페이스         │
│   localStorage.ts     ─ IndexedDB 구현 (게스트)            │
│   supabaseStorage.ts  ─ Supabase 구현 (로그인)             │
│   migrate.ts          ─ 로컬 → 클라우드 이전              │
│                                                            │
│  Auth (lib/auth/supabase.ts)  createBrowserClient          │
│  External API (utils/api.ts) — ISBN 단건 조회 함수 추가   │
│                                                            │
│  UI (components/)                                          │
│   BookCard / BookGrid / AddBookFab / AddBookSheet          │
│   BookDetailHero / QuoteList / QuoteCardCapture            │
│   AuthModal / ProfileChip                                  │
│   shared: Button / Input / Modal / IconButton              │
└────────────────────────────────────────────────────────────┘
       │                              │
       ▼                              ▼
   IndexedDB                       Supabase
   (게스트)                        - auth.users
                                   - books
                                   - quotes
                                   - library_entries
       └──── 로그인 시 migrateLocalToCloud() ────┘
```

**5가지 핵심 원칙**

1. `LibraryStorage` 인터페이스 한 장으로 IndexedDB ↔ Supabase 구현 다형 교체 — UI는 어느 쪽인지 모름.
2. 로컬 → 클라우드 마이그레이션은 단일 함수 `migrateLocalToCloud()`로 집중.
3. PWA 우선. Capacitor wrap은 manifest/service-worker만 본 PR에 준비, 실제 wrap은 후속 PR.
4. DESIGN.md 토큰을 `tailwind.config.ts`에 직접 주입 + `globals.css`에 CSS custom property로도 노출.
5. Pencil로 그린 디자인 → 그대로 Tailwind 컴포넌트로 옮김 (토큰이 1:1 대응).

## 2. 데이터 모델 & API

### 2.1 도메인 타입

```ts
// lib/db/types.ts
export interface Book {
  isbn: string;             // primary id
  title: string;
  author?: string;
  publisher?: string;
  coverUrl?: string;        // 표지 이미지 URL
  description?: string;
  rawFromApi?: unknown;     // 디버깅용, 원응답 보존
}

export interface Quote {
  id: string;               // uuid
  bookIsbn: string;
  text: string;
  page?: number;
  createdAt: string;        // ISO
}

export interface LibraryEntry {
  bookIsbn: string;
  addedAt: string;          // ISO
  position: number;         // 내 서재 내부 정렬 (드래그&드롭 향후)
}
```

### 2.2 Storage 인터페이스

```ts
// lib/db/storage.ts
export interface LibraryStorage {
  // 서재
  listLibrary(): Promise<LibraryEntry[]>;
  addToLibrary(book: Book): Promise<LibraryEntry>;
  removeFromLibrary(isbn: string): Promise<void>;

  // 책
  getBook(isbn: string): Promise<Book | null>;
  upsertBook(book: Book): Promise<void>;

  // 구절
  listQuotes(isbn: string): Promise<Quote[]>;
  addQuote(input: Omit<Quote, "id" | "createdAt">): Promise<Quote>;
  deleteQuote(id: string): Promise<void>;
}
```

두 구현 모두 같은 인터페이스. `lib/db/index.ts`가 사용자의 인증 상태를 보고 적절한 구현을 반환:

```ts
export function getStorage(session: Session | null): LibraryStorage {
  return session ? supabaseStorage(session) : localStorage();
}
```

### 2.3 외부 ISBN API

기존 `utils/api.ts`의 `fetchBooks(searchTarget, keyword)` 유지 + 새 함수 추가:

```ts
// utils/api.ts (확장)
export const searchBooks = fetchBooks;  // alias (기존 명 유지)

export async function fetchBookByIsbn(isbn: string): Promise<Book | null> {
  const { data } = await api.get("?systemType=오프라인자료", {
    params: { srchTarget: "isbn", kwd: isbn, apiType: "json", category: "도서" },
  });
  const raw = data?.result?.[0];
  if (!raw) return null;
  return mapApiBook(raw);
}

function mapApiBook(raw: any): Book { /* titleInfo, authorInfo, pubInfo, ... 매핑 */ }
```

> **검증 태스크**: Phase 4 첫 작업으로 실제 API 응답 한 건 호출해 표지 URL/저자/출판사 필드명을 확정. 누락 필드가 있으면 알라딘 OpenAPI를 보조 호출하는 어댑터를 추가하는 별도 태스크로 분리.

### 2.4 Supabase 스키마

```sql
-- supabase/migrations/0001_init.sql
create table public.books (
  isbn text primary key,
  title text not null,
  author text,
  publisher text,
  cover_url text,
  description text,
  created_at timestamptz default now()
);

create table public.library_entries (
  user_id uuid references auth.users not null,
  book_isbn text references public.books not null,
  added_at timestamptz default now(),
  position int not null default 0,
  primary key (user_id, book_isbn)
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  book_isbn text references public.books not null,
  text text not null,
  page int,
  created_at timestamptz default now()
);

-- RLS
alter table public.library_entries enable row level security;
alter table public.quotes enable row level security;
create policy "own entries" on public.library_entries
  for all using (auth.uid() = user_id);
create policy "own quotes" on public.quotes
  for all using (auth.uid() = user_id);
-- books는 공개 (ISBN으로 누구나 조회). 쓰기는 service role 또는 인증된 유저로 제한.
alter table public.books enable row level security;
create policy "read books" on public.books for select using (true);
create policy "auth insert books" on public.books for insert
  with check (auth.role() = 'authenticated');
```

## 3. 컴포넌트 트리 & UI 인벤토리

```
app/
  layout.tsx              ─ Inter 폰트 주입, AuthProvider 래핑
  page.tsx                ─ LibraryPage (서버) → <LibraryView/> (클라)
  book/[isbn]/page.tsx    ─ BookDetailPage
  auth/callback/route.ts  ─ Supabase OAuth 콜백 핸들러
  globals.css             ─ DESIGN.md 토큰 CSS 변수

components/
  library/
    LibraryView.tsx       ─ 로그인 상태 분기, AddBookFab/AuthModal 트리거
    BookGrid.tsx          ─ 3-up CSS grid (모든 BP에서 3-up)
    BookCard.tsx          ─ pin-card (16px radius), 표지+제목+저자
    EmptyState.tsx        ─ 빈 서재 일러스트
  add-book/
    AddBookFab.tsx        ─ 좌상단 button-icon-circular (40px, +)
    AddBookSheet.tsx      ─ 모달/시트, 검색바 + 결과 카드
    SearchResultCard.tsx  ─ 한 책 카드, "내 서재에 담기" CTA
  book-detail/
    BookDetailHero.tsx    ─ pin-card-large (32px radius)
    QuoteList.tsx
    QuoteAddSheet.tsx     ─ 구절 입력
    QuoteCardCapture.tsx  ─ html2canvas로 PNG 다운로드 (quote-sharing 패턴)
  auth/
    AuthModal.tsx         ─ modal-card (32px radius), 이메일/구글 OAuth
    ProfileChip.tsx       ─ 우상단 아바타/로그인 버튼
    AuthProvider.tsx      ─ Supabase 세션 컨텍스트
  ui/
    Button.tsx            ─ variants: primary | secondary | tertiary
    IconButton.tsx        ─ button-icon-circular
    Input.tsx             ─ text-input + focus 더블 링
    SearchBar.tsx         ─ rounded-full, magnifier 아이콘
    Modal.tsx             ─ portal + 50% 스크림 + 16px 앰비언트

lib/
  db/  storage.ts, types.ts, localStorage.ts, supabaseStorage.ts, migrate.ts, index.ts
  auth/  supabase.ts (browser client), middleware.ts (서버 세션)

utils/
  api.ts                  ─ fetchBookByIsbn 추가

public/
  manifest.webmanifest
  icons/  192, 512, maskable
  sw.js  (or via next-pwa)
```

### 3.1 핵심 화면 ↔ DESIGN.md 컴포넌트 매핑

| 화면 요소 | DESIGN.md 컴포넌트 |
|---|---|
| 좌상단 + 버튼 | `button-icon-circular` (40px, surface-card 배경) |
| 서재 책 카드 | `pin-card` (16px radius, padding 0, 표지 풀블리드) |
| 책 상세 표지 | `pin-card-large` (32px radius) |
| 검색 바 | `search-bar` (rounded-full, surface-card 배경, focused 시 canvas + ash 보더) |
| 책 등록/로그인 시트 | `modal-card` (32px radius, padding 32, 50% scrim) |
| "내 서재에 담기" 버튼 | `button-primary` (Pinterest Red `#e60023`, 16px radius) |
| "취소"/"닫기" | `button-secondary` (surface-bg `#e5e5e0`) |
| 텍스트 입력 | `text-input` (44px height, focus 더블 링 `focus-outer` + `focus-inner`) |
| "Welcome to ..." 헤더 | `typography.heading-lg` (22px, w600) |

### 3.2 모바일 그리드 결정

사용자 요구로 **모든 BP에서 3-up 고정**. CSS:
```css
.book-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;        /* DESIGN.md spacing.sm — 베스트셀러 코너 느낌 */
  padding-inline: 12px;
}
```
표지 비율 = 2:3 (책 자연 비율). 모바일 360px 폭 기준 카드 폭 ≈ 108px → 표지 ≈ 108×162. 터치 타깃은 카드 전체(48px+) 충족.

## 4. Pencil 디자인 작업 계획

Phase 4 첫 단계로 Pencil 문서를 생성합니다.

1. `bookshelf.pen` 문서 신규. **변수(Variables)에 DESIGN.md 토큰 전량 주입** (`set_variables`).
2. 그릴 페이지 4개:
   - **Library / Home (모바일 + 데스크탑)** — 3-up 그리드, 빈 상태, 채워진 상태
   - **Add Book Sheet** — 검색 바 + 결과 1~3개 카드
   - **Book Detail** — 표지 hero + 메타 + 구절 카드 3개 + "구절 추가" CTA
   - **Auth Modal** — Welcome + 이메일/패스워드 + "Google로 계속" + "게스트로 보기" 링크
3. 각 페이지를 PNG로 export → `docs/design/` 에 보관 → README와 design doc에 미리보기 삽입.
4. 구현 단계에서 Pencil 화면을 참조해 Tailwind 컴포넌트 작성. 어긋난 부분은 즉시 Pencil도 함께 수정.

## 5. 테스트 & 검증 전략

### 5.1 도입 도구
- **Vitest** + **@testing-library/react** + **jsdom** — 단위/컴포넌트 테스트
- **@testing-library/user-event** — 사용자 인터랙션
- **Playwright** (선택, 후속 PR) — E2E

### 5.2 TDD 적용 범위 (RED 우선)
- `lib/db/localStorage.ts` — CRUD 라운드트립 테스트
- `lib/db/migrate.ts` — 로컬 → 클라우드 마이그레이션 (mocked client)
- `utils/api.ts` — `fetchBookByIsbn` (axios mock으로 응답 매핑 검증)
- `components/library/BookGrid.tsx` — 3-up 레이아웃, 빈 상태
- `components/add-book/AddBookSheet.tsx` — 검색 입력 디바운스, 결과 선택 → onAdd 콜백
- `components/book-detail/QuoteCardCapture.tsx` — html2canvas mock, 다운로드 트리거
- `components/auth/AuthModal.tsx` — submit 호출/검증 메시지

순수 시각 UI (BookCard 표지 placeholder 등)은 시각 검증으로.

### 5.3 검증 게이트 (Phase 6)
- `npm test` (Vitest) — 전부 green
- `npm run build` — Next 빌드 통과
- `npm run lint` — 에러 0
- `npm run typecheck` (tsc --noEmit 별도 스크립트 추가) — 0
- 접근성 (Phase 7): jest-axe 또는 axe-core CLI로 핵심 페이지 0 violations

## 6. README 통합

본 설계를 프로젝트 README에도 요약 섹션으로 통합합니다 (사용자 요청사항).

- 추가할 섹션:
  - "The Ones I Read" 한 줄 소개 + 스크린샷 (Pencil PNG)
  - 핵심 기능 4가지 (서재 그리드, ISBN 등록, 구절 캡처, 게스트→로그인 마이그레이션)
  - 기술 스택 (Next.js 15, React 19, Tailwind, Supabase, PWA/Capacitor 로드맵)
  - 디자인 시스템 출처 (DESIGN.md 링크)
  - 개발 시작 방법 (env 예시 포함)
- 작성은 **Phase 9 직전**(모든 결과물이 확정된 뒤). 그래야 스크린샷·실행 명령이 실제로 동작.

## 7. 환경변수 & 비밀

`.env.local.example` 신규:
```
# 외부 도서 검색 API
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
실제 키는 `.env.local`에 사용자가 채움. `.gitignore`에 이미 포함되어 있음(확인 필요).

## 8. PWA & Capacitor 로드맵

본 PR 범위 (포함):
- `public/manifest.webmanifest` (이름, 아이콘, theme-color = Pinterest Red, display = standalone)
- 192/512 아이콘 (Pencil에서 export)
- `next-pwa` 또는 `@serwist/next`로 service worker 생성 (오프라인 셸 + 캐시)

본 PR 밖 (후속 PR):
- `npx cap init` → iOS/Android 프로젝트 생성
- 카메라(ISBN 바코드) Capacitor plugin
- 스토어 메타데이터

## 9. 비기능 요구사항

- **i18n**: 한국어 UI 기본. 영어 문자열 키 분리는 후속 (이번 PR은 ko-KR 하드코딩).
- **접근성**: 모든 인터랙티브 요소 44×44 터치 타깃 (DESIGN.md 명시), 시맨틱 HTML, 키보드 트랩 모달, `aria-live`로 토스트.
- **성능**: 표지 이미지 `next/image` lazy, IndexedDB 호출 최소화, 검색 입력 300ms 디바운스.
- **에러**: API 실패 시 토스트 + 캐시 fallback. 로그인 실패 시 모달 내부 인라인 에러.

## 10. 범위 명시 (이번 PR이 하지 않는 것)

- 책 검색에 카메라 바코드 스캔 (Capacitor 후속)
- 드래그&드롭으로 책 정렬 (`position` 필드만 미리 둠)
- 친구 공유/소셜 그래프
- 책 검색 외 추천 / 베스트셀러 피드
- 알라딘/카카오 보조 API 자동 fallback (필드 누락 발견 시 별도 태스크)

---

## 부록 A. 작업 순서 한눈에

1. 의존성/도구 (Vitest, Supabase JS, html2canvas, idb-keyval)
2. DESIGN.md 토큰을 Tailwind/CSS에 주입
3. Pencil 디자인 문서 작성 (4개 페이지)
4. 데이터 레이어 (types → storage 인터페이스 → IndexedDB 구현)
5. `fetchBookByIsbn` + API 응답 검증
6. UI primitives (Button, Input, Modal, IconButton, SearchBar)
7. Library 페이지 (BookGrid, BookCard, EmptyState)
8. Add Book 시트
9. Book Detail 페이지 + Quote 캡처
10. Auth (Supabase 클라이언트, AuthModal, ProfileChip)
11. 마이그레이션 함수 + 진입 통합
12. PWA manifest + service worker
13. README 업데이트 + 스크린샷 임베드
14. 접근성 감사 + 코드 리뷰
15. PR 생성

(상세 태스크는 Phase 3 plan에서 분해)
