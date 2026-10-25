// Bookie 3.9.0 - Metadata Junk Cleaner Step
(function(root){
  'use strict';
  const U = root.BookieOptimizerUtils || (typeof require === 'function' ? require('../optimizer-utils.js') : null);
  const FONT_EXTENSIONS = new Set(['ttf','otf','woff','woff2','eot','pfb','pfm']);

  function isKnownJunk(path){
    const normalized = U.normalizePath(path);
    const base = U.basename(normalized).toLowerCase();
    if(normalized.split('/').some(part => part.toLowerCase() === '__macosx')) return true;
    if(base === '.ds_store' || base === 'thumbs.db' || base === 'desktop.ini') return true;
    if(base === 'itunesmetadata.plist') return true;
    if(normalized.toLowerCase() === 'meta-inf/com.apple.ibooks.display-options.xml') return true;
    return false;
  }

  function encryptionBlockReferencesFont(encryptionPath, block){
    let font = false;
    String(block).replace(/<CipherReference\b[^>]*\bURI\s*=\s*(["'])([^"']+)\1[^>]*\/?\s*>/gi, (full, quote, uri) => {
      const resolved = U.resolvePath(encryptionPath, uri);
      if(resolved && FONT_EXTENSIONS.has(U.extension(resolved))) font = true;
      return full;
    });
    return font;
  }

  const MetadataJunkCleanerStep = {
    id: 'metadata-junk-cleaner',
    async run(context){
      let removedFiles = 0;
      let savedBytes = 0;
      const removedPaths = [];

      const encryptionPaths = Object.keys(context.zip.files || {}).filter(path => /(?:^|\/)encryption\.xml$/i.test(path)).sort();
      for(const encryptionPath of encryptionPaths){
        const entry = context.zip.files[encryptionPath];
        if(!entry) continue;
        const before = await entry.async('string');
        let removedEntries = 0;
        const after = before.replace(/<EncryptedData\b[\s\S]*?<\/EncryptedData\s*>/gi, block => {
          if(encryptionBlockReferencesFont(encryptionPath, block)){
            removedEntries++;
            return '';
          }
          return block;
        });
        if(removedEntries > 0){
          if(!/<EncryptedData\b/i.test(after)){
            const bytes = await entry.async('uint8array');
            savedBytes += bytes.byteLength;
            context.zip.remove(encryptionPath);
            removedFiles++;
            removedPaths.push(encryptionPath);
          }else{
            context.zip.file(encryptionPath, after);
          }
          context.report.fontEncryptionEntriesRemoved += removedEntries;
        }
      }

      const paths = Object.keys(context.zip.files || {}).sort();
      for(const path of paths){
        const entry = context.zip.files[path];
        if(!entry || entry.dir || !isKnownJunk(path)) continue;
        const bytes = await entry.async('uint8array');
        savedBytes += bytes.byteLength;
        context.zip.remove(path);
        removedFiles++;
        removedPaths.push(path);
      }

      context.report.junkFilesRemoved = removedFiles;
      context.report.junkSavedBytes = savedBytes;
      context.report.junkRemovedPaths = removedPaths;
      context.report.removedFiles += removedFiles;
      context.report.savedBytes += savedBytes;
      return context;
    },
    isKnownJunk
  };

  root.MetadataJunkCleanerStep = MetadataJunkCleanerStep;
  if(typeof module !== 'undefined' && module.exports) module.exports = MetadataJunkCleanerStep;
})(typeof globalThis !== 'undefined' ? globalThis : window);
