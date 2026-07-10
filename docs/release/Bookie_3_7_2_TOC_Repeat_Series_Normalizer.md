# Bookie 3.7.2 TOC Repeat Series Normalizer

## 기준
- Based on Bookie 3.7.1 TOC Adjacent Title Merge.

## 변경
- TOC 제목에서 반복 회차 접미사를 정규화한다.
- 지원 패턴:
  - `01. 입단(1)` / `01. 입단(2)`
  - `01. 입단 (1/4)` / `01. 입단 (2/4)`
  - `01. 입단①` / `01. 입단②`
- 결과 예:
  - `01. 입단(1)` → `01. 입단`
  - `01. 입단(2)` → `02.`
  - `02. 바보(1)` → `03. 바보`
  - `02. 바보(2)` → `04.`

## 안전 조건
- 같은 제목이 연속으로 나오고 접미사가 1부터 순서대로 증가할 때만 적용한다.
- `(상)`, `(하)`, `(전)`, `(후)`처럼 숫자가 아닌 접미사는 유지한다.
- `BookieConfig.toc.normalizeRepeatSeries = false`로 끌 수 있다.

## 테스트
- `tests/toc/run-toc-repeat-series-tests.js` 추가.
- 기존 TOC Profile / TOC Title Merge / Dialogue / Footnote v2 테스트 통과.
