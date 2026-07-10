# Bookie 3.7.1 TOC Adjacent Title Merge

## 기준

- Base: Bookie 3.7.0 TOC Profile Foundation
- Scope: TOC 강화 2단계

## 변경

- `js/parser.js`
  - 분리형 목차 제목 병합 추가
  - 예: `01.` + `입단` → `01. 입단`
  - 예: `제1장` + `입단` → `제1장 입단`
  - 다음 줄이 일반 문장처럼 보이면 병합하지 않음
  - 다음 줄이 별도 목차 후보면 병합하지 않음
- `js/core/config.js`
  - `BookieConfig.toc.mergeAdjacentTitleLines` 추가
  - 기본값 `true`
- `tests/toc/run-toc-title-merge-tests.js`
  - 분리형 제목 병합 테스트 추가
  - 일반 문장 오탐 제외 테스트 추가
  - 설정 OFF 시 기존 제목 유지 테스트 추가

## 출력 영향

- 목차 제목 출력이 일부 개선될 수 있음.
- 본문 HTML/EPUB 본문 변환 규칙은 변경하지 않음.
- 병합은 TOC 제목/챕터 h1 제목 생성에만 반영됨.

## 테스트

통과:

- `tests/toc/run-toc-profile-tests.js`
- `tests/toc/run-toc-title-merge-tests.js`
- `tests/runner/run-dialogue-tests.js`
- `tests/footnote/run-footnote-v2-tests.js`
- JS syntax check

참고:

- `tests/footnote_352_test.js`, `tests/footnote_353_test.js`는 내부 경로가 과거 작업 폴더(`/mnt/data/bookie_352`, `/mnt/data/bookie_353_work`)로 고정되어 있어 현재 ZIP 기준에서는 실행 불가.
