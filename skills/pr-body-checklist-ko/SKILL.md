---
name: pr-body-checklist-ko
description: Korean PR body checklist formatter. Use when creating or editing pull request descriptions so the output always uses concise checkbox bullets under exactly two sections, `## 변경` and `## 검증`, with `검증` containing only test file paths (not lint/build commands).
---

# PR Body Checklist (KO)

이 스킬을 사용해 PR 본문을 아래 규칙으로 고정한다.

## 필수 규칙

- `## 변경`, `## 검증` 두 섹션만 사용한다.
- 모든 항목은 `- [x]` 체크박스 형식으로 작성한다.
- 문장은 짧게 유지한다.
- `## 검증`에는 테스트 파일 경로만 적는다.
- `lint`, `build`, 실행 커맨드, 장문 설명은 넣지 않는다.

## 출력 템플릿

```md
## 변경
- [x] ...
- [x] ...

## 검증
- [x] apps/web/src/...test.ts
- [x] apps/web/src/...test.ts
```
