# Bookie 3.9.0 EPUB Optimizer Final Stable

TOC Engine 3.8.3 Stable 위에 EPUB Optimizer 전체 파이프라인을 완성한 기준 버전입니다.

# 🐾 Bookie

Bookie는 EPUB 정리와 후처리를 안전하게 수행하기 위한 로컬 도구야.

## 현재 방향

- 3.1: 기존 코드 정리
- 3.2: Engine / Pipeline / Context 기반 구축
- 3.3: Engine Upgrade
- 3.4: 기존 기능 품질 개선

## 실행

`index.html`을 열어서 사용해.

현재는 로컬 HTML 방식이라 브라우저 콘솔에 `file://` 관련 경고가 보일 수 있어. EPUB 실행과 결과 생성이 정상이라면 무시해도 돼.

## 주요 구조

```text
assets/      이미지와 브랜드 리소스
css/         UI / EPUB CSS
js/          실행 코드
js/engines/  기능별 엔진
js/steps/    Pipeline Step
docs/        문서
backup/      백업과 아카이브
tests/       회귀 테스트 자료
legacy/      퇴역 파일
```

## 개발 원칙

- 출력 안정성이 최우선이야.
- 새 기능은 Step으로 추가해.
- Engine은 기능 세부 사항을 몰라야 해.
- Pipeline은 실행 순서만 관리해.
- 리팩터링 후에는 기존 결과와 비교해.


## Bookie 3.6.0
- 연속 대사 분리 안정 규칙 적용 완료.
- 대사 뒤 `[` 분리만 추가하고 일반 서술문 연결은 유지.

## TOC Section Registry

TOC section rules are managed in `js/toc-section-registry.js`. Stable defaults include numbered parts, extras, `PART n`, and `ACT n`. New section patterns can be added with `BookieTocSectionRegistry.register(...)` without editing the parser.

## Bookie 3.9.0 EPUB Optimizer

현재 Optimizer 실행 순서:

1. Duplicate Resource Engine
2. Unused Resource Cleaner
3. Embedded Font Cleaner
4. Metadata Junk Cleaner
5. CSS Cleanup
6. OPF Cleanup

내장 폰트는 프로젝트 기본 정책에 따라 모두 제거해. CSS의 일반 `font-family`와 `font` 선언은 유지하고, `@font-face`와 실제 폰트 파일만 제거해. 알려진 운영체제·제작 도구 찌꺼기 파일도 함께 정리해. CSS Cleanup은 빈 규칙과 같은 블록의 완전히 동일한 중복 선언만 제거하며, 미사용 선택자나 CSS 값은 삭제·변경하지 않아. OPF Cleanup은 순서나 메타데이터 값을 바꾸지 않고 정확한 중복과 끊어진 로컬 참조만 보수적으로 정리해.


## Optimizer NAV / NCX Cleanup
- Missing local TOC targets, empty leaf entries, and exact sibling duplicates are conservatively removed.
- Labels, order, hierarchy, and fragments remain unchanged.
