// Bookie 3.9.0 - EPUB Optimizer Pipeline
(function(root){
  'use strict';
  const OptimizerPipeline = {
    steps: [],
    reset(){ this.steps = []; return this; },
    use(step){ if(step && typeof step.run === 'function') this.steps.push(step); return this; },
    async run(context){
      const totalStart = Date.now();
      for(const step of this.steps){
        const id = step.id || 'unknown-step';
        const started = Date.now();
        await step.run(context);
        context.report.steps.push(id);
        if(context.report.stepTimingsMs) context.report.stepTimingsMs[id] = Date.now() - started;
      }
      context.report.totalDurationMs = Date.now() - totalStart;
      return context;
    }
  };
  root.BookieOptimizerPipeline = OptimizerPipeline;
  if(typeof module !== 'undefined' && module.exports) module.exports = OptimizerPipeline;
})(typeof globalThis !== 'undefined' ? globalThis : window);
