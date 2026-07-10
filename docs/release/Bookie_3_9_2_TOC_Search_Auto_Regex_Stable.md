# Bookie 3.9.2 TOC Search Auto Regex Stable

## Change

The TOC search box now accepts either a real title sample or a regular expression.

- `1화 바보` → automatically converted to the chapter-series regex
- `1. 바보` → automatically converted to the numbered-title regex
- `^\d+화` → used unchanged as an explicit regular expression

## Stability

- Existing click-to-select behavior is unchanged.
- Existing direct regex search is unchanged.
- EPUB Optimizer is unchanged.
