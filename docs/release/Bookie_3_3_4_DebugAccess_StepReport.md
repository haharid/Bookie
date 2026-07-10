# Bookie 3.3.4 Debug Access / Step Report

## 목표

EPUB 출력은 그대로 유지하면서 마지막 변환 결과의 Step 실행 리포트를 확인할 수 있는 Debug 접근 기반을 추가했어.

## 추가

- `js/core/debug-access.js`
- `BookieDebug.getContext()`
- `BookieDebug.getReport()`
- `BookieDebug.print()`
- `BookieDebug.table()`
- `BookieDebug.errors()`
- `BookieDebug.dependencies()`
- `BookieEngine.lastContext`
- `BookieEngine.getLastContext()`
- `BookieEngine.getLastReport()`

## 콘솔에서 확인

```js
BookieDebug.print()
```

```js
console.table(BookieDebug.table())
```

```js
BookieDebug.errors()
```

## 출력 영향

없어야 해.

이번 버전은 Step 실행 결과를 조회하는 기반만 추가해.
