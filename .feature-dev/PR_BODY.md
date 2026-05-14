# PR #2 — 데이터 저장 & 책 조회 기능의 *내부 배관*

## 한 줄 요약

이 PR은 **눈에 보이는 변화가 없습니다.** 화면(뷰)이나 페이지를 건드리지 않고, 앱이 책 정보를 어디에 어떻게 저장할지 — 즉 **"파이프"** 만 깔았습니다. 다음 PR에서 UI가 이 파이프에 연결되면 그때 화면이 바뀝니다.

---

## 1. 이 PR이 *어떤 종류의 변화*인지

소프트웨어를 집에 비유하면 보통 이런 층이 있습니다:

```
화면 (UI · React 컴포넌트)            ← 사용자가 보는 것
   ↑
앱 로직 (페이지 / 라우팅 / 상태)
   ↑
데이터 레이어 (이 PR이 다루는 곳) ←─── 책/구절을 저장·조회하는 코드
   ↑
저장소 (IndexedDB · Supabase)         ← 실제 데이터가 사는 곳
```

이번 PR은 **"데이터 레이어"** 만 만들었습니다. 즉:

- 새 페이지 X
- 새 버튼/모달 X
- 디자인 변경 X
- *오직* 책·구절을 다루는 "함수 묶음"만 새로 작성

이걸 먼저 만든 이유: UI를 짜기 시작하면 "책 목록 가져오기"·"새 책 추가하기"·"구절 저장하기" 같은 호출이 곳곳에서 필요합니다. 매번 IndexedDB나 Supabase 코드를 직접 부르면 코드가 곳곳에 흩어집니다. **하나의 깔끔한 진입점(`getStorage()`)** 을 먼저 두면 UI 코드는 단순해집니다.

---

## 2. 용어 사전 (나중에 까먹기 쉬운 것들)

| 용어 | 본 프로젝트에서의 의미 |
|---|---|
| **로컬 (local)** | 사용자의 *브라우저 안*. 다른 기기에선 안 보임. 본 앱에선 게스트(비로그인) 사용자의 책장이 여기 저장됨. 구체적으로는 IndexedDB. |
| **클라우드 (cloud)** | 우리 서버(Supabase Postgres). 로그인하면 어느 기기에서 들어와도 같은 책장이 보임. |
| **IndexedDB** | 브라우저 내장 DB. 쿠키보다 훨씬 큰 양을 저장 가능. 새로고침해도 살아있고, 시크릿창 닫으면 사라짐. 본 앱은 `idb-keyval` 라이브러리로 단순화해서 씀. |
| **Supabase** | "백엔드를 대신 해주는" 서비스. Postgres DB + 인증 + 스토리지를 한 번에 제공. Firebase의 SQL 버전 정도로 생각하면 됨. |
| **RLS (Row Level Security)** | "이 행은 누가 볼 수 있나"를 DB 레벨에서 강제하는 기능. 각 책장 행에 `user_id`가 박혀 있고, Postgres가 알아서 "내 행만" 보여줌. 코드 깜빡해도 다른 사람 책장이 노출되지 않음. |
| **마이그레이션 (migration)** | 두 가지 의미가 있는데 본 PR에선 **"브라우저 안에 있던 게스트 데이터를 클라우드로 옮기는 과정"**. 게스트로 책 3권 등록 → 로그인 → 그 3권이 자동으로 서버에 복사. |
| **idempotent (이뎀포턴트)** | 같은 함수를 1번 부르나 100번 부르나 결과가 똑같은 성질. 본 PR의 마이그레이션은 idempotent → 매번 로그인할 때마다 돌려도 같은 책이 100번 복제되지 않음. *"안전하게 또 돌릴 수 있는 함수"* 로 외워도 무방. |
| **position** | 책마다 붙는 번호 (0, 1, 2…). 책장 그리드에서 몇 번째 칸에 진열할지를 가리킴. 지금은 등록한 순서대로 자동으로 매김. 미래에 *드래그&드롭으로 책 순서 바꾸기* 가 추가될 때 이 숫자만 바꾸면 됨. |
| **TDD (Test-Driven Development)** | "실패하는 테스트부터 먼저 쓰고, 그걸 통과시키는 코드를 짠다"는 방식. 본 PR의 모든 함수는 RED(테스트 실패) → GREEN(테스트 통과) 사이클로 작성. 결과: 코드가 1줄도 검증 없이 들어가지 않음. |
| **uuid v4** | 충돌 확률이 사실상 0인 무작위 ID 생성 표준. 본 앱에선 구절(Quote)의 id로 씀. 로컬과 클라우드 양쪽에서 같은 ID를 쓰니 마이그레이션 시 ID가 보존됨. |
| **camelCase ↔ snake_case** | JS는 `coverUrl`, Postgres는 `cover_url`을 선호함. 두 세계를 잇는 코드(`supabaseStorage.ts`)가 가운데서 변환 담당. |
| **인터페이스 (TS interface)** | "이 함수들을 갖고 있어야 한다"는 약속서. 본 PR의 `LibraryStorage`는 8개 함수의 시그니처만 정의 — 그 약속을 IndexedDB 구현과 Supabase 구현이 각자 지킴. |
| **Postgrest** | Supabase의 "DB 쿼리를 HTTP로 부르는 인터페이스". `client.from("books").select("*").eq("isbn", "123")` 같은 체이닝이 이걸 통해 SQL로 번역됨. |
| **fake-indexeddb** | "테스트 환경(Node.js)에서 브라우저 IndexedDB를 흉내내는 라이브러리". 진짜 브라우저 안 띄워도 IndexedDB 테스트 가능. |

