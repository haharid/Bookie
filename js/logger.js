// Bookie 3.3.4 - Logger Step Report Upgrade
// Collects pipeline records in context.logs/context.stats without changing normal EPUB output.

const BookieLogger = {
  createEntry(stepName, beforeHtml, afterHtml, extra = {}){
    return Object.assign({
      step: stepName,
      beforeLength: typeof beforeHtml === "string" ? beforeHtml.length : 0,
      afterLength: typeof afterHtml === "string" ? afterHtml.length : 0,
      changed: beforeHtml !== afterHtml
    }, extra);
  },

  createStat(step, beforeHtml, afterHtml, time, extra = {}){
    const beforeLength = typeof beforeHtml === "string" ? beforeHtml.length : 0;
    const afterLength = typeof afterHtml === "string" ? afterHtml.length : 0;

    return Object.assign({
      id: step && step.id ? step.id : "",
      name: step && step.name ? step.name : "UnknownStep",
      version: step && step.version ? step.version : "",
      priority: step && Number.isFinite(step.priority) ? step.priority : null,
      enabled: !(step && step.enabled === false),
      skipped: false,
      executed: false,
      error: false,
      recoverable: false,
      time: Number.isFinite(time) ? time : 0,
      beforeLength,
      afterLength,
      diff: afterLength - beforeLength,
      changed: beforeHtml !== afterHtml
    }, extra);
  },

  dependencies(context, steps){
    if(!context || !context.stats) return;

    const list = Array.isArray(steps) ? steps : [];
    const ids = new Set(list.map(step=>step && step.id).filter(Boolean));
    const names = new Set(list.map(step=>step && step.name).filter(Boolean));
    const warnings = [];

    for(const step of list){
      if(!step) continue;

      for(const target of step.before || []){
        if(!ids.has(target) && !names.has(target)){
          warnings.push({
            step: step.id || step.name,
            type: "missing-before",
            target
          });
        }
      }

      for(const target of step.after || []){
        if(!ids.has(target) && !names.has(target)){
          warnings.push({
            step: step.id || step.name,
            type: "missing-after",
            target
          });
        }
      }
    }

    context.stats.dependencies = warnings;

    if(warnings.length && Array.isArray(context.logs)){
      context.logs.push({
        step: "DependencyCheck",
        warning: true,
        warnings
      });
    }
  },

  skip(context, step, reason = "skipped"){
    if(!context) return;

    const stepObj = typeof step === "string" ? { name: step } : step;
    const stepName = stepObj && stepObj.name ? stepObj.name : String(step || "UnknownStep");

    if(Array.isArray(context.logs)){
      context.logs.push({
        step: stepName,
        skipped: true,
        reason,
        changed: false
      });
    }

    if(context.stats && Array.isArray(context.stats.steps)){
      context.stats.steps.push(this.createStat(stepObj, context.html, context.html, 0, {
        skipped: true,
        executed: false,
        reason
      }));
    }
  },

  step(context, step, beforeHtml, afterHtml, time){
    if(!context) return;

    const stepObj = typeof step === "string" ? { name: step } : step;
    const stepName = stepObj && stepObj.name ? stepObj.name : String(step || "UnknownStep");

    if(Array.isArray(context.logs)){
      context.logs.push(this.createEntry(stepName, beforeHtml, afterHtml, {
        executed: true
      }));
    }

    if(context.stats && Array.isArray(context.stats.steps)){
      context.stats.steps.push(this.createStat(stepObj, beforeHtml, afterHtml, time, {
        executed: true
      }));
    }
  },

  error(context, step, error, beforeHtml, afterHtml, time, extra = {}){
    if(!context) return;

    const stepObj = typeof step === "string" ? { name: step } : step;
    const stepName = stepObj && stepObj.name ? stepObj.name : String(step || "UnknownStep");
    const message = error && error.message ? error.message : String(error);

    if(Array.isArray(context.logs)){
      context.logs.push({
        step: stepName,
        error: true,
        message,
        phase: extra.phase || "run",
        recoverable: extra.recoverable === true
      });
    }

    const stat = this.createStat(stepObj, beforeHtml, afterHtml, time, Object.assign({
      error: true,
      executed: false,
      message
    }, extra));

    if(context.stats && Array.isArray(context.stats.steps)){
      context.stats.steps.push(stat);
    }

    if(context.stats && Array.isArray(context.stats.errors)){
      context.stats.errors.push(stat);
    }
  },

  finish(context){
    if(!context || !context.stats || !Array.isArray(context.stats.steps)) return;

    context.stats.totalTime = context.stats.steps.reduce((sum, item)=>{
      return sum + (Number.isFinite(item.time) ? item.time : 0);
    }, 0);

    this.attachReport(context);
  },

  debug(context){
    if(!context || !context.stats || !Array.isArray(context.stats.steps)) return "";

    const lines = [
      "=====================",
      "Bookie Pipeline Stats",
      "====================="
    ];

    for(const step of context.stats.steps){
      const status = step.error ? "ERROR" : (step.skipped ? "SKIP" : "RUN");
      const reason = step.reason ? ` (${step.reason})` : "";
      const diff = step.diff > 0 ? `+${step.diff}` : String(step.diff);
      const time = Math.round(step.time * 100) / 100;
      lines.push(`${status} ${step.name}${reason} ${time}ms ${diff}`);
    }

    if(context.stats.dependencies && context.stats.dependencies.length){
      lines.push("---------------------");
      lines.push(`Dependency warnings: ${context.stats.dependencies.length}`);
    }

    lines.push("---------------------");
    lines.push(`Total ${Math.round(context.stats.totalTime * 100) / 100}ms`);
    lines.push("=====================");

    return lines.join("\n");
  },

  createReport(context){
    if(!context || !context.stats || !Array.isArray(context.stats.steps)){
      return {
        version: "Bookie 3.3.4",
        totalTime: 0,
        steps: [],
        errors: [],
        dependencies: [],
        summary: {
          total: 0,
          executed: 0,
          skipped: 0,
          errors: 0,
          changed: 0
        }
      };
    }

    const steps = context.stats.steps.map(item=>Object.assign({}, item));
    const errors = Array.isArray(context.stats.errors)
      ? context.stats.errors.map(item=>Object.assign({}, item))
      : [];
    const dependencies = Array.isArray(context.stats.dependencies)
      ? context.stats.dependencies.map(item=>Object.assign({}, item))
      : [];

    return {
      version: "Bookie 3.3.4",
      totalTime: context.stats.totalTime || 0,
      sourceLength: typeof context.sourceText === "string" ? context.sourceText.length : 0,
      outputLength: typeof context.html === "string" ? context.html.length : 0,
      diff: (typeof context.html === "string" ? context.html.length : 0) - (typeof context.sourceText === "string" ? context.sourceText.length : 0),
      steps,
      errors,
      dependencies,
      summary: {
        total: steps.length,
        executed: steps.filter(item=>item.executed).length,
        skipped: steps.filter(item=>item.skipped).length,
        errors: steps.filter(item=>item.error).length,
        changed: steps.filter(item=>item.changed).length
      }
    };
  },

  reportText(context){
    const report = this.createReport(context);
    const lines = [
      "=====================",
      "Bookie Step Report",
      "=====================",
      `Steps ${report.summary.executed}/${report.summary.total} executed · ${report.summary.skipped} skipped · ${report.summary.errors} errors`,
      `Total ${Math.round(report.totalTime * 100) / 100}ms`,
      "---------------------"
    ];

    for(const step of report.steps){
      const status = step.error ? "ERROR" : (step.skipped ? "SKIP" : "RUN");
      const reason = step.reason ? ` (${step.reason})` : "";
      const diff = step.diff > 0 ? `+${step.diff}` : String(step.diff || 0);
      const time = Math.round((step.time || 0) * 100) / 100;
      lines.push(`${status} ${step.name}${reason} ${time}ms ${diff}`);
    }

    if(report.dependencies.length){
      lines.push("---------------------");
      lines.push(`Dependency warnings: ${report.dependencies.length}`);
    }

    return lines.join("\n");
  },

  attachReport(context){
    if(!context) return null;

    const report = this.createReport(context);
    context.report = report;

    if(context.debug){
      context.debug.lastReportText = this.reportText(context);
    }

    return report;
  },

  clear(context){
    if(context && Array.isArray(context.logs)){
      context.logs.length = 0;
    }

    if(context && context.stats){
      context.stats.totalTime = 0;
      if(Array.isArray(context.stats.steps)) context.stats.steps.length = 0;
      if(Array.isArray(context.stats.errors)) context.stats.errors.length = 0;
      if(Array.isArray(context.stats.dependencies)) context.stats.dependencies.length = 0;
    }
  }
};
