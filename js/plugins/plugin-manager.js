// Bookie 3.2.5 - Plugin Foundation
// Purpose: provide a stable future extension point without changing current EPUB output.
// Rule: registered plugins are no-op unless a future version explicitly gives them work.
(function(global){
  const registry = new Map();

  function normalize(plugin){
    if(!plugin || typeof plugin !== "object"){
      throw new Error("BookiePluginManager.register: plugin object is required");
    }

    const name = String(plugin.name || "").trim();
    if(!name){
      throw new Error("BookiePluginManager.register: plugin.name is required");
    }

    return Object.freeze({
      name,
      order: Number.isFinite(plugin.order) ? plugin.order : 100,
      enabled: plugin.enabled !== false,
      setup: typeof plugin.setup === "function" ? plugin.setup : null,
      run: typeof plugin.run === "function" ? plugin.run : null,
      destroy: typeof plugin.destroy === "function" ? plugin.destroy : null,
      steps: Array.isArray(plugin.steps) ? plugin.steps.slice() : [],
      raw: plugin
    });
  }

  const BookiePluginManager = {
    register(plugin){
      const item = normalize(plugin);
      registry.set(item.name, item);
      return item;
    },

    unregister(name){
      const key = String(name || "").trim();
      if(!key) return false;
      return registry.delete(key);
    },

    get(name){
      return registry.get(String(name || "").trim()) || null;
    },

    list(){
      return Array.from(registry.values()).sort((a, b)=>a.order - b.order);
    },

    setup(context){
      for(const plugin of this.list()){
        if(plugin.enabled && plugin.setup) plugin.setup(context);
      }
      return context;
    },

    run(context){
      let result = context;

      for(const plugin of this.list()){
        if(!plugin.enabled || !plugin.run) continue;
        const next = plugin.run(result);
        if(next !== undefined) result = next;
      }

      return result;
    },

    collectSteps(){
      const steps = [];

      for(const plugin of this.list()){
        if(!plugin.enabled) continue;
        for(const step of plugin.steps){
          if(step && step.name && typeof step.run === "function"){
            steps.push(step);
          }
        }
      }

      return steps;
    },

    clear(){
      registry.clear();
    }
  };

  // Backward-compatible alias for existing 3.1 plugin files.
  global.BookiePluginManager = BookiePluginManager;
  global.Plugin = BookiePluginManager;
})(window);
