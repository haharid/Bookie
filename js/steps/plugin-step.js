// Bookie 3.3.2 - Plugin Step Upgrade
// Adds Step metadata and canRun() while keeping default logic unchanged.

const PluginStep = {
  id: "plugin",
  name: "Plugin",
  version: "1.0",
  description: "Run enabled Bookie plugins",
  enabled: true,
  priority: 60,
  after: ["footnote-append"],

  canRun(context){
    return context.config?.plugins !== false;
  },

  run(context){
    if(typeof BookiePluginManager !== "undefined"){
      return BookiePluginManager.run(context);
    }

    return context;
  }
};
