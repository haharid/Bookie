# Bookie 3.9.0 CSS Cleanup v1 Stable

## Scope

- Remove empty ordinary CSS rules.
- Remove exact duplicate declarations only within the same declaration block.
- Recurse only through safe rule containers such as `@media` and `@supports`.

## Explicit exclusions

- No unused selector detection or deletion.
- No selector merging or renaming.
- No declaration reordering.
- No shorthand conversion or zero-unit conversion.
- No comment removal or minification.
- No changes to `@keyframes`, custom properties, CSS nesting, or unknown at-rules.

## Tests

- CSS cleanup regression test passed.
- Second-run idempotency passed.
- Duplicate, unused-resource, embedded-font, and junk-cleaner tests passed.
- All Stable TOC regression tests passed.
