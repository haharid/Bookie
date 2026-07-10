# Bookie 3.8.3 TOC Section Registry Stable

## Base

`Bookie_3_8_2a_TOC_Section_Prefix_Universal_Hotfix.zip`

## Change

TOC section recognition is now managed by `js/toc-section-registry.js` instead of a parser-local pattern array.

Stable default rules:

- `1부`, `제1부`
- `외전`, `특별외전`, `번외`, `후일담`
- `PART 1`, `ACT 1`

The registry exposes `register`, `unregister`, and `list`. Existing TOC output remains unchanged.

## Example

```javascript
BookieTocSectionRegistry.register({
  id: "side-story",
  source: "side\\s*story",
  normalize: "space"
});
```

## Tests

- Existing TOC regression tests
- Section Registry default-rule tests
- Custom rule registration/removal tests
- Dialogue regression
- Footnote v2 regression
