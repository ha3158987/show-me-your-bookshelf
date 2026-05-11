---
description: "Full-stack feature development with all plugins: brainstorm > plan > TDD > implement > debug > review > accessibility > PR"
argument-hint: "<구현하고 싶은 기능 설명>"
---

# Feature Development Pipeline

기능 요청: $ARGUMENTS

이 커맨드는 설치된 모든 플러그인을 활용하여 전체 개발 사이클을 실행합니다.

## CRITICAL BEHAVIORAL RULES

1. **단계를 순서대로 실행하라.** 절대 건너뛰거나 순서를 바꾸지 마라.
2. **체크포인트에서 반드시 멈춰라.** `CHECKPOINT`를 만나면 AskUserQuestion으로 사용자 승인을 받아라.
3. **실패 시 즉시 중단하라.** 에러 발생 시 사용자에게 보고하고 다음 단계로 넘어가지 마라.
4. **증거 기반으로 완료를 판단하라.** "될 거예요"는 금지. 실제 실행 결과로 증명하라.
5. **상태를 파일로 기록하라.** 각 단계의 산출물을 `.feature-dev/`에 저장하라. 컨텍스트 윈도우에 의존하지 마라.

---

## Pre-flight: 초기화

1. `.feature-dev/` 디렉토리가 이미 존재하는지 확인하라.
   - 존재하고 `state.json`의 `status`가 `"in_progress"`이면: 현재 상태를 보여주고 이어서 할지, 새로 시작할지 물어라.
   - 존재하고 `status`가 `"complete"`이면: 아카이브하고 새로 시작할지 물어라.

2. `.feature-dev/` 디렉토리와 `state.json`을 생성하라:

```json
{
  "feature": "$ARGUMENTS",
  "status": "in_progress",
  "current_phase": 1,
  "completed_phases": [],
  "files_created": [],
  "started_at": "ISO_TIMESTAMP",
  "last_updated": "ISO_TIMESTAMP"
}
```

---

## Phase 1: Discovery (탐색)

**Goal**: 프로젝트 컨텍스트를 파악하고 기능 요구사항을 구체화한다.

**Actions**:
1. 프로젝트 구조 파악: CLAUDE.md, package.json, tsconfig.json, 주요 파일 읽기
2. 기존 코드 패턴 분석: App Router 구조, 컴포넌트 패턴, API 패턴, 스타일링 패턴
3. **Skill 활용**: `nextjs-app-router-patterns`, `tailwind-design-system` 스킬을 참고하여 프로젝트 컨벤션 파악
4. 산출물을 `.feature-dev/01-discovery.md`에 저장

```
CHECKPOINT: 탐색 결과를 사용자에게 보여주고 계속 진행할지 확인
```

---

## Phase 2: Brainstorming (설계)

**Goal**: 기능을 구체적인 설계로 발전시킨다.

**Plugin**: superpowers/brainstorming 스킬을 반드시 invoke하라.

**Actions**:
1. 요구사항에서 불명확한 부분을 질문하라 (한 번에 하나씩)
2. 2-3가지 구현 접근법을 트레이드오프와 함께 제안하라
3. **Agent 활용**: `frontend-developer` 에이전트와 `typescript-pro` 에이전트의 관점을 반영하라
4. 사용자가 선택한 접근법으로 설계 문서를 작성하라
5. 산출물을 `.feature-dev/02-design.md`에 저장

```
CHECKPOINT: 설계 문서를 사용자에게 보여주고 승인을 받아라
```

---

## Phase 3: Planning (계획)

**Goal**: 설계를 2-5분 단위의 구체적 태스크로 분해한다.

**Plugin**: superpowers/writing-plans 스킬을 반드시 invoke하라.

**Actions**:
1. 파일 구조와 책임 매핑
2. 각 태스크에 다음을 포함하라:
   - 정확한 파일 경로
   - 실패하는 테스트 (TDD RED)
   - 구현 코드
   - 검증 명령어
   - 커밋 메시지
3. 태스크 간 의존성 순서를 명확히 하라
4. 산출물을 `.feature-dev/03-plan.md`에 저장

```
CHECKPOINT: 구현 계획을 사용자에게 보여주고 승인을 받아라
```

---

## Phase 4: Implementation (구현)

**Goal**: 계획에 따라 TDD로 구현한다.

**Plugins**:
- superpowers/test-driven-development 스킬을 반드시 invoke하라
- `javascript-testing-patterns`, `modern-javascript-patterns`, `typescript-advanced-types` 스킬을 참고하라
- `nextjs-app-router-patterns`, `tailwind-design-system` 스킬을 참고하라

**Actions**:
각 태스크마다 다음 사이클을 반복하라:

### TDD Cycle (태스크당)
1. **RED**: 실패하는 테스트를 먼저 작성하라
   - 테스트가 예상대로 실패하는지 실행하여 확인하라
2. **GREEN**: 테스트를 통과하는 최소한의 코드를 작성하라
   - 모든 테스트가 통과하는지 확인하라
