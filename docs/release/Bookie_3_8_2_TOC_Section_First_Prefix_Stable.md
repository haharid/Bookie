# Bookie 3.8.2 TOC Section First Prefix Stable

Base: `Bookie_3_8_1_TOC_Representative_Inspector_Stable.zip`

## Goal

Keep TOC flat while preserving section information only on the first chapter after a section heading.

## Added

- TOC Section First Prefix Normalizer
- Rollback config: `BookieConfig.toc.sectionFirstPrefix`
- Regression tests for:
  - `1부` + `1화` -> `1부 1화`, then `2화`
  - `외전` + `1화` -> `외전 1화`, then `2화`
  - `외전 1화`, `외전 2화` -> `외전 1화`, `2화`
  - new section reset
  - non-chapter title preservation
  - hash chapter preservation

## Output scope

Only TOC titles are affected. Body text and existing EPUB cleanup steps are unchanged.

## Tests

Passed:

- TOC Profile
- TOC Title Merge
- TOC Repeat Series
- TOC Canonical Duplicate
- TOC Representative Inspector
- TOC Section First Prefix
- Dialogue
- Footnote v2
- JS syntax check
