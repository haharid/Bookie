# Bookie 3.3.3 Step Dependency + Error Recovery

## Goal

Bookie 3.3.3 upgrades the engine so Steps can describe their execution relationship and the Pipeline can recover from Step-level errors.

This version does not add EPUB cleanup features. Normal EPUB output must remain identical to Bookie 3.3.2.

## Added

### Step dependency metadata

Steps may now define:

```js
before: ["next-step-id"]
after: ["previous-step-id"]
```

Example:

```js
const ParagraphHtmlStep = {
  id: "paragraph-html",
  after: ["dialogue"],
  before: ["footnote-append"],
  run(context) {}
};
```

### Dependency-aware Registry

`BookieStepRegistry.list()` now returns Steps in dependency-aware order with priority as the fallback.

### Error Recovery

`BookiePipeline.run(context)` catches Step errors, logs the failure, and continues to the next Step by default.

Control option:

```js
BookieConfig.engine.continueOnStepError = true;
```

Set it to `false` to restore fail-fast behavior.

### Logger records

Step statistics may now include:

- `executed`
- `skipped`
- `reason`
- `error`
- `recoverable`
- `phase`

## Check

Recommended check level: 🟡 간단 테스트

- Convert one EPUB.
- Confirm output matches Bookie 3.3.2.
- Confirm there are no console errors.
- Optional: temporarily add `throw new Error("test")` in one Step and confirm the following Steps still run.

## Output Rule

If no Step throws an error, EPUB output must remain unchanged from Bookie 3.3.2.