---

## 3. 코드가 실제로 하는 일 (시나리오 흐름)

### 시나리오 A: 게스트가 책 한 권 추가

```
[사용자]
   │  ISBN 9788960773431 입력
   ▼
[UI 컴포넌트 (Task 15에서 만들 예정)]
   │
   │  const storage = getStorage(null)   ← session 없으니 IndexedDB 모드
   │  await storage.addToLibrary(book)
   ▼
[lib/db/index.ts]
   │  getStorage(null) → createLocalStorage()
   ▼
[lib/db/localStorage.ts]
   │  idb-keyval로 IndexedDB 3개 store에 기록
   │   ├─ books store     ─ ISBN을 key로 책 메타 저장
   │   ├─ entries store   ─ 책장 진열 정보 (addedAt, position)
   │   └─ quotes store    ─ (이번엔 비어있음)
   ▼
[브라우저 IndexedDB]
   책 진열 완료 — 새로고침해도 살아있음, 다른 기기에선 안 보임
```

### 시나리오 B: 그 사용자가 로그인

```
[사용자]
   │  로그인 모달 작성 → Supabase 인증 통과
   ▼
[UI 컴포넌트 (Task 17에서 만들 예정)]
   │
   │  await migrateLocalToCloud(localStorage, supabaseStorage)
   ▼
[lib/db/migrate.ts]
   │  1. local의 listLibrary()로 게스트 책 목록 가져옴
   │  2. cloud에 이미 있는 ISBN 목록과 대조
   │  3. 없는 책만 cloud로 복사 (cloud.addToLibrary)
   │  4. 책마다 quotes도 (text, page) fingerprint로 중복 거르고 복사
   ▼
[Supabase Postgres]
   책이 서버에 동기화 됨 — 이제 다른 기기에서 로그인해도 같은 책장 보임
   ※ 로컬 IndexedDB는 일부러 안 지움 (사용자가 명시적으로 "끝내기" 누르기 전엔 보존)
```

### 시나리오 C: 책 검색 후 추가

```
[사용자]
   │  검색창에 "9788960773431" 입력
   ▼
[UI 컴포넌트 (Task 15)]
   │  const book = await fetchBookByIsbn(isbn)
   ▼
[utils/api.ts]
   │  axios로 한국 도서 API 호출 (외부 서비스)
   │  응답 → mapApiBook()으로 우리 도메인 타입으로 변환
   │   ※ API 필드명이 titleInfo인지 title인지 미확정 → fallback 체인으로 안전망
   ▼
   Book 객체 반환 → 그대로 storage.addToLibrary(book) 으로 흘러감
```

---

## 4. 기술 선택 *이유* (왜 이걸로 했는지)

### IndexedDB · `idb-keyval`
- **왜 IndexedDB?** 게스트가 책 50권 등록해도 안전한 큰 저장소. 쿠키는 4KB 제한이라 부족. `localStorage` API는 동기라서 큰 데이터엔 부적합.
- **왜 `idb-keyval`?** IndexedDB raw API는 너무 verbose (이벤트 콜백 지옥). `idb-keyval`은 Promise 기반으로 단순화. Dexie도 후보였지만 ORM 기능까지 필요 없어서 더 가벼운 쪽 선택.

### Supabase
- **왜 Supabase?** 무료 tier 충분, Postgres 그대로 쓰니까 미래 SQL 마이그레이션 자유로움, RLS로 인증 처리가 깔끔. Firebase는 NoSQL이라 책-구절 관계 다루기가 살짝 어색.
- **왜 자체 서버 안 만들고?** MVP에서 백엔드 운영 부담 제로. 인증/DB/스토리지가 한 패키지.

