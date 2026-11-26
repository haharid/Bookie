// Bookie 3.3.3 - Step Dependency + Error Recovery
// Runs Steps with skip/error statistics while preserving normal EPUB output.

const BookiePipeline = {
  steps: [],

  reset(){
    this.steps = [];
  },

  add(step){
    if(!step || !step.name || typeof step.run !== "function"){
      throw new Error("Invalid BookieStep");
    }

    this.steps.push(step);
  },

  shouldRun(step, context){
    if(step.enabled === false){
      return {
        ok: false,
        reason: "disabled"
      };
    }

    if(typeof step.canRun === "function"){
      try {
        if(step.canRun(context) === false){
          return {
            ok: false,
            reason: "canRun=false"
          };
        }
      } catch(error) {
        return {
          ok: false,
          reason: "canRun-error",
          error
        };
      }
    }

    return {
      ok: true,
      reason: "ready"
    };
  },

  now(){
    if(typeof performance !== "undefined" && typeof performance.now === "function"){
      return performance.now();
    }

    return Date.now();
  },

  shouldContinueOnError(context){
    if(context && context.config && context.config.engine){
      return context.config.engine.continueOnStepError !== false;
    }

    return true;
  },

  run(context){
    if(typeof BookieLifecycle !== "undefined" && typeof BookieLifecycle.beforePipeline === "function"){
      BookieLifecycle.beforePipeline(context);
    }

    if(typeof BookieLogger !== "undefined" && typeof BookieLogger.dependencies === "function"){
      BookieLogger.dependencies(context, this.steps);
    }

    for(const step of this.steps){
      const runState = this.shouldRun(step, context);

      if(!runState.ok){
        if(runState.error && typeof BookieLogger !== "undefined" && typeof BookieLogger.error === "function"){
          BookieLogger.error(context, step, runState.error, context.html, context.html, 0, {
            phase: "canRun",
            recoverable: true
          });
        }

        if(typeof BookieLogger !== "undefined" && typeof BookieLogger.skip === "function"){
          BookieLogger.skip(context, step, runState.reason);
        }
        continue;
      }

      if(typeof BookieLifecycle !== "undefined" && typeof BookieLifecycle.beforeStep === "function"){
        BookieLifecycle.beforeStep(step, context);
      }

      const beforeHtml = context.html;
      const startedAt = this.now();

      try {
        step.run(context);
      } catch(error) {
        const failedAt = this.now();

        if(typeof BookieLogger !== "undefined" && typeof BookieLogger.error === "function"){
          BookieLogger.error(context, step, error, beforeHtml, context.html, failedAt - startedAt, {
            phase: "run",
            recoverable: this.shouldContinueOnError(context)
          });
        }

        if(typeof BookieLifecycle !== "undefined" && typeof BookieLifecycle.afterStep === "function"){
          BookieLifecycle.afterStep(step, context);
        }

        if(!this.shouldContinueOnError(context)){
          if(typeof BookieLogger !== "undefined" && typeof BookieLogger.finish === "function"){
            BookieLogger.finish(context);
          }
          throw error;
        }

        continue;
      }

      const endedAt = this.now();

      if(typeof BookieLogger !== "undefined" && typeof BookieLogger.step === "function"){
        BookieLogger.step(context, step, beforeHtml, context.html, endedAt - startedAt);
      }

      if(typeof BookieLifecycle !== "undefined" && typeof BookieLifecycle.afterStep === "function"){
        BookieLifecycle.afterStep(step, context);
      }
    }

    if(typeof BookieLogger !== "undefined" && typeof BookieLogger.finish === "function"){
      BookieLogger.finish(context);
    }

    if(typeof BookieLifecycle !== "undefined" && typeof BookieLifecycle.afterPipeline === "function"){
      BookieLifecycle.afterPipeline(context);
    }

    return context;
  }
};
