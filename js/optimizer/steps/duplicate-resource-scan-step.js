// Bookie 3.9.0 - Duplicate Resource Scan Step
(function(root){
  'use strict';
  const U = root.BookieOptimizerUtils || (typeof require === 'function' ? require('../optimizer-utils.js') : null);

  const DuplicateResourceScanStep = {
    id: 'duplicate-resource-scan',
    async run(context){
      const inventory = [];
      const names = Object.keys(context.zip.files || {}).sort();
      for(const name of names){
        const entry = context.zip.files[name];
        if(!entry || entry.dir || !U.isResource(name)) continue;
        const bytes = await entry.async('uint8array');
        inventory.push({
          path: U.normalizePath(name),
          size: bytes.byteLength,
          mediaType: U.mediaType(name),
          hash: await U.sha256(bytes)
        });
      }
      context.inventory = inventory;
      context.report.scannedResources = inventory.length;
      return context;
    }
  };

  root.DuplicateResourceScanStep = DuplicateResourceScanStep;
  if(typeof module !== 'undefined' && module.exports) module.exports = DuplicateResourceScanStep;
})(typeof globalThis !== 'undefined' ? globalThis : window);