### 인터페이스(`LibraryStorage`) + 두 구현
- **왜 인터페이스를 가운데 끼웠나?** UI 코드가 "지금 게스트인지 로그인인지"를 신경 안 써도 되게 하려고. UI는 `getStorage(session)`만 부르면 알아서 알맞은 구현이 옴.
- **부가 이득**: 테스트에서 가짜 storage 만들기 쉬움 (migrate 테스트에서 in-memory cloud 만든 게 이 이유).

### uuid v4 (`uuid` 라이브러리)
- 왜? 구절(Quote) ID가 IndexedDB와 Supabase 양쪽에서 같아야 마이그레이션 시 동일성 보존. DB가 ID를 매기게 두면 로컬↔클라우드 불일치 발생.

### 마이그레이션 idempotent + 비파괴
- **왜 idempotent?** 매 로그인마다 안전하게 또 부를 수 있게. "복사가 끝났는지" 상태를 따로 관리할 필요 없음 = 코드 단순.
- **왜 로컬 데이터 안 지움?** 클라우드 복사 직후 사고(네트워크 끊김 등)로 데이터 손실 우려. 사용자가 명시적으로 "이제 게스트 모드 끝낼게" 했을 때만 청소.

### 매핑 함수 fallback (`mapApiBook`)
- **왜 fallback 체인?** 외부 도서 API의 응답 필드명이 미확정 (`titleInfo`인지 `title`인지). 원본 응답을 `rawFromApi`에 통째로 보관해두면 나중에 매핑을 좁히기 쉬움. 실제 API 응답 한 번 찍어보고 Task 17에서 확정 예정 (PR 본문 caveat에 박아둠).

### Vitest 2.1.9 (4.x 아님)
- 시스템 Node가 20.11인데 Vitest 4는 `node:util.styleText` 기능을 요구함 (Node 20.13+). 다운그레이드해서 호환성 확보.

### TDD (Red → Green)
- 본 PR의 모든 9개 함수가 *실패하는 테스트* 부터 작성됐음. 결과:
  - 검증 없이 들어간 코드 0줄
  - 인터페이스 명세가 테스트로 박제됨 → 미래에 구현 갈아끼워도 동작 보장
  - 모서리 케이스(빈 결과, 중복 등록, 다른 유저 데이터)가 처음부터 다 다뤄짐

---

## 5. 파일 구조

```
lib/
├── auth/
│   └── supabase.ts          ─ Supabase 브라우저 클라이언트 (싱글톤)
└── db/
    ├── types.ts             ─ Book / Quote / LibraryEntry 타입 정의
    ├── storage.ts           ─ LibraryStorage 인터페이스 (8개 메서드 약속)
    ├── localStorage.ts      ─ IndexedDB 구현 (게스트 모드)
    ├── supabaseStorage.ts   ─ Supabase 구현 (로그인 모드)
    ├── migrate.ts           ─ migrateLocalToCloud (로컬→클라우드 동기화)
    └── index.ts             ─ getStorage(session) 팩토리 ⭐ UI 진입점
utils/
└── api.ts                   ─ 외부 도서 API 호출 + mapApiBook + fetchBookByIsbn 신규
tests/
├── lib/db/{types,localStorage,supabaseStorage,migrate}.test.ts
└── utils/api.test.ts
```

⭐ **UI는 `import { getStorage } from "@/lib/db"` 한 줄만 알면 끝**

---

## 6. 어떤 동작이 *테스트로 보장*되어 있나

**32 / 32 passed** · `tsc --noEmit` 0 errors

| 보장된 동작 | 테스트 위치 |
|---|---|
| 게스트가 책 등록 → 새로고침해도 살아있음 | `localStorage.test.ts` 9 케이스 |
| 같은 ISBN 두 번 등록해도 position 그대로 (중복 방지) | `localStorage` "is idempotent on duplicate addToLibrary" |
| 마이그레이션 두 번 돌려도 책이 두 배로 안 늘어남 | `migrate.test.ts` "is idempotent" |
| 다른 유저의 책장이 내 화면에 안 보임 | `supabaseStorage.test.ts` "listLibrary returns entries filtered by user" |
| 책 한 권 삭제 시 다른 유저의 동명 책은 안 건드림 | `supabaseStorage` "removeFromLibrary deletes only the current user's entry" |
| DB 컬럼명(`cover_url`)과 JS 필드명(`coverUrl`) 자동 변환 | `supabaseStorage` "getBook maps snake_case columns" |
| API 응답에 표지·저자 빠져있어도 앱이 안 죽음 | `api.test.ts` "falls back gracefully when optional fields are missing" |
| 네트워크 에러는 throw해서 UI가 토스트 띄울 수 있음 | `api.test.ts` "propagates axios errors" |

