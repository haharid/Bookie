// Bookie 3.3.3 - Step Registry Dependency Upgrade
// Stores Step metadata and returns dependency-aware Step order.
// Rule: dependency ordering must preserve the existing default EPUB output.
(function(global){
  const registry = new Map();

  function toArray(value){
    if(!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  function normalizeId(value){
    return String(value || "").trim();
  }

  function normalize(step, order){
    if(!step || !step.name || typeof step.run !== "function"){
      throw new Error("BookieStepRegistry.register: invalid BookieStep");
    }

    const name = String(step.name).trim();
    if(!name){
      throw new Error("BookieStepRegistry.register: step.name is required");
    }

    const priority = Number.isFinite(step.priority)
      ? step.priority
      : (Number.isFinite(order) ? order : 100);

    if(!step.id){
      step.id = name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    }

    if(!Number.isFinite(step.priority)){
      step.priority = priority;
    }

    if(typeof step.enabled === "undefined"){
      step.enabled = true;
    }

    step.before = toArray(step.before).map(normalizeId).filter(Boolean);
    step.after = toArray(step.after).map(normalizeId).filter(Boolean);

    return Object.freeze({
      id: step.id,
      name,
      order: priority,
      priority,
      enabled: step.enabled !== false,
      step
    });
  }

  function getSortedItems(){
    return Array.from(registry.values())
      .sort((a, b)=>a.priority - b.priority || a.name.localeCompare(b.name));
  }

  function dependencySort(items){
    const byId = new Map();
    const byName = new Map();

    for(const item of items){
      byId.set(item.step.id, item);
      byName.set(item.name, item);
    }

    function findItem(ref){
      return byId.get(ref) || byName.get(ref) || null;
    }

    const edges = new Map();
    const indegree = new Map();

    for(const item of items){
      edges.set(item.step.id, new Set());
      indegree.set(item.step.id, 0);
    }

    function addEdge(fromItem, toItem){
      if(!fromItem || !toItem || fromItem.step.id === toItem.step.id) return;
      const fromId = fromItem.step.id;
      const toId = toItem.step.id;
      const set = edges.get(fromId);
      if(set && !set.has(toId)){
        set.add(toId);
        indegree.set(toId, (indegree.get(toId) || 0) + 1);
      }
    }

    for(const item of items){
      for(const ref of item.step.before || []){
        addEdge(item, findItem(ref));
      }

      for(const ref of item.step.after || []){
        addEdge(findItem(ref), item);
      }
    }

    const ordered = [];
    const queue = items.filter(item=>(indegree.get(item.step.id) || 0) === 0);

    while(queue.length){
      queue.sort((a, b)=>a.priority - b.priority || a.name.localeCompare(b.name));
      const item = queue.shift();
      ordered.push(item);

      for(const toId of edges.get(item.step.id) || []){
        indegree.set(toId, indegree.get(toId) - 1);
        if(indegree.get(toId) === 0){
          const next = byId.get(toId);
          if(next) queue.push(next);
        }
      }
    }

    if(ordered.length !== items.length){
      return items;
    }

    return ordered;
  }

  const BookieStepRegistry = {
    register(step, order){
      const item = normalize(step, order);
      registry.set(item.name, item);
      return item.step;
    },

    registerMany(items){
      for(const item of items){
        if(Array.isArray(item)){
          this.register(item[0], item[1]);
        } else if(item && item.step){
          this.register(item.step, item.order);
        } else {
          this.register(item);
        }
      }
      return this;
    },

    unregister(name){
      const key = String(name || "").trim();
      if(!key) return false;
      return registry.delete(key);
    },

    get(name){
      const key = String(name || "").trim();
      let item = registry.get(key);

      if(!item){
        item = Array.from(registry.values()).find(candidate=>candidate.step.id === key);
      }

      return item ? item.step : null;
    },

    has(name){
      return !!this.get(name);
    },

    list(){
      return dependencySort(getSortedItems()).map(item=>item.step);
    },

    describe(){
      return dependencySort(getSortedItems())
        .map(item=>({
          id: item.step.id,
          name: item.name,
          version: item.step.version || "",
          priority: item.priority,
          enabled: item.step.enabled !== false,
          before: item.step.before || [],
          after: item.step.after || []
        }));
    },

    validateDependencies(){
      const items = getSortedItems();
      const ids = new Set(items.map(item=>item.step.id));
      const names = new Set(items.map(item=>item.name));
      const warnings = [];

      for(const item of items){
        for(const ref of item.step.before || []){
          if(!ids.has(ref) && !names.has(ref)){
            warnings.push({
              step: item.step.id,
              type: "missing-before",
              target: ref
            });
          }
        }

        for(const ref of item.step.after || []){
          if(!ids.has(ref) && !names.has(ref)){
            warnings.push({
              step: item.step.id,
              type: "missing-after",
              target: ref
            });
          }
        }
      }

      return warnings;
    },

    applyTo(pipeline){
      if(!pipeline || typeof pipeline.add !== "function"){
        throw new Error("BookieStepRegistry.applyTo: pipeline.add is required");
      }

      for(const step of this.list()){
        pipeline.add(step);
      }

      return pipeline;
    },

    clear(){
      registry.clear();
    }
  };

  global.BookieStepRegistry = BookieStepRegistry;
})(window);
