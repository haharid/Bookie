# Bookie 3.8.0 TOC Canonicalizer Duplicate Stable

## Summary

TOC normalization now includes a canonical duplicate-removal pass after adjacent-title merge and repeat-series normalization.

## Added

- Canonical TOC comparison key generation.
- Exact duplicate TOC removal.
- Canonical duplicate TOC removal.
- Merge-result duplicate removal.
- Repeat-series-result duplicate removal.
- Internal `BookieTocInspector` removal reason list for debugging.
- `BookieConfig.toc.canonicalDuplicateRemoval` rollback switch.

## Preserved

- Existing TOC detection patterns.
- Existing adjacent title merge behavior.
- Existing repeat series behavior.
- Existing EPUB compatibility priority.

## Tests

- TOC Profile
- TOC Title Merge
- TOC Repeat Series
- TOC Canonical Duplicate
- Dialogue
- Footnote v2
- JS syntax checks
