// Bookie 3.4.4 - General Cleanup Engine v2 Step
// Adds a dedicated final cleanup Step without changing Stable output.

const GeneralCleanupStep = {
  id: "general-cleanup",
  name: "GeneralCleanup",
  version: "2.0",
  description: "Final cleanup foundation with General Cleanup Engine v2",
  enabled: true,
  priority: 55,
  after: ["footnote-append"],
  before: ["plugin"],

  canRun(context){
    return context.config?.cleaner?.general !== false;
  },

  run(context){
    if(typeof BookieGeneralCleanupEngine !== "undefined"){
      const result = BookieGeneralCleanupEngine.clean(context.html, {
        config: context.config
      });

      context.html = result.html;
      context.meta.generalCleanup = result.report;
      return context;
    }

    return context;
  }
};
