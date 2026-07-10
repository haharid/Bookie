# Bookie 3.1.2 Blankline Cleaner

## Purpose

This step is a refactoring-only step.

The existing blank-line cleanup logic was renamed and marked clearly as `cleanBlankLines()`.
No regular expression was changed.
No new blank-line behavior was added.

## Stable Rule

- Output EPUB must remain identical to the previous Stable behavior.
- This step only improves readability and searchability of the blank-line cleanup area.

## Changed Area

`js/app.js`

- `cleanBlankOnly()` renamed to `cleanBlankLines()`
- Call site updated inside `textPartToHtml()`
- Blankline Cleaner comment block added

## Not Changed

- Dialogue rules
- Paragraph rules
- Footnote rules
- TOC rules
- EPUB builder
- CSS
- UI
