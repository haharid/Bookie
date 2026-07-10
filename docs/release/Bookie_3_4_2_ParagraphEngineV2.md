# Bookie 3.4.2 Paragraph Engine v2

## 목표

Paragraph HTML 변환 로직을 독립 Engine으로 분리했어.
출력 규칙은 3.4.1과 동일하게 유지하는 안정화 리팩터링 버전이야.

## 변경

- `js/engines/paragraph-engine.js` 추가
- `buildParagraphHtml()`이 `BookieParagraphEngine.build()`를 사용하도록 연결
- 기존 로직은 fallback으로 유지
- 별표 구분선, 각주 링크 보호, 문단 간격 처리, 태그 정리를 역할별 함수로 분리
- Paragraph 전용 테스트 샘플 추가

## 확인

- Bookie 실행
- EPUB 하나 넣고 실행
- 결과가 3.4.1과 같은지 확인

