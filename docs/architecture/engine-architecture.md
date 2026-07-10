# Bookie Architecture

## 목적
Bookie의 현재 구조와 실행 흐름을 한눈에 보기 위한 기준 문서다.

이 문서는 기능 추가가 아니다.
출력 EPUB 변경도 목표가 아니다.
앞으로 리팩터링할 때 어디를 건드려야 하는지 확인하기 위한 지도다.

## 현재 개발 방향
Bookie는 EPUB 자동 정리와 생성에 집중한다.

자동 처리 대상:
- TXT 읽기
- 대사(fb) 처리
- 빈줄 정리
- 문단 정리
- 목차 감지
- 챕터 생성
- 각주
- 표지
- EPUB 생성
- Metadata
- CSS

수동 유지 대상:
- 유튜브
- 카카오
- 전화
- 메일
- 상태창
- 게임 UI
- 댓글 UI
- 프로필 UI
- 특수 박스

특수 UI는 자동 인식하지 않는다.
필요할 때 사용자가 직접 HTML을 넣는 방식으로 유지한다.

## 전체 흐름

```text
TXT 파일 선택
  │
  ▼
file.js
  - TXT 읽기
  - 파일명 기반 제목 입력
  - 문단 간격 감지
  - 앞부분 미리보기 생성
  - 목차 자동 감지 호출
  │
  ▼
parser.js
  - 목차 후보 판별
  - 챕터 라인 정규화
  - 목차 제목 생성 보조
  │
  ▼
toc.js
  - 목차 선택 UI
  - 수동 패턴 적용
  - 목차 순서 변경
  - 선택/삭제/렌더링
  │
  ▼
epub-builder.js
  - EPUB 생성 시작
  - 표지 처리
  - 선택된 목차 순서대로 본문 생성
  - nav.xhtml / toc.ncx 생성
  - content.opf 생성
  - 다운로드
  │
  ▼
app.js
  - 각 챕터 본문을 HTML로 변환
  - 각주 처리
  - 빈줄 정리
  - 대사 정리
  - 문단 변환
  │
  ▼
EPUB 출력
```

주의:
실행 호출상 `epub-builder.js`가 `textPartToHtml()`을 호출하므로, 본문 정리는 EPUB 생성 단계에서 실제 적용된다.

## 파일별 역할

### `index.html`
화면 구조와 스크립트 로드 순서를 담당한다.

현재 로드 순서:

```text
epub-css.js
state.js
utils.js
ui.js
parser.js
toc.js
plugins/plugin-manager.js
plugins/call.js
plugins/mail.js
plugins/youtube.js
app.js
epub-builder.js
file.js
```

주의:
Plugin 파일은 현재 자동 변환 흐름에 연결하지 않는 방향으로 동결한다.

### `css/ui.css`
Bookie 작업 화면 UI 스타일.
EPUB 내부 스타일과 분리되어 있다.

### `css/epub.css`
출력 EPUB 내부 스타일 기준 파일.

### `js/state.js`
전역 작업 상태를 관리한다.

대표 상태:
- `fileText`
- `lines`
- `selectedIndexes`
- `tocConfidence`
- `appliedPatterns`
- `footnoteCounter`
- `footnoteList`

### `js/utils.js`
공통 유틸 함수.

대표 역할:
- HTML escape
- sleep
- 진행률 표시
- 로그 출력
- 라인 위치 계산
- 특정 라인 사이 텍스트 추출

### `js/ui.js`
화면 UI 보조 기능.

대표 역할:
- 접기/펼치기
- 카운트 갱신
- 목차 드래그 이벤트 연결

### `js/file.js`
TXT 파일 읽기와 초기 미리보기 담당.

주요 흐름:
1. TXT 파일 선택
2. 파일명 정렬 후 읽기
3. 제목 자동 입력
4. `detectParagraphStyle(fileText)` 호출
5. `lines` 생성
6. 앞부분 미리보기 렌더링
7. `autoDetectChapters()` 호출

### `js/parser.js`
현재 이름은 parser지만, 실제 역할은 목차 감지 중심이다.

대표 함수:
- `normalizeChapterLine()`
- `stripChapterWrappers()`
- `chapterDetectScore()`
- `autoDetectChapters()`
- `normalizePattern()`
- `getTocTitles()`

주의:
본문 정리의 중심 파일이 아니다.

### `js/toc.js`
목차 선택과 편집 UI 담당.

대표 함수:
- `selectPattern()`
- `selectByRegex()`
- `applyPattern()`
- `removePatternTag()`
- `clearSelection()`
- `removeTocIndex()`
- `renderToc()`

### `js/app.js`
현재 Basic Cleaner의 실제 중심 파일이다.

대표 함수:
- `detectParagraphStyle(text)`
- `cleanBlankOnly(text)`
- `dialogueClean(text)`
- `processFootnotes(text)`
- `textPartToHtml(text)`

현재 본문 처리 순서:

```text
processFootnotes()
  ↓
cleanBlankOnly()
  ↓
dialogueClean()
  ↓
특수 단독 줄 보호
  ↓
*** 보호
  ↓
각주 링크 보호
  ↓
esc()
  ↓
각주 링크 복원
  ↓
문단 HTML 변환
  ↓
일반 줄바꿈 이어쓰기
  ↓
*** 복원
  ↓
문단 꼬임 정리
  ↓
최종 HTML 반환
```

### `js/epub-builder.js`
EPUB 패키징 담당.

대표 역할:
- JSZip 준비
- 입력값 확인
- 표지 파일 추가
- 챕터 본문 XHTML 생성
- `textPartToHtml(content)` 호출
- 주석 페이지 생성
- nav.xhtml 생성
- toc.ncx 생성
- content.opf 생성
- EPUB 다운로드

중요:
목차 순서 변경이 본문 순서에도 반영되도록 `orderedTocIndexes` 기준으로 본문을 생성한다.

### `js/epub-css.js`
EPUB 내부 CSS 문자열을 제공한다.

### `js/plugins/`
Bookie 3.1.0에서 만들었던 Plugin 기반 파일들이다.

현재 방향:
- 확장 중단
- 자동 UI 변환에 사용하지 않음
- 삭제하지 않고 Legacy / Reserved 상태로 둠

## 리팩터링 기준

Bookie 3.1은 새 기능 추가가 아니라 기본 정리 엔진 안정화가 목표다.

원칙:
- Stable First
- 한 Step = 한 목적
- 출력 EPUB는 기존 Stable과 동일
- 작은 단위로만 변경
- 변경 후 바로 테스트
- 특수 UI 자동화 금지

## 앞으로의 권장 순서

```text
Bookie 3.1.2
대사(fb) 처리 정리

Bookie 3.1.3
빈줄 정리 정리

Bookie 3.1.4
문단 정리 정리

Bookie 3.1.5
각주 구조 정리

Bookie 3.1.6
목차 / 챕터 구조 정리

Bookie 3.2
Template Engine

Bookie 3.3
CSS Loader

Bookie 3.4
Auto Test

Bookie 3.5
Debug Mode
```

## Step 진행 시 확인할 것

매 Step마다 확인할 최소 항목:

```text
1. 화면 실행 여부
2. TXT 읽기 여부
3. 목차 감지 여부
4. EPUB 생성 여부
5. 기존 Stable과 출력 차이 없는지
```

기능을 실제로 바꾸는 Step부터는 추가로 해당 기능만 따로 확인한다.

예:
대사 Step에서는 대사 처리만 확인하고, 각주/표지/목차는 건드리지 않는다.
