# Bookie 3.2.6 Step Registry Foundation

## Goal

Create a central place for registering and ordering BookieSteps.

This version does not add EPUB features and must keep the previous Stable output unchanged.

## Added

- `js/step-registry.js`
- `BookieStepRegistry.register(step, order)`
- `BookieStepRegistry.registerMany(items)`
- `BookieStepRegistry.list()`
- `BookieStepRegistry.describe()`
- `BookieStepRegistry.applyTo(BookiePipeline)`

## Current Step Order

1. Footnote
2. Blankline
3. Dialogue
4. ParagraphHtml
5. FootnoteAppend
6. Plugin

## Why

Bookie 3.2.5 created a plugin foundation.
Bookie 3.2.6 creates a step registry so future built-in steps and plugin steps can be registered without spreading order logic across the Engine.

## Output Lock

All existing step logic remains unchanged.
The registry only controls registration and order.
