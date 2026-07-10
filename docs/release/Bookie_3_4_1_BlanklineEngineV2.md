# Bookie 3.4.1 - Blankline Engine v2

## 목표

Blankline Cleaner의 기존 출력은 유지하면서 내부 규칙을 작은 함수로 분리했어.

## 추가 파일

- `js/engines/blankline-engine.js`
- `tests/blankline/README.md`
- `tests/blankline/input.html`

## 변경 파일

- `js/app.js`
- `js/steps/blankline-step.js`
- `index.html`
- `VERSION.txt`
- `CHANGELOG.md`
- `ROADMAP.md`

## 핵심 구조

`BookieBlanklineEngine.clean(text, options)`가 다음 규칙을 순서대로 실행해.

1. 줄바꿈 정규화
2. 안전 공백 정규화
3. 자동 공백 정리 강화 옵션 처리
4. 문단 간격 기준 큰 공백 압축
5. 앞뒤 공백 trim

## 안정성 기준

EPUB 출력은 Bookie 3.3.4와 동일해야 해.
