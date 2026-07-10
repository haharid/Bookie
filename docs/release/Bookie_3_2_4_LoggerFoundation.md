# Bookie 3.2.4 Logger Foundation

## Goal

Bookie 3.2.4 adds the first logger foundation for future debug tools.

This version does not add user-facing features and must keep EPUB output identical to Bookie 3.2.3.

## Added

- `js/logger.js`
- `BookieLogger`
- Pipeline logger hook
- Step execution records in `context.logs`

## Log shape

```js
{
  step: "Blankline",
  beforeLength: 1234,
  afterLength: 1200,
  changed: true
}
```

If a Step throws an error, the logger records an error entry and the original error is re-thrown.

```js
{
  step: "ParagraphHtml",
  error: true,
  message: "..."
}
```

## Rule

Logger is passive.

It can observe Step execution, but it must not modify `context.html`, EPUB output, UI, or existing cleaner behavior.

## Pipeline Order

Current Step order is unchanged:

1. Footnote
2. Blankline
3. Dialogue
4. ParagraphHtml
5. FootnoteAppend
