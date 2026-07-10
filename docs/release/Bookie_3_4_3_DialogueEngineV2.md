# Bookie 3.4.3 Dialogue Engine v2

## 목표

Dialogue Cleaner 로직을 독립 Engine으로 분리했어.
출력 규칙은 3.4.2와 동일하게 유지하는 안정화 리팩터링 버전이야.

## 변경

- `js/engines/dialogue-engine.js` 추가
- `DialogueStep`이 `BookieDialogueEngine.clean()`을 사용하도록 연결
- 기존 `dialogueClean()`은 fallback으로 유지
- 대사 분리 규칙을 역할별 함수로 분리
- Dialogue 전용 테스트 샘플 추가

## 확인

- Bookie 실행
- EPUB 하나 넣고 실행
- 결과가 3.4.2와 같은지 확인
