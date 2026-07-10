# Bookie 3.2.1 Engine Entry

## Purpose

Create the first Bookie Engine entry point.

Bookie 3.2 is the Foundation phase.  
This step does not add user-facing features.

## Changed Files

- `js/engine.js` added
- `js/app.js` delegates `textPartToHtml(text)` to `BookieEngine.process(text)`
- `index.html` loads `js/engine.js` before `js/app.js`

## Preserved Processing Order

1. `processFootnotes(text)`
2. `cleanBlankLines(foot.body)`
3. `dialogueClean(raw)`
4. `buildParagraphHtml(raw)`
5. Append `foot.notesHtml`

## Rules

- No regex changes
- No feature additions
- No EPUB output changes
- No UI changes

## Goal

`app.js` keeps helper functions.  
`BookieEngine` becomes the central processing entry point.
