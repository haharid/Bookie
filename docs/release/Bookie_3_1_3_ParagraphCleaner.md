# Bookie 3.1.3 Paragraph Cleaner

## 목표

기존 문단 HTML 변환 흐름을 `buildParagraphHtml(raw)` 함수로 분리한다.

## 변경 원칙

- 기능 추가 없음
- 정규식 변경 없음
- 출력 EPUB 변경 없음
- 기존 Stable 문단 변환 순서 유지

## 정리된 흐름

```text
textPartToHtml(text)
  ↓
processFootnotes(text)
  ↓
cleanBlankLines(foot.body)
  ↓
dialogueClean(raw)
  ↓
buildParagraphHtml(raw)
  ↓
foot.notesHtml 추가
```

## 확인 기준

- 앱 실행
- TXT 읽기
- EPUB 생성
- 기존 Stable과 출력 동일
