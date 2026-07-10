# Bookie 3.5.0 - Continuous Dialogue Split

Bookie 3.5 Feature Development 첫 작업이야.

## Added

- `BookieDialogueEngine` v3.0 적용
- 연속 대사 자동 분리 규칙 추가
- 한 줄 전체가 따옴표 대사 블록 2개 이상으로만 구성된 경우에만 분리
- `paragraphGap` 2 / 3 모두 대응
- Dialogue 전용 Node 테스트 러너 추가

## Rule

입력:

```txt
“널 데려온 건 내가 아니지.”“뭐?”“널 보내온 건 빙궁이지 않나.”
```

출력:

```txt
“널 데려온 건 내가 아니지.”

“뭐?”

“널 보내온 건 빙궁이지 않나.”
```

## Safety

일반 문단 안에 포함된 붙은 따옴표는 변경하지 않아.

예:

```txt
그는 “붙은대사.”“다음대사.”라고 말했다.
```

위 문장은 그대로 유지해.

## Tests

`node tests/runner/run-dialogue-tests.js`

통과 항목:

- continuous dialogue only
- disabled keeps stable output
- normal paragraph untouched
- paragraph gap 3 compatible split
