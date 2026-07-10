# Bookie 3.9.0 NAV / NCX Cleanup v1 Stable

## Added
- Conservative EPUB3 NAV cleanup.
- Conservative EPUB2 NCX cleanup.
- Removes TOC entries whose local target file does not exist.
- Removes empty leaf entries.
- Removes exact duplicate entries only among siblings when both target and visible label match.
- Removes empty nested list containers created by cleanup.
- Adds cumulative optimizer report helpers and per-step timing records.

## Preserved
- TOC labels, order, and hierarchy.
- Existing URL fragments (`#anchor`) without trying to repair or strip them.
- Remote URLs.
- Non-TOC NAV landmarks and page-list sections.
- TOC Engine 3.8.3 Stable behavior.

## Tests
- NAV and NCX cleanup tests passed.
- Nested hierarchy and fragment preservation tests passed.
- Idempotence test passed.
- All previous Optimizer tests passed.
- All TOC regression tests passed.
