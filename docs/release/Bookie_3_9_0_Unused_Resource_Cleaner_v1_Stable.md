# Bookie 3.9.0 Unused Resource Cleaner v1 Stable

## Added
- Manifest resource inventory for optimizer cleanup.
- Reachability traversal from spine, NAV, NCX, cover and guide roots.
- Recursive XHTML, CSS and SVG resource reference traversal.
- Conservative removal for unreachable images, fonts, audio, video, SVG and CSS.
- Matching OPF manifest item cleanup.
- Unused-resource report fields and removed path list.

## Safety scope
- XHTML content documents are not removed by this version.
- `mimetype`, `META-INF`, OPF, NAV and NCX structures are not removal targets.
- Resources referenced only by another unreachable resource are removed together.
- Existing TOC logic is unchanged.
