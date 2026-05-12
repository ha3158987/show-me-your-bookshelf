## 🧱 TL;DR

PR #1(foundation) 위에 **데이터 레이어 + 외부 API 매핑**을 land. 책/구절 저장에 대한 추상화(`LibraryStorage`)와 두 구현(IndexedDB / Supabase), 게스트→클라우드 자동 마이그레이션, 그리고 ISBN 단건 조회까지. 32개 테스트, 모두 TDD(RED→GREEN). UI는 아직 wired 안 됨 — 다음 PR.

이 PR이 land되면 UI 컴포넌트(Task 12+)는 `import { getStorage } from "@/lib/db"`만 알면 끝.

---

## 📂 어떤 파일이 들어갔나

```
lib/
├── auth/
│   └── supabase.ts          ─ 싱글톤 브라우저 클라이언트
└── db/
    ├── types.ts             ─ Book / Quote / LibraryEntry
    ├── storage.ts           ─ LibraryStorage 인터페이스 (단일 계약)
    ├── localStorage.ts      ─ IndexedDB 구현 (idb-keyval)
    ├── supabaseStorage.ts   ─ Supabase 구현 (camelCase ↔ snake_case 매핑)
    ├── migrate.ts           ─ migrateLocalToCloud (idempotent)
    └── index.ts             ─ getStorage(session) 팩토리 (UI 진입점)
utils/
└── api.ts                   ─ fetchBookByIsbn + searchBooks + mapApiBook
tests/
├── lib/db/types.test.ts            (4 cases — type contract)
├── lib/db/localStorage.test.ts     (9 cases — IndexedDB roundtrip)
├── lib/db/supabaseStorage.test.ts  (7 cases — mocked Postgrest builder)
├── lib/db/migrate.test.ts          (4 cases — idempotency)
└── utils/api.test.ts               (7 cases — axios mocked)
```

---

## 🏗 핵심 설계 (잊기 쉬움 주의)

### `LibraryStorage`는 *유일한* 계약
[`lib/db/storage.ts`](lib/db/storage.ts) — 8 메서드. IndexedDB와 Supabase 구현이 동일 인터페이스 만족. **UI는 인터페이스만 의존**.

### `getStorage(session)` 팩토리 — 단일 진입점
[`lib/db/index.ts`](lib/db/index.ts). 컴포넌트는 다음 한 줄만 알면 됩니다:

```ts
import { getStorage } from "@/lib/db";
const storage = getStorage(session); // session=null → IndexedDB, 있으면 Supabase
const books = await storage.listLibrary();
```

### 마이그레이션은 idempotent + 로컬 데이터 *보존*
- `migrateLocalToCloud()`는 `(text, page)` fingerprint로 중복 quote 제거
- ISBN으로 cloud에 이미 있는 책은 skip
- **로컬 데이터는 절대 자동으로 안 지움** — "게스트 모드 그만하기"는 사용자가 명시적으로 트리거할 별도 액션
- 결과적으로 매 boot마다 안전하게 실행 가능

### `position`은 미리 깔아둠
- 모든 `LibraryEntry`에 0-base position
- 현재는 단순 append (entry 개수 = 새 position)
- 미래 drag-reorder 추가 시 스키마 변경 0

### 책 메타데이터 매핑은 *방어적*
[`utils/api.ts` `mapApiBook`](utils/api.ts) — 한국 도서 API의 응답 필드명이 미확정이라 fallback 체인 사용:
- `titleInfo ?? title`
- `authorInfo ?? author`
- `pubInfo ?? publisher`
- `imageUrl ?? coverUrl`
- 원본 응답은 `rawFromApi`에 통째로 보관 → 디버깅/향후 매핑 변경에 안전망

> ⚠️ **TODO**: UI 붙이는 단계(Task 17 이후)에서 실 API 한 번 호출해 canonical 필드명을 확정하고 매핑을 좁힐 것. 누락 시 알라딘/카카오 보조 API는 별도 태스크.

### Supabase 보안: RLS *+* 코드 필터 이중방어
- DB 레벨에서 RLS로 `auth.uid()` 스코프
- 추가로 `supabaseStorage.ts`에서도 `user_id` 필터 (`listLibrary` `listQuotes` `removeFromLibrary`)
- 이유: 로컬 dev에서 RLS 꺼도 격리 유지

### `Quote.id`는 클라이언트에서 생성 (uuid v4)
- IndexedDB·Supabase 양쪽 동일
- 마이그레이션 시 id 보존 가능 → 향후 동기화 로직 단순화

---

## 🧪 테스트 커버리지

**32/32 passed** · `tsc --noEmit` 0 errors

### 핵심 동작별 보장 매핑

