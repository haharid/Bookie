# Bookie 3.2.2 Pipeline + Context Foundation

Base: Bookie 3.2.1 Engine Entry Stable
Phase: Foundation
Goal: Build the Pipeline + Context layer without changing EPUB output behavior.

## Changes

- Added `createBookieContext(sourceText, options)`.
- Added `BookiePipeline` with `steps`, `add(step)`, and `run(context)`.
- Added basic Step wrappers:
  1. `FootnoteStep`
  2. `BlanklineStep`
  3. `DialogueStep`
  4. `ParagraphHtmlStep`
  5. `FootnoteAppendStep`
- Updated `BookieEngine.process(sourceText, options)` to create context and run the pipeline.
- Preserved the existing stable processing order:
  1. `processFootnotes`
  2. `cleanBlankLines`
  3. `dialogueClean`
  4. `buildParagraphHtml`
  5. append footnote HTML

## Context Shape

```js
{
  sourceText,
  html,
  options,
  logs,
  meta
}
```

## Rules

- No feature additions.
- No regex changes.
- No cleaner logic changes.
- No EPUB output changes intended.
- This step only creates the foundation for future Step-based expansion.
