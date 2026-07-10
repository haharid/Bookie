# Bookie 3.9.0 EPUB Optimizer Final Stable

## Stable engines

- Duplicate Resource Engine
- Unused Resource Cleaner
- Embedded Font Cleaner
- Metadata Junk Cleaner
- CSS Cleanup
- OPF Cleanup
- NAV / NCX Cleanup
- ZIP Cleanup
- Optimizer Report

## ZIP Cleanup

- Keeps `mimetype` as the first file entry created by the EPUB builder.
- Keeps `mimetype` stored without compression.
- Removes directory-only ZIP entries before generation.
- Performs a final hidden/junk file cleanup.
- Produces ZIP cleanup statistics and warnings without rewriting EPUB content paths.

## Optimizer Report

- Captures before/after resource counts and uncompressed internal byte totals.
- Records removed resources and cleanup counts for every optimizer stage.
- Records per-step and total execution time.
- Prints a final summary in the Bookie log.

## Compatibility policy

- TOC Engine remains Bookie 3.8.3 Stable and receives no new behavior.
- No selector usage deletion, path renaming, metadata value rewriting, or TOC title/order/hierarchy rewriting is performed.
