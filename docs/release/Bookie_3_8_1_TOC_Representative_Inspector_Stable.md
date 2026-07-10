# Bookie 3.8.1 TOC Representative Inspector Stable

## 기준

- Base: `Bookie_3_8_0_TOC_Canonicalizer_Duplicate_Stable.zip`
- Goal: TOC duplicate groups should keep the best representative title and expose debug inspector data.

## 변경

- Canonical duplicate groups now select a representative title by score + title readability.
- Exact same-title duplicates still keep the first entry to preserve stable ordering.
- Readable canonical variants are preferred:
  - `01. 입단` over `01 입단`
  - `01. 입단` over `01.입단`
- Added `BookieTocInspector` data for removed duplicate entries.
- Added `BookieTocInspectorSummary()` helper.
- Added `BookieConfig.toc.debugInspector`, default `false`.

## 출력 영향

- Normal non-duplicate TOC output is unchanged.
- Exact duplicate removal keeps previous first-entry behavior.
- Duplicate canonical variants may keep a more readable title when several equivalent titles exist.

## Tests

- TOC Profile
- TOC Title Merge
- TOC Repeat Series
- TOC Canonical Duplicate
- TOC Representative Inspector
- Dialogue
- Footnote v2
- JS syntax check
