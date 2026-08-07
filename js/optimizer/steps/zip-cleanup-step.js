// Bookie 3.9.0 - ZIP Cleanup Step
(function(root){
  'use strict';
  const U = root.BookieOptimizerUtils || (typeof require === 'function' ? require('../optimizer-utils.js') : null);

  const FINAL_JUNK_NAMES = new Set(['.ds_store','thumbs.db','desktop.ini']);

  function isFinalJunk(path){
    const normalized = U.normalizePath(path);
    const base = U.basename(normalized).toLowerCase();
    if(normalized.split('/').some(part => part.toLowerCase() === '__macosx')) return true;
    return FINAL_JUNK_NAMES.has(base);
  }

  const ZipCleanupStep = {
    id: 'zip-cleanup',
    async run(context){
      const zip = context.zip;
      let directoryEntriesRemoved = 0;
      let junkFilesRemoved = 0;
      let savedBytes = 0;
      const removedPaths = [];

      for(const path of Object.keys(zip.files || {})){
        const entry = zip.files[path];
        if(!entry) continue;
        // JSZip.remove('folder/') recursively removes every file inside the folder.
        // Directory entries are harmless, so never remove them during EPUB cleanup.
        if(entry.dir || /\/$/.test(path)){
          continue;
        }
        if(isFinalJunk(path)){
          try{
            const bytes = await entry.async('uint8array');
            savedBytes += bytes.byteLength;
          }catch(error){}
          zip.remove(path);
          junkFilesRemoved++;
          removedPaths.push(path);
        }
      }

      const mimetype = zip.file('mimetype');
      if(!mimetype){
        context.report.warn('ZIP에 mimetype 파일이 없습니다. Validator 단계에서 확인이 필요합니다.');
      }else{
        try{
          const value = (await mimetype.async('string')).trim();
          if(value !== 'application/epub+zip'){
            context.report.warn('mimetype 내용이 application/epub+zip과 다릅니다.');
          }
        }catch(error){
          context.report.warn('mimetype 내용을 확인하지 못했습니다.');
        }
      }

      context.report.zipDirectoryEntriesRemoved = directoryEntriesRemoved;
      context.report.zipJunkFilesRemoved = junkFilesRemoved;
      context.report.zipSavedBytes = savedBytes;
      context.report.zipRemovedPaths = removedPaths;
      context.report.removedFiles += junkFilesRemoved;
      context.report.savedBytes += savedBytes;
      return context;
    },
    isFinalJunk
  };

  root.ZipCleanupStep = ZipCleanupStep;
  if(typeof module !== 'undefined' && module.exports) module.exports = ZipCleanupStep;
})(typeof globalThis !== 'undefined' ? globalThis : window);
