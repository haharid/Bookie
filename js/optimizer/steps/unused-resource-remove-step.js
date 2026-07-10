// Bookie 3.9.0 - Unused Resource Remove Step
(function(root){
  'use strict';
  const U = root.BookieOptimizerUtils || (typeof require === 'function' ? require('../optimizer-utils.js') : null);

  function escapeRegExp(value){ return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  const UnusedResourceRemoveStep = {
    id: 'unused-resource-remove',
    async run(context){
      const unused = context.unusedResources || [];
      if(!unused.length) return context;

      const byOpf = new Map();
      unused.forEach(item => {
        if(!byOpf.has(item.opfPath)) byOpf.set(item.opfPath, []);
        byOpf.get(item.opfPath).push(item);
      });

      let manifestItemsRemoved = 0;
      for(const [opfPath, items] of byOpf.entries()){
        const entry = context.zip.files[opfPath];
        if(!entry) continue;
        const before = await entry.async('string');
        const unusedIds = new Set(items.map(item => item.id));
        const after = before.replace(/<item\b[^>]*>/gi, tag => {
          const idMatch = tag.match(/\bid\s*=\s*(["'])([^"']+)\1/i);
          if(idMatch && unusedIds.has(idMatch[2])){
            manifestItemsRemoved++;
            return '';
          }
          return tag;
        });
        if(after !== before) context.zip.file(opfPath, after);
      }

      let removed = 0;
      let savedBytes = 0;
      const removedPaths = [];
      for(const item of unused){
        const entry = context.zip.files[item.path];
        if(!entry) continue;
        const bytes = await entry.async('uint8array');
        savedBytes += bytes.byteLength;
        context.zip.remove(item.path);
        removed++;
        removedPaths.push(item.path);
      }

      context.report.unusedRemovedFiles = removed;
      context.report.unusedSavedBytes = savedBytes;
      context.report.unusedManifestItemsRemoved = manifestItemsRemoved;
      context.report.unusedRemovedPaths = removedPaths;
      context.report.removedFiles += removed;
      context.report.savedBytes += savedBytes;
      return context;
    }
  };

  root.UnusedResourceRemoveStep = UnusedResourceRemoveStep;
  if(typeof module !== 'undefined' && module.exports) module.exports = UnusedResourceRemoveStep;
})(typeof globalThis !== 'undefined' ? globalThis : window);
