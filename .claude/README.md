# Bookshelf 프로젝트 플러그인 사용 가이드

이 프로젝트에는 2개의 플러그인 소스에서 총 7개의 플러그인이 설치되어 있습니다.
새 Claude Code 세션을 시작하면 자동으로 로드됩니다.

---

## 1. Superpowers (obra/superpowers) v5.1.0

구조화된 개발 워크플로우 방법론. 설계 > 계획 > 개발 > 리뷰 전체 사이클을 자동으로 가이드합니다.
스킬은 개발 단계에 따라 **자동 트리거**됩니다.

### 전체 워크플로우 흐름

```
brainstorming → writing-plans → (worktree) → TDD/executing-plans → verification → finishing
```

### 스킬 목록

#### brainstorming
- **트리거**: 새 기능 개발, 컴포넌트 생성, 기능 수정 시 자동 트리거
- **동작**: 아이디어를 구체적인 설계로 발전시킴. 요구사항 파악 > 접근법 2-3개 제안 > 설계 문서 작성
- **산출물**: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`

#### writing-plans
- **트리거**: 설계 승인 후, 코드 작성 전
- **동작**: 2-5분 단위의 구체적 태스크로 구현 계획 작성. 파일 경로, 코드까지 포함
- **산출물**: `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`

#### test-driven-development (TDD)
- **트리거**: 기능 구현, 버그 수정 시 자동 트리거
- **동작**: RED-GREEN-REFACTOR 사이클 강제
  - RED: 실패하는 테스트 먼저 작성
  - GREEN: 테스트 통과하는 최소 코드 작성
  - REFACTOR: 중복 제거, 구조 개선
- **규칙**: 테스트 없이 코드를 먼저 작성하면 삭제하고 다시 시작

#### systematic-debugging
- **트리거**: 버그, 테스트 실패, 예상치 못한 동작 발생 시
- **동작**: 4단계 디버깅 프로세스
  1. 근본 원인 조사 (에러 메시지 분석, 재현)
  2. 패턴 분석 (작동하는 코드와 비교)
  3. 가설 수립 및 검증
  4. 수정 구현 (실패 테스트 작성 후 수정)
- **규칙**: 근본 원인 파악 없이 수정 시도 금지

#### verification-before-completion
- **트리거**: 작업 완료를 주장하기 전 자동 트리거
- **동작**: 실제 명령어를 실행하여 증거 기반으로 완료 확인
- **규칙**: "잘 될 거예요" 같은 추측 금지. 반드시 실행 결과로 증명

#### subagent-driven-development
- **트리거**: 독립적인 태스크가 여러 개일 때 수동 사용
- **동작**: 태스크마다 독립 서브에이전트를 배정하여 구현 > 스펙 리뷰 > 코드 리뷰 진행

#### executing-plans
- **트리거**: 작성된 계획을 실행할 때
- **동작**: 계획 파일 로드 > 비판적 리뷰 > 태스크 순차 실행 > 완료 보고

#### dispatching-parallel-agents
- **트리거**: 2개 이상 독립적인 문제를 동시에 해결할 때
- **동작**: 문제 도메인별 전문 에이전트를 병렬 배치, 결과 통합

#### using-git-worktrees
- **트리거**: 기능 구현 시작 전
- **동작**: 격리된 워크스페이스(git worktree)에서 작업하도록 설정

#### finishing-a-development-branch
- **트리거**: 구현 완료 후, 모든 테스트 통과 확인 후
- **동작**: 4가지 옵션 제시 (로컬 머지 / PR 생성 / 유지 / 폐기)

#### requesting-code-review / receiving-code-review
- **트리거**: 태스크 완료 후 또는 머지 전
- **동작**: 코드 리뷰 서브에이전트 배치, 피드백 기술적 평가 후 반영

#### writing-skills
- **트리거**: 새 스킬을 만들거나 수정할 때
- **동작**: TDD 방법론을 스킬 문서 작성에 적용

---

## 2. wshobson/agents 플러그인 (6개)

도메인별 전문 에이전트, 스킬, 슬래시 커맨드를 제공합니다.

### 2-1. javascript-typescript

| 구분 | 이름 | 설명 |
|------|------|------|
| Agent | **javascript-pro** | ES6+, async 패턴, Node.js API 최적화 |
| Agent | **typescript-pro** | 고급 타입, 제네릭, 타입 안전성 설계 |
| Skill | **modern-javascript-patterns** | ES6+ 패턴 (async/await, 구조분해, 스프레드 등) |
| Skill | **typescript-advanced-types** | 제네릭, 조건부 타입, 매핑 타입, 유틸리티 타입 |
| Skill | **javascript-testing-patterns** | Jest, Vitest, Testing Library 테스트 패턴 |
| Skill | **nodejs-backend-patterns** | Express/Fastify 백엔드 패턴 |
| Command | **/typescript-scaffold** | TypeScript 프로젝트 스캐폴딩 (Next.js, React+Vite, API 등) |

### 2-2. frontend-mobile-development

| 구분 | 이름 | 설명 |
|------|------|------|
| Agent | **frontend-developer** | React/Next.js 컴포넌트, RSC, 서버 컴포넌트 |
| Agent | **mobile-developer** | React Native, Flutter, Expo 앱 개발 |
| Skill | **nextjs-app-router-patterns** | Next.js 14+ App Router, 서버 컴포넌트, 스트리밍, 캐싱 전략 |
| Skill | **react-state-management** | Redux Toolkit, Zustand, Jotai, TanStack Query |
| Skill | **tailwind-design-system** | Tailwind CSS v4 디자인 시스템, 반응형, 다크모드 |
| Skill | **react-native-architecture** | React Native/Expo 프로덕션 앱 아키텍처 |
| Command | **/component-scaffold** | React 컴포넌트 생성 (TypeScript, 테스트, 스토리북 포함) |

### 2-3. tdd-workflows

| 구분 | 이름 | 설명 |
|------|------|------|
| Agent | **tdd-orchestrator** | TDD 전체 사이클 오케스트레이션 (model: opus) |
| Agent | **code-reviewer** | AI 기반 코드 리뷰, 보안/성능 분석 (model: opus) |
| Command | **/tdd-cycle** | 전체 TDD 워크플로우 실행 (`--coverage N`으로 커버리지 목표 설정) |
| Command | **/tdd-red** | RED 단계: 실패하는 테스트 작성 |
| Command | **/tdd-green** | GREEN 단계: 테스트 통과하는 최소 코드 구현 |
| Command | **/tdd-refactor** | REFACTOR 단계: 테스트 안전망 하에 리팩토링 |

### 2-4. error-debugging

| 구분 | 이름 | 설명 |
|------|------|------|
| Agent | **debugger** | 에러/테스트 실패 디버깅 전문가 |
| Agent | **error-detective** | 로그/코드베이스 에러 패턴 탐색, 근본 원인 추적 |
| Command | **/error-analysis** | 에러 분류, 근본 원인 분석, 스택 트레이스 해석 |
| Command | **/error-trace** | Sentry 연동, 구조화된 로깅, 알림 설정 |
| Command | **/multi-agent-review** | 보안/아키텍처/성능 전문 에이전트 협업 코드 리뷰 |

### 2-5. git-pr-workflows

| 구분 | 이름 | 설명 |
|------|------|------|
| Agent | **code-reviewer** | AI 기반 코드 리뷰 (model: opus) |
| Command | **/git-workflow** | 코드 리뷰 > PR 생성 전체 워크플로우 (`--draft-pr`, `--squash` 등) |
| Command | **/pr-enhance** | PR 설명 생성, 리뷰 체크리스트, 리스크 평가 |
| Command | **/onboard** | 신규 개발자 온보딩 프로세스 |

### 2-6. accessibility-compliance

| 구분 | 이름 | 설명 |
|------|------|------|
| Agent | **ui-visual-validator** | UI 시각 검증, 디자인 시스템 준수, 접근성 확인 |
| Skill | **screen-reader-testing** | VoiceOver, NVDA 등 스크린 리더 테스트 |
| Skill | **wcag-audit-patterns** | WCAG 접근성 감사 패턴 |
| Command | **/accessibility-audit** | WCAG 준수 종합 접근성 감사 |

---

## 플러그인 간 시너지

이 프로젝트에서 두 플러그인은 아래와 같이 상호 보완됩니다:

```
[기능 개발 시작]
  superpowers/brainstorming     → 설계
  superpowers/writing-plans     → 계획 수립
  superpowers/using-git-worktrees → 격리 환경 생성
  ↓
