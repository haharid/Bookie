# Bookie 3.7.0 - TOC Profile Foundation

## 목표

TOC Engine v2로 가기 위한 첫 번째 기반 작업.
이번 단계에서는 목차 출력이나 선택 결과를 바꾸지 않고, 기존 자동 탐지 점수 규칙을 후보 프로필 구조로 분리한다.

## 변경

- `createTocProfile(i)` 추가
  - 원문
  - wrapper 제거 후 제목 후보
  - score
  - reasons
  - rejects
- `chapterDetectScore(i)`는 기존처럼 숫자 점수만 반환
- `collectTocCandidates()` 추가
- `logTocProfileSummary()` 추가
- `BookieConfig.toc.debugProfile` 추가

## 안정성

- 기본값 `debugProfile: false`
- GUI 표시 변경 없음
- EPUB 출력 변경 없음
- 기존 자동 탐지 threshold 유지

## 테스트

`tests/toc/run-toc-profile-tests.js`

검증 내용:

- 기존 `chapterDetectScore()`와 새 `createTocProfile().score` 일치
- 기존 자동 탐지 선택 결과 유지
