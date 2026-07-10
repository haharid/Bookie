# Bookie 3.2.5 Plugin Foundation

## Goal

Bookie 3.2.5 builds the future plugin foundation without changing EPUB output or existing behavior.

## Added structure

```text
BookieEngine
  ↓
BookiePluginManager.setup(context)
  ↓
BookiePipeline.run(context)
  ↓
Core Steps
  ↓
PluginStep
  ↓
BookiePluginManager.run(context)
```

## Context

`createBookieContext()` now includes a reserved plugin area.

```js
{
  sourceText,
  html,
  options,
  logs,
  meta,
  plugins
}
```

## Plugin Manager

`BookiePluginManager` is the official plugin manager name from 3.2.5.

The old `Plugin` global remains as a compatibility alias so existing plugin files do not break.

## Output Lock

The bundled plugins are still no-op plugins.

- call
- mail
- youtube

They return the input context unchanged.

Therefore EPUB output must remain identical to the previous stable version.

## Next

Bookie 3.2.6 can safely add plugin ordering rules, plugin diagnostics, or conditional plugin activation without touching Engine internals.
