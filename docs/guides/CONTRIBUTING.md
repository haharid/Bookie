# Bookie Contributing Guide

## Step Rule

Every Bookie Step should follow this shape:

```js
const ExampleStep = {
  id: "example",
  name: "Example",
  version: "1.0",
  description: "Short purpose",
  enabled: true,
  priority: 100,

  canRun(context){
    return true;
  },

  run(context){
    return context;
  }
};
```

## Engine Rule

- Engine creates Context.
- Pipeline controls order.
- Step owns one job.
- Logger records but never changes output.
- Plugin must behave like a Step.
- Default output must remain stable unless the version explicitly changes EPUB behavior.
