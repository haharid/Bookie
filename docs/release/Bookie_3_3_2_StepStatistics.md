# Bookie 3.3.2 Step Statistics

## Goal

Add runtime statistics to the Bookie Engine without changing EPUB output.

## Added

- `context.stats.totalTime`
- `context.stats.steps[]`
- `context.stats.errors[]`
- Step runtime measurement
- Step HTML length diff tracking
- Skipped Step statistics
- Error Step statistics
- `BookieLogger.debug(context)` report helper

## Step Stat Shape

```js
{
  id,
  name,
  version,
  priority,
  enabled,
  skipped,
  error,
  time,
  beforeLength,
  afterLength,
  diff,
  changed
}
```

## Verification

Need light check only:

- Convert one existing EPUB.
- Confirm output matches 3.3.1.
- Confirm browser console has no errors.

## Stability Rule

Statistics are observational only. They must not modify `context.html`.
