# Bookie 3.1.4 General Cleanup

## Goal

Bookie 3.1.4 is a final cleanup step before Bookie 3.1 Final Stable.

The purpose is to make the existing app.js flow easier to read without changing EPUB output.

## Scope

Allowed:

- Add section comments
- Clarify existing function roles
- Keep the current processing order visible
- Document the 3.1 / 3.2 / 3.3 roadmap

Not allowed:

- New features
- Regex changes
- Footnote behavior changes
- Chapter behavior changes
- UI changes
- EPUB output changes

## app.js Flow

```text
TXT
↓
processFootnotes()
↓
cleanBlankLines()
↓
dialogueClean()
↓
buildParagraphHtml()
↓
EPUB HTML
```

## Notes

Footnote and chapter structure improvements are intentionally not included in Bookie 3.1.
They belong to Bookie 3.2 Foundation because they affect larger engine structure.

## Stable Rule

Bookie 3.1.4 must produce the same EPUB output as Bookie 3.1.3.
