// Bookie 3.9.0 - Unused Resource Detect Step
(function(root){
  'use strict';
  const U = root.BookieOptimizerUtils || (typeof require === 'function' ? require('../optimizer-utils.js') : null);

  const UnusedResourceDetectStep = {
    id: 'unused-resource-detect',
    async run(context){
      const unused = [];
      const manifest = context.unusedManifest || new Map();
      const reachable = context.reachableResources || new Set();
      const targets = context.unusedTargetExtensions || new Set();

      manifest.forEach(item => {
        if(!context.zip.files[item.path]) return;
        if(reachable.has(item.path)) return;
        if(!targets.has(U.extension(item.path))) return;
        unused.push(item);
      });

      unused.sort((a,b) => a.path.localeCompare(b.path));
      context.unusedResources = unused;
      context.report.unusedCandidates = unused.length;
      return context;
    }
  };

  root.UnusedResourceDetectStep = UnusedResourceDetectStep;
  if(typeof module !== 'undefined' && module.exports) module.exports = UnusedResourceDetectStep;
})(typeof globalThis !== 'undefined' ? globalThis : window);