3. **REFACTOR**: 중복 제거, 네이밍 개선, 구조 정리
   - 리팩토링 후에도 모든 테스트가 통과하는지 확인하라
4. 태스크 완료 시 상태 파일 업데이트

테스트 프레임워크가 없으면 사용자에게 설치 여부를 물어라.

**규칙**:
- 테스트 없이 코드를 먼저 작성했다면, 삭제하고 테스트부터 다시 시작하라
- 각 태스크는 독립적으로 검증 가능해야 한다

진행 상황을 `.feature-dev/04-implementation-log.md`에 기록하라.

---

## Phase 5: Debugging (디버깅) - 필요시

**Goal**: 구현 중 발생한 에러를 체계적으로 해결한다.

**Plugins**:
- superpowers/systematic-debugging 스킬을 invoke하라
- `debugger`, `error-detective` 에이전트를 활용하라

**Actions**:
1. 에러 메시지를 정확히 읽고 재현하라
2. 작동하는 코드와 비교하여 차이점을 찾아라
3. 단일 가설을 세우고 최소한의 변경으로 검증하라
4. 수정 전에 실패하는 테스트를 먼저 작성하라
5. **근본 원인을 파악하지 않고 수정을 시도하지 마라**

---

## Phase 6: Verification (검증)

**Goal**: 모든 것이 실제로 동작하는지 증거 기반으로 확인한다.

**Plugin**: superpowers/verification-before-completion 스킬을 반드시 invoke하라.

**Actions**:
1. 전체 테스트 스위트 실행하고 결과를 보여라
2. `npm run build`로 빌드 성공을 확인하라
3. `npm run lint`로 린트 에러가 없는지 확인하라
4. 모든 결과를 `.feature-dev/05-verification.md`에 저장하라

```
CHECKPOINT: 검증 결과를 사용자에게 보여주고 다음 단계 진행 여부를 확인
```

---

## Phase 7: Accessibility Audit (접근성 감사)

**Goal**: WCAG 기준으로 접근성을 점검한다.

**Plugin**: `ui-visual-validator` 에이전트, `screen-reader-testing`, `wcag-audit-patterns` 스킬을 활용하라.

**Actions**:
1. 새로 작성한 컴포넌트/페이지의 접근성을 점검하라:
   - 시맨틱 HTML 사용 여부
   - ARIA 속성 적절성
   - 키보드 네비게이션 가능 여부
   - 색상 대비 충분성
   - 스크린 리더 호환성
2. 발견된 이슈가 있으면 수정하라
3. 결과를 `.feature-dev/06-accessibility.md`에 저장하라

---

## Phase 8: Code Review (코드 리뷰)

**Goal**: 코드 품질, 보안, 성능을 다각도로 검증한다.

**Plugins**:
- superpowers/requesting-code-review 스킬을 invoke하라
- `code-reviewer` 에이전트(model: opus)를 활용하라

**Actions**:
1. 코드 리뷰 에이전트를 배치하여 다음을 검토하라:
   - 코드 단순성 / DRY / 가독성
   - 버그 및 기능적 정확성
   - 프로젝트 컨벤션 준수
   - 보안 취약점
   - 성능 이슈
2. 리뷰 결과를 사용자에게 보여라
3. Critical/Important 이슈는 즉시 수정하라
4. 결과를 `.feature-dev/07-review.md`에 저장하라

```
CHECKPOINT: 리뷰 결과와 수정사항을 보여주고 PR 생성 여부를 확인
```

---

## Phase 9: Finish (완료)

**Goal**: 브랜치 정리 및 PR 생성

**Plugins**:
- superpowers/finishing-a-development-branch 스킬을 invoke하라
- `/pr-enhance` 커맨드를 활용하여 PR 품질을 높여라

**Actions**:
1. 사용자에게 4가지 옵션을 제시하라:
   - main에 로컬 머지
   - PR 생성 (추천)
   - 현재 브랜치 유지
   - 변경사항 폐기
2. PR 생성 시:
   - 변경사항 요약
   - 테스트 결과
   - 접근성 감사 결과
   - 스크린샷 (해당 시)
3. `.feature-dev/state.json`의 `status`를 `"complete"`로 업데이트하라

---

## Phase Summary

| Phase | Plugin Source | 핵심 |
|-------|-------------|------|
| 1. Discovery | wshobson (nextjs, tailwind skills) | 프로젝트 파악 |
| 2. Brainstorming | superpowers | 설계 |
| 3. Planning | superpowers | 태스크 분해 |
| 4. Implementation | superpowers TDD + wshobson (JS/TS, frontend skills) | TDD 구현 |
| 5. Debugging | superpowers + wshobson (error-debugging) | 에러 해결 |
| 6. Verification | superpowers | 증거 기반 검증 |
| 7. Accessibility | wshobson (accessibility-compliance) | WCAG 감사 |
| 8. Code Review | superpowers + wshobson (code-reviewer) | 코드 리뷰 |
| 9. Finish | superpowers + wshobson (git-pr-workflows) | PR 생성 |
