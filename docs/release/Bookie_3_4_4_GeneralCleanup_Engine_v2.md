# Bookie 3.4.4 - General Cleanup Engine v2

## Goal

General Cleanup을 독립 Step과 Engine 구조로 분리해, 앞으로 작은 규칙 단위로 안전하게 옮길 기반을 만든다.

## Added

- `js/engines/general-cleanup-engine.js`
- `js/steps/general-cleanup-step.js`
- Character / Bracket / Divider / Page / Final cleanup 슬롯

## Output Policy

3.4.4는 foundation 단계라 기존 출력이 바뀌면 안 된다.
모든 cleanup 슬롯은 기본적으로 no-op으로 동작한다.

## User Check

- Bookie 열기
- EPUB 하나 넣고 실행
- 3.4.3 결과와 같은지 확인
