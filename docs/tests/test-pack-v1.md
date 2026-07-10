# Bookie Test Pack v1

Bookie 3.4 Final Stable에서 추가한 회귀 테스트 기반이야.

## 포함 샘플

- `tests/blankline/`
- `tests/paragraph/`
- `tests/dialogue/`
- `tests/cleanup/`
- `tests/mixed/`

## 확인 기준

1. 입력 파일을 Bookie 처리 흐름에 통과시켜.
2. 결과가 `expected` 파일과 같은지 확인해.
3. 차이가 있으면 기능 변경인지 버그인지 먼저 분류해.

## 원칙

- 기존 기능 리팩터링은 expected 출력이 바뀌면 안 돼.
- 새 기능 추가로 출력이 바뀔 때는 release note에 반드시 기록해.
