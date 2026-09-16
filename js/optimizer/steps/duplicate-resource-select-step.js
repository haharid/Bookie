// Bookie 3.9.0 - Duplicate Resource Representative Step
(function(root){
  'use strict';
  const U = root.BookieOptimizerUtils || (typeof require === 'function' ? require('../optimizer-utils.js') : null);

  function rank(item, manifestOrder){
    const base = U.basename(item.path).toLowerCase();
    const cover = /(?:^|[-_.])(cover|coverimg|front)(?:[-_.]|$)/.test(base) ? 0 : 1;
    const order = manifestOrder.has(item.path) ? manifestOrder.get(item.path) : Number.MAX_SAFE_INTEGER;
    return [cover, order, item.path.length, item.path];
  }

  function compareRank(a, b, manifestOrder){
    const ar = rank(a, manifestOrder);
    const br = rank(b, manifestOrder);
    for(let i=0;i<ar.length;i++){
      if(ar[i] < br[i]) return -1;
      if(ar[i] > br[i]) return 1;
    }
    return 0;
  }

  const DuplicateResourceSelectStep = {
    id: 'duplicate-resource-select',
    async run(context){
      const manifestOrder = new Map();
      const opfNames = Object.keys(context.zip.files || {}).filter(name => /\.opf$/i.test(name)).sort();
      for(const opfName of opfNames){
        const text = await context.zip.files[opfName].async('string');
        let index = 0;
        text.replace(/<item\b[^>]*\bhref\s*=\s*(["'])([^"']+)\1[^>]*>/gi, (full, quote, href) => {
          const resolved = U.resolvePath(opfName, href);
          if(resolved && !manifestOrder.has(resolved)) manifestOrder.set(resolved, index++);
          return full;
        });
      }

      const groups = new Map();
      (context.inventory || []).forEach(item => {
        const key = `${item.mediaType}|${item.size}|${item.hash}`;
        if(!groups.has(key)) groups.set(key, []);
        groups.get(key).push(item);
      });

      context.duplicateGroups = [];
      context.replacementMap = new Map();
      groups.forEach(items => {
        if(items.length < 2) return;
        const sorted = items.slice().sort((a,b) => compareRank(a,b,manifestOrder));
        const representative = sorted[0];
        const duplicates = sorted.slice(1);
        duplicates.forEach(item => context.replacementMap.set(item.path, representative.path));
        context.duplicateGroups.push({ representative, duplicates });
      });

      context.report.duplicateGroups = context.duplicateGroups.length;
      context.report.duplicateFiles = context.replacementMap.size;
      context.report.bytesEligible = context.duplicateGroups.reduce((sum, group) =>
        sum + group.duplicates.reduce((inner, item) => inner + item.size, 0), 0);
      return context;
    }
  };

  root.DuplicateResourceSelectStep = DuplicateResourceSelectStep;
  if(typeof module !== 'undefined' && module.exports) module.exports = DuplicateResourceSelectStep;
})(typeof globalThis !== 'undefined' ? globalThis : window);
