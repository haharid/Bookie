# Bookie 3.2.3 Cleaner Steps Split Foundation

## Goal
Separate the 3.2.2 pipeline/context foundation into clearer files for future expansion.

## Scope
No feature additions.
No regex changes.
No cleaner logic changes.
No EPUB output changes intended.

## Changes
- Added `js/context.js`
- Added `js/pipeline.js`
- Added `js/steps/footnote-step.js`
- Added `js/steps/blankline-step.js`
- Added `js/steps/dialogue-step.js`
- Added `js/steps/paragraph-html-step.js`
- Added `js/steps/footnote-append-step.js`
- Reduced `js/engine.js` to engine entry + step registration only

## Stable Order
The processing order is intentionally unchanged:

1. FootnoteStep
2. BlanklineStep
3. DialogueStep
4. ParagraphHtmlStep
5. FootnoteAppendStep

## Architecture
```text
BookieEngine
  ↓
BookieContext
  ↓
BookiePipeline
  ↓
BookieStep files
```

## Next Candidate
Bookie 3.2.4 Logger foundation.
