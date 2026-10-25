// Bookie 3.9.0 - Duplicate Resource Remove Step
(function(root){
  'use strict';
  const DuplicateResourceRemoveStep = {
    id: 'duplicate-resource-remove',
    async run(context){
      let removed = 0;
      if(context.replacementMap){
        context.replacementMap.forEach((representative, duplicate) => {
          if(context.zip.files[duplicate]){
            context.zip.remove(duplicate);
            removed++;
          }
        });
      }
      context.report.removedFiles = removed;
      context.report.savedBytes = removed === context.report.duplicateFiles ? context.report.bytesEligible : 0;
      return context;
    }
  };
  root.DuplicateResourceRemoveStep = DuplicateResourceRemoveStep;
  if(typeof module !== 'undefined' && module.exports) module.exports = DuplicateResourceRemoveStep;
})(typeof globalThis !== 'undefined' ? globalThis : window);