---

## 7. 본 PR이 *하지 않은* 것

| Task | 무엇 | 어느 PR에서? |
|---|---|---|
| 12–15 | UI 부품 (버튼/입력/모달, 책 카드, 추가 시트) | 다음 PR 후보 A |
| 16 | 로그인/회원가입 UI (모달, 프로필 칩) | B |
| 17 | "내 서재" 페이지에 이 모든 걸 합성 + 로그인 시 마이그레이션 자동 호출 | B |
| 18–19 | 책 상세 페이지, 구절 추가 시트, html2canvas로 PNG 캡처 | B |
| 20 | PWA (홈 화면 설치, 오프라인 셸) | C |
| 21 | `.env.local.example` 파일 정리 | C |
| 22 | Supabase 쪽 SQL 마이그레이션 (실제 테이블/RLS 정책 생성) | C 또는 별도 |
| 23 | README 재작성 + Mockup 스크린샷 임베드 | C |
| 24 | 빌드/린트/타입체크 통과 최종 검증 | C |

상세 plan: [`docs/superpowers/plans/2026-05-12-bookshelf-merge.md`](docs/superpowers/plans/2026-05-12-bookshelf-merge.md)

---

## 8. 알아두면 좋은 caveat

1. **Supabase 테이블이 아직 안 만들어졌음 (Task 22)** — 본 PR의 `supabaseStorage.ts`는 mock 기준으로 테스트 통과했지만, 실제 Supabase 프로젝트에 `books` `library_entries` `quotes` 테이블이 없으면 cloud 모드는 동작 안 함. UI를 붙이기 전 또는 Task 22에서 SQL 실행 필요.
2. **외부 API 응답 필드명 미확정** — `mapApiBook`은 `titleInfo`/`title`, `imageUrl`/`coverUrl` 같은 fallback을 깔아뒀음. Task 17에서 실 API 한 번 호출해서 canonical 필드명 확정 후 매핑 좁히면 됨.
3. **로컬 데이터는 자동 청소 안 됨** — 사용자가 게스트→로그인 후 명시적으로 "로컬 정리" 액션을 트리거할 때까지 IndexedDB에 그대로 남음. 의도된 동작.
4. **`getStorage()`는 Supabase env가 없으면 session 있을 때만 throw** — session === null이면 IndexedDB만 쓰니 환경변수 없어도 게스트 모드는 안전. (env 미설정 + 로그인 시도 시에만 에러)

---

## 9. 검증 상태

| 명령 | 결과 |
|---|---|
| `npm test` | ✅ 32 passed |
| `npm run typecheck` (tsc --noEmit) | ✅ 0 errors |
| `npm run lint` | ⏸ 미실행 (UI 코드 변경 없음) |
| `npm run build` | ⏸ 미실행 (Next.js 페이지 변경 없음 — 다음 PR에서) |

---

## 10. 이 PR을 머지하면 *눈으로 보이는 변화*

**없습니다.** `npm run dev`로 띄워도 옛 검색 폼이 그대로 나옴. 데이터 레이어는 깔렸지만 호출하는 UI가 없기 때문. 실제 책장 화면은 다음 PR (Tasks 12–17) 에서 등장 예정.

---

## 📁 미래의 자기 자신을 위한 안내

| 이게 궁금하면 | 보세요 |
|---|---|
| 왜 이 데이터 모델 / 인터페이스로 짰는지 | [`docs/superpowers/specs/2026-05-12-bookshelf-design.md`](docs/superpowers/specs/2026-05-12-bookshelf-design.md) §2 |
| 다음에 뭘 만들어야 하는지 | [`docs/superpowers/plans/2026-05-12-bookshelf-merge.md`](docs/superpowers/plans/2026-05-12-bookshelf-merge.md) Tasks 12–24 |
| 디자인 시스템 토큰 | [`DESIGN.md`](DESIGN.md) + [`tailwind.config.ts`](tailwind.config.ts) |
| Mockup (이 PR엔 UI 없지만 다음 PR이 따라갈 그림) | [`docs/design/`](docs/design/) |
| PR #1 본문 (foundation 단계의 결정 기록) | GitHub PR #1 페이지 |

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