[구현]
  superpowers/TDD               → 테스트 주도 개발 프로세스
  tdd-workflows/tdd-cycle       → TDD 실행 도구 (/tdd-red, /tdd-green, /tdd-refactor)
  javascript-typescript          → JS/TS 전문 에이전트 & 패턴
  frontend-mobile-development    → Next.js App Router, Tailwind 디자인 시스템
  ↓
[디버깅]
  superpowers/systematic-debugging → 근본 원인 분석 프로세스
  error-debugging                  → 에러 분석 도구 (/error-analysis, /error-trace)
  ↓
[완료]
  superpowers/verification       → 증거 기반 완료 검증
  accessibility-compliance       → WCAG 접근성 감사 (/accessibility-audit)
  git-pr-workflows               → PR 생성 & 코드 리뷰 (/git-workflow, /pr-enhance)
  superpowers/finishing           → 브랜치 정리 & 머지
```

---

## 자주 쓰는 슬래시 커맨드 요약

| 커맨드 | 용도 |
|--------|------|
| `/tdd-cycle` | TDD 전체 사이클 실행 |
| `/tdd-red` | 실패하는 테스트 작성 |
| `/tdd-green` | 테스트 통과 코드 작성 |
| `/tdd-refactor` | 리팩토링 |
| `/error-analysis` | 에러 분석 |
| `/error-trace` | 에러 추적 시스템 구축 |
| `/git-workflow` | 코드 리뷰 > PR 생성 워크플로우 |
| `/pr-enhance` | PR 품질 개선 |
| `/component-scaffold` | React 컴포넌트 스캐폴딩 |
| `/typescript-scaffold` | TypeScript 프로젝트 스캐폴딩 |
| `/accessibility-audit` | 접근성 감사 |
| `/multi-agent-review` | 다중 에이전트 코드 리뷰 |

---

## 플러그인 관리

```bash
# 설치된 플러그인 목록
claude plugin list

# 플러그인 비활성화
claude plugin disable <plugin-name>

# 플러그인 활성화
claude plugin enable <plugin-name>

# 플러그인 업데이트
claude plugin update <plugin-name>

# 플러그인 삭제
claude plugin uninstall <plugin-name>
```