| 동작 | 어느 테스트가 보장 |
|---|---|
| 게스트가 책 등록 → 다음 세션에도 유지 | `localStorage.test.ts` (9개 모두) |
| ISBN 중복 등록 시 position 그대로 (idempotent) | `localStorage` "is idempotent on duplicate addToLibrary" |
| 로그인 후 클라우드 마이그 + 두 번 돌려도 중복 X | `migrate.test.ts` "is idempotent" |
| 다른 유저 데이터 안 보임 | `supabaseStorage.test.ts` "listLibrary returns entries filtered by user" |
| `removeFromLibrary`는 (user, isbn) 두 조건 모두 일치 시만 삭제 | `supabaseStorage` "removeFromLibrary deletes only the current user's entry" |
| Snake_case 컬럼 → camelCase 도메인 매핑 | `supabaseStorage` "getBook maps snake_case columns" |
| API 응답 표지/저자 누락 대응 (graceful fallback) | `api.test.ts` "falls back gracefully when optional fields are missing" |
| API 5xx/네트워크 에러는 throw (UI가 토스트 가능) | `api.test.ts` "propagates axios errors" |

### 테스트 인프라 메모

- **Supabase mock**: chainable Postgrest builder를 in-memory 테이블로 구현. `.delete().eq().eq()`는 AND로 동작하도록 conditions 누적 → then() 시점에 일괄 적용 (단순 즉시 삭제 시 OR처럼 동작하는 버그 한 번 잡았음).
- **IndexedDB**: `fake-indexeddb/auto`가 setup에서 글로벌 패치. 테스트마다 `namespace: \`test-\${Math.random()}\``로 store 격리.
- **axios**: 모듈 mock + `mockGet` 공유 ref. 첫 import 시 `axios.create()` 결과 캡쳐됨.

---

## ❌ 본 PR이 *하지 않은* 것

| Task | 영역 | 다음 PR 후보? |
|---|---|---|
| 12–13 | UI primitives (Button, IconButton, Input, SearchBar, Modal) | A |
| 14 | BookCard / BookGrid / EmptyState | A |
| 15 | AddBookFab + AddBookSheet | A |
| 16 | AuthProvider / AuthModal / ProfileChip | B |
| 17 | LibraryView 합성 + `migrateLocalToCloud()` 트리거 | B |
| 18 | 책 상세 페이지 + 구절 추가 | B |
| 19 | QuoteCardCapture (html2canvas) | B |
| 20 | PWA manifest + service worker | C |
| 21 | `.env.local.example` + cleanup | C |
| 22 | Supabase SQL 마이그레이션 (RLS 포함) | C 또는 별도 |
| 23 | README 재작성 + 디자인 mockup 임베드 | C |
| 24 | 최종 검증 (test/lint/typecheck/build) | C |

세부는 [`docs/superpowers/plans/2026-05-12-bookshelf-merge.md`](docs/superpowers/plans/2026-05-12-bookshelf-merge.md).

---

## ⚠️ 알아두면 좋은 caveat

1. **Supabase SQL 마이그레이션은 아직 작성 안 됨** (Task 22). 실 Supabase 프로젝트에 books/library_entries/quotes 테이블 + RLS 정책을 만들기 전엔 cloud 모드가 실제 DB에 못 붙음. 단, 본 PR의 모든 동작은 mock 기준으로 검증 완료.
2. **`getStorage()`는 `getSupabaseBrowserClient()`를 호출**하므로 Supabase env 미설정 상태에선 session이 있을 때만 throw. session === null이면 IndexedDB만 써서 안전.
3. **`Quote` 인터페이스에 `userId` 필드 없음** — 도메인 타입은 의도적으로 user-agnostic. user 스코핑은 storage 구현 내부에서 처리.
4. **`migrate.ts`는 books를 cloud에 upsert하는 게 아니라 `addToLibrary()`로 추가** — 즉 cloud 측 `position`이 새로 매겨짐. 미래 정확한 ordering 보존이 필요해지면 `upsertBook()` + `library_entries` 직접 insert 패턴으로 변경 검토.
5. **API 응답 필드명은 미확정** — 표지 URL이 실제로 `imageUrl`인지 다른 이름인지 live API로 검증 필요 (Task 17 UI 붙이는 시점에).

---

## ✅ 검증

이 PR 시점:
- `npm test` → **32 passed**
- `npm run typecheck` → **0 errors**
- `npm run lint` → 미실행 (UI 코드 추가 전엔 큰 변화 없음)
- `npm run build` → 미실행 (Next.js 페이지 변경 없음)

빌드 게이트 통과 검증은 UI 통합되는 PR에서 진행.

---

## 📁 미래의 자기 자신을 위한 안내

| 이게 궁금하면 | 보세요 |
|---|---|
| 이 데이터 모델을 왜 이렇게 짰는지 | [`docs/superpowers/specs/2026-05-12-bookshelf-design.md`](docs/superpowers/specs/2026-05-12-bookshelf-design.md) §2 |
| 다음에 뭘 만들어야 하는지 | [`docs/superpowers/plans/2026-05-12-bookshelf-merge.md`](docs/superpowers/plans/2026-05-12-bookshelf-merge.md) Tasks 12–24 |
| 디자인 시스템 토큰 | [`DESIGN.md`](DESIGN.md) + [`tailwind.config.ts`](tailwind.config.ts) |
| Mockup | [`docs/design/`](docs/design/) |
| 합쳐진 두 프로젝트 출처/배경 | PR #1 본문 ([`.feature-dev/PR_BODY.md`](.feature-dev/PR_BODY.md)는 PR #1 시점 사본) |

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
