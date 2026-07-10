# Bookie 3.9.0 Duplicate Resource Engine v1 Stable

## Base

- `Bookie 3.8.3 TOC Section Registry Stable`
- TOC behavior is unchanged.

## Added

- Independent EPUB Optimizer Engine and Pipeline.
- Duplicate resource scan Step using SHA-256, byte size, and media type.
- Representative selection Step.
  - cover-like filename first
  - OPF manifest order second
  - stable path order fallback
- Reference rewrite Step for XHTML, HTML, CSS, SVG, NCX, XML, and OPF.
- OPF duplicate manifest item removal and `idref` / cover metadata ID rewrite.
- Duplicate resource removal Step.
- Optimizer report available through `BookieOptimizerEngine.getLastReport()`.

## v1 Scope

Only byte-identical binary EPUB resources are deduplicated:

- images
- fonts
- audio
- video

XHTML documents and CSS files themselves are not merged in this version.
No image recompression, resizing, renaming, or lossy conversion is performed.

## Builder Integration

The optimizer runs immediately before JSZip creates the final EPUB Blob.
If no duplicate binary resources exist, EPUB content remains unchanged.

## Tests

- Duplicate scan
- Cover representative selection
- XHTML reference rewrite
- CSS URL rewrite
- OPF manifest and ID rewrite
- Duplicate deletion
- Idempotent second execution
- Existing TOC regression suite
