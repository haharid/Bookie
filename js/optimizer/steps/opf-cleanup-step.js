// Bookie 3.9.0 - Conservative OPF Cleanup Step
(function(root){
  'use strict';
  const U = root.BookieOptimizerUtils || (typeof require === 'function' ? require('../optimizer-utils.js') : null);

  function getAttr(tag, name){
    const match = String(tag).match(new RegExp('\\b' + name.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\$&') + '\\s*=\\s*(["\\\'])(.*?)\\1', 'i'));
    return match ? match[2] : '';
  }

  function setAttrReferences(opf, oldId, newId){
    const escaped = oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const names = ['idref', 'content', 'fallback', 'media-overlay', 'toc'];
    let output = opf;
    names.forEach(name => {
      const re = new RegExp('(\\b' + name + '\\s*=\\s*["\\\'])' + escaped + '(["\\\'])', 'gi');
      output = output.replace(re, '$1' + newId + '$2');
    });
    return output;
  }

  function removeExactDuplicateMetadata(opf){
    const sectionMatch = opf.match(/<metadata\b[^>]*>[\s\S]*?<\/metadata\s*>/i);
    if(!sectionMatch) return { opf, removed: 0 };
    const section = sectionMatch[0];
    const seen = new Set();
    let removed = 0;
    const cleaned = section.replace(/<((?:dc:)?(?:title|creator|language|publisher|date|rights|subject|description|contributor|type|format|source|relation|coverage))\b([^>]*)>([\s\S]*?)<\/\1\s*>/gi,
      (full, name, attrs, value) => {
        const key = name.toLowerCase() + '|' + attrs.trim().replace(/\s+/g, ' ') + '|' + value.trim();
        if(seen.has(key)){ removed++; return ''; }
        seen.add(key);
        return full;
      });
    return { opf: opf.replace(section, cleaned), removed };
  }

  function cleanupManifest(opf, opfPath, zipFiles){
    const manifestMatch = opf.match(/<manifest\b[^>]*>[\s\S]*?<\/manifest\s*>/i);
    if(!manifestMatch) return { opf, duplicateItemsRemoved: 0, missingItemsRemoved: 0, idRewrites: 0 };
    const section = manifestMatch[0];
    const items = [];
    section.replace(/<item\b[^>]*\/?\s*>/gi, tag => {
      items.push({
        tag,
        id: getAttr(tag, 'id'),
        href: getAttr(tag, 'href'),
        mediaType: getAttr(tag, 'media-type'),
        properties: getAttr(tag, 'properties'),
        fallback: getAttr(tag, 'fallback'),
        mediaOverlay: getAttr(tag, 'media-overlay')
      });
      return tag;
    });

    const opfDir = U.dirname(opfPath);
    const seen = new Map();
    const removeTags = new Set();
    const replacements = [];
    let duplicateItemsRemoved = 0;
    let missingItemsRemoved = 0;

    items.forEach(item => {
      if(!item.id || !item.href) return;
      const hrefPath = item.href.split('#')[0].split('?')[0];
      if(!hrefPath || /^(?:[a-z]+:|\/\/|data:)/i.test(hrefPath)) return;
      const absolute = U.normalizePath((opfDir ? opfDir + '/' : '') + hrefPath);
      const key = [absolute, item.mediaType, item.properties, item.fallback, item.mediaOverlay].join('|');
      if(seen.has(key)){
        const kept = seen.get(key);
        removeTags.add(item.tag);
        replacements.push([item.id, kept.id]);
        duplicateItemsRemoved++;
        return;
      }
      seen.set(key, item);

      if(!zipFiles[absolute]){
        removeTags.add(item.tag);
        missingItemsRemoved++;
      }
    });

    let cleanedSection = section;
    removeTags.forEach(tag => { cleanedSection = cleanedSection.replace(tag, ''); });
    let output = opf.replace(section, cleanedSection);
    replacements.forEach(([oldId, newId]) => { output = setAttrReferences(output, oldId, newId); });
    return { opf: output, duplicateItemsRemoved, missingItemsRemoved, idRewrites: replacements.length };
  }

  function collectManifestIds(opf){
    const ids = new Set();
    const manifestMatch = opf.match(/<manifest\b[^>]*>[\s\S]*?<\/manifest\s*>/i);
    if(!manifestMatch) return ids;
    manifestMatch[0].replace(/<item\b[^>]*>/gi, tag => {
      const id = getAttr(tag, 'id');
      if(id) ids.add(id);
      return tag;
    });
    return ids;
  }

  function removeDanglingSpineAndCover(opf){
    const manifestIds = collectManifestIds(opf);
    let spineItemsRemoved = 0;
    let coverMetaRemoved = 0;
    let output = opf.replace(/<itemref\b[^>]*\/?\s*>/gi, tag => {
      const idref = getAttr(tag, 'idref');
      if(idref && !manifestIds.has(idref)){ spineItemsRemoved++; return ''; }
      return tag;
    });
    output = output.replace(/<meta\b[^>]*\bname\s*=\s*(["'])cover\1[^>]*\/?\s*>/gi, tag => {
      const content = getAttr(tag, 'content');
      if(content && !manifestIds.has(content)){ coverMetaRemoved++; return ''; }
      return tag;
    });
    return { opf: output, spineItemsRemoved, coverMetaRemoved };
  }

  function cleanupGuide(opf, opfPath, zipFiles){
    let guideReferencesRemoved = 0;
    const opfDir = U.dirname(opfPath);
    const output = opf.replace(/<reference\b[^>]*\/?\s*>/gi, tag => {
      const href = getAttr(tag, 'href');
      const clean = href.split('#')[0].split('?')[0];
      if(!clean || /^(?:[a-z]+:|\/\/|data:)/i.test(clean)) return tag;
      const absolute = U.normalizePath((opfDir ? opfDir + '/' : '') + clean);
      if(!zipFiles[absolute]){ guideReferencesRemoved++; return ''; }
      return tag;
    });
    return { opf: output, guideReferencesRemoved };
  }

  function cleanOpf(source, opfPath, zipFiles){
    let output = String(source);
    const metadata = removeExactDuplicateMetadata(output); output = metadata.opf;
    const manifest = cleanupManifest(output, opfPath, zipFiles); output = manifest.opf;
    const dangling = removeDanglingSpineAndCover(output); output = dangling.opf;
    const guide = cleanupGuide(output, opfPath, zipFiles); output = guide.opf;
    return {
      opf: output,
      metadataDuplicatesRemoved: metadata.removed,
      duplicateManifestItemsRemoved: manifest.duplicateItemsRemoved,
      missingManifestItemsRemoved: manifest.missingItemsRemoved,
      manifestIdReferencesRewritten: manifest.idRewrites,
      danglingSpineItemsRemoved: dangling.spineItemsRemoved,
      danglingCoverMetaRemoved: dangling.coverMetaRemoved,
      danglingGuideReferencesRemoved: guide.guideReferencesRemoved
    };
  }

  const OpfCleanupStep = {
    id: 'opf-cleanup',
    cleanOpf,
    async run(context){
      let scanned = 0, changed = 0;
      const totals = {
        metadataDuplicatesRemoved: 0,
        duplicateManifestItemsRemoved: 0,
        missingManifestItemsRemoved: 0,
        manifestIdReferencesRewritten: 0,
        danglingSpineItemsRemoved: 0,
        danglingCoverMetaRemoved: 0,
        danglingGuideReferencesRemoved: 0
      };
      const changedPaths = [];
      for(const [path, entry] of Object.entries(context.zip.files)){
        if(entry.dir || U.extension(path) !== 'opf') continue;
        scanned++;
        const before = await entry.async('string');
        const result = cleanOpf(before, path, context.zip.files);
        Object.keys(totals).forEach(key => { totals[key] += result[key]; });
        if(result.opf !== before){
          context.zip.file(path, result.opf);
          changed++;
          changedPaths.push(path);
        }
      }
      context.report.opfFilesScanned = scanned;
      context.report.opfFilesChanged = changed;
      Object.assign(context.report, Object.fromEntries(Object.entries(totals).map(([k,v]) => ['opf' + k[0].toUpperCase() + k.slice(1), v])));
      context.report.opfChangedPaths = changedPaths;
      return context;
    }
  };

  root.OpfCleanupStep = OpfCleanupStep;
  if(typeof module !== 'undefined' && module.exports) module.exports = OpfCleanupStep;
})(typeof globalThis !== 'undefined' ? globalThis : window);
