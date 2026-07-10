# Bookie 3.3.1 Existing Steps Upgrade

## Goal
Upgrade existing Step execution metadata without changing EPUB output.

## Added / Updated
- Step metadata: `id`, `enabled`, `priority`
- Step condition hook: `canRun(context)`
- Pipeline skip support
- Lifecycle hooks connected to Pipeline run flow
- Context now includes `config`
- Config and Lifecycle scripts are loaded from `index.html`

## Default Step Order
1. Footnote
2. Blankline
3. Dialogue
4. ParagraphHtml
5. FootnoteAppend
6. Plugin

## Verification
This version should produce the same EPUB output as Bookie 3.2 Final Stable when all default config values remain enabled.
