# Bookie 3.1.1 Step1 - Parser Cleaner Map

## 목적
Plugin 시스템 확장을 중단하고, Basic Cleaner 새 폴더를 만들기 전에 현재 기본 정리 로직의 위치와 실행 순서를 확정한다.

이번 Step은 기능 추가가 아니다.
출력 EPUB 변경도 목표가 아니다.

## 현재 결론
현재 `parser.js`는 이름과 달리 본문 정리 파서가 아니라 목차 감지/챕터 후보 판별 중심 파일이다.

실제 기본 정리 흐름은 `app.js` 안의 `textPartToHtml()`에서 실행된다.

## 기본 정리 실행 순서
`epub-builder.js`에서 챕터 본문을 만들 때 아래 함수가 호출된다.

```js
textPartToHtml(content)
```

현재 흐름:

1. `processFootnotes(text)`
   - 각주 본문 분리
   - 본문 안 각주 번호 링크화
   - aside HTML 생성

2. `cleanBlankOnly(foot.body)`
   - 줄바꿈 통일
   - NBSP / 제로폭 공백 제거
   - 옵션에 따라 앞뒤 공백 정리
   - 문단 간격 감지값에 따라 과한 빈줄 압축

3. `dialogueClean(raw)`
   - 따옴표 대사 붙음 완화
   - 대사 사이 줄바꿈 추가

4. 특수 단독 줄 유지
   - @, ], #, ※, ▶, ▷, ◆, ■, □, ★, ☆ 등

5. `***` 토큰화
   - `[[STAR_BREAK]]` 임시 토큰으로 보호

6. 각주 링크 보호
   - `<a href="#fn...">...</a>` 임시 토큰화

7. `esc(raw)`
   - 일반 텍스트 HTML escape

8. 각주 링크 복원

9. 문단 HTML 변환
   - 감지된 문단 간격에 따라 `<p>` / `<p class="txt"><br/></p>` 생성

10. 일반 줄바꿈 1개 이어쓰기

11. `***` 복원
   - 가운데 정렬 `* * *` 문단으로 변환

12. 문단 꼬임 정리

13. 최종 반환
   - `<p>...</p>` + 각주 aside HTML

## 관련 파일 역할

### `app.js`
현재 Basic Cleaner의 실제 중심 파일.

포함 함수:
- `detectParagraphStyle(text)`
- `cleanBlankOnly(text)`
- `dialogueClean(text)`
- `processFootnotes(text)`
- `textPartToHtml(text)`

### `parser.js`
현재 목차 감지 중심 파일.

포함 함수:
- `makeFlexiblePattern(text)`
- `normalizeChapterLine(text)`
- `stripChapterWrappers(line)`
- `chapterDetectScore(i)`
- `autoDetectChapters()`
- `normalizePattern(line)`
- `getTocTitles()`

### `epub-builder.js`
EPUB 생성 흐름 담당.
챕터별 본문 생성 시 `textPartToHtml(content)` 호출.

### `file.js`
TXT 읽기 후 `detectParagraphStyle(fileText)` 실행.
그 후 `autoDetectChapters()` 실행.

## 다음 Step 권장

### Bookie 3.1.2 Step2 - Dialogue Cleaner 정리
목표:
`dialogueClean()`만 정리한다.

주의:
- 출력 EPUB 동일 유지
- 새 기능 추가 금지
- 빈줄/문단/각주/목차 건드리지 않기
- 함수 위치 이동보다 함수 내부 주석/역할 정리 먼저

## Stable 원칙
이 Step은 지도 작성 단계다.
JS 로직은 변경하지 않는다.
