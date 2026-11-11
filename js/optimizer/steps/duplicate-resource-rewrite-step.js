// Bookie 3.9.0 - Duplicate Resource Reference Rewrite Step
(function(root){
  'use strict';
  const U = root.BookieOptimizerUtils || (typeof require === 'function' ? require('../optimizer-utils.js') : null);

  function rewriteOpf(opfPath, text, replacementMap){
    const duplicateIdToRepresentativeId = new Map();
    const representativeIdByPath = new Map();
    const items = [];

    text.replace(/<item\b[^>]*>/gi, tag => {
      const idMatch = tag.match(/\bid\s*=\s*(["'])([^"']+)\1/i);
      const hrefMatch = tag.match(/\bhref\s*=\s*(["'])([^"']+)\1/i);
      if(!idMatch || !hrefMatch) return tag;
      const path = U.resolvePath(opfPath, hrefMatch[2]);
      if(path) items.push({ tag, id:idMatch[2], path });
      return tag;
    });

    items.forEach(item => {
      if(!replacementMap.has(item.path)) representativeIdByPath.set(item.path, item.id);
    });
    items.forEach(item => {
      const representativePath = replacementMap.get(item.path);
      if(representativePath && representativeIdByPath.has(representativePath)){
        duplicateIdToRepresentativeId.set(item.id, representativeIdByPath.get(representativePath));
      }
    });

    let output = text.replace(/<item\b[^>]*>/gi, tag => {
      const hrefMatch = tag.match(/\bhref\s*=\s*(["'])([^"']+)\1/i);
      if(!hrefMatch) return tag;
      const path = U.resolvePath(opfPath, hrefMatch[2]);
      return path && replacementMap.has(path) ? '' : tag;
    });

    duplicateIdToRepresentativeId.forEach((representativeId, duplicateId) => {
      const escaped = duplicateId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      output = output.replace(new RegExp(`(\\b(?:idref|content)\\s*=\\s*["'])${escaped}(["'])`, 'g'), `$1${representativeId}$2`);
    });

    return U.rewriteTextReferences(opfPath, output, replacementMap);
  }

  const DuplicateResourceRewriteStep = {
    id: 'duplicate-resource-rewrite',
    async run(context){
      if(!context.replacementMap || !context.replacementMap.size) return context;
      let changedFiles = 0;
      const names = Object.keys(context.zip.files || {}).sort();
      for(const name of names){
        const entry = context.zip.files[name];
        if(!entry || entry.dir || !U.isTextFile(name)) continue;
        const before = await entry.async('string');
        const after = /\.opf$/i.test(name)
          ? rewriteOpf(name, before, context.replacementMap)
          : U.rewriteTextReferences(name, before, context.replacementMap);
        if(after !== before){
          context.zip.file(name, after);
          changedFiles++;
        }
      }
      context.report.rewrittenTextFiles = changedFiles;
      return context;
    }
  };

  root.DuplicateResourceRewriteStep = DuplicateResourceRewriteStep;
  if(typeof module !== 'undefined' && module.exports) module.exports = DuplicateResourceRewriteStep;
})(typeof globalThis !== 'undefined' ? globalThis : window);
