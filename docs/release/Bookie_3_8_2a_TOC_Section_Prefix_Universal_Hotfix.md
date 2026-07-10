# Bookie 3.8.2a TOC Section Prefix Universal Hotfix

## Base

Bookie_3_8_2_TOC_Section_First_Prefix_Stable.zip

## Goal

Apply Section First Prefix normalization to all TOC title styles already accepted by Bookie, including hash-marked section titles.

## Changes

- Added shared TOC rule title normalization for section parsing.
- Treats `#외전`, `외전`, `#2부`, and `2부` consistently for section-prefix logic.
- Keeps normal hash chapter titles such as `#41화` unchanged outside section-prefix normalization.
- Added regression tests for:
  - `#외전` + `1화` → `외전 1화`
  - `#외전 2화` → `2화`
  - `#2부` + `1화` → `2부 1화`

## Modified files

- `js/parser.js`
- `VERSION.txt`
- `CHANGELOG.md`
- `MANIFEST.md`
- `docs/release/Bookie_3_8_2a_TOC_Section_Prefix_Universal_Hotfix.md`
- `tests/toc/run-toc-section-first-prefix-tests.js`
