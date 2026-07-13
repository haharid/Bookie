// Bookie 3.9.0 - Conservative NAV / NCX Cleanup Step
(function(root){
  'use strict';
  const U = root.BookieOptimizerUtils || (typeof require === 'function' ? require('../optimizer-utils.js') : null);

  function getAttr(tag, name){
    const escaped = name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const match = String(tag).match(new RegExp('\\b' + escaped + '\\s*=\\s*(["\\\'])(.*?)\\1', 'i'));
    return match ? match[2] : '';
  }

  function stripTags(value){
    return String(value || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
  }

  function localTargetExists(sourcePath, href, zipFiles){
    const clean = String(href || '').split('#')[0].split('?')[0];
    if(!clean || /^(?:[a-z]+:|\/\/|data:|mailto:|tel:)/i.test(clean)) return true;
    const absolute = U.resolvePath(sourcePath, clean);
    return !!(absolute && zipFiles[absolute]);
  }

  function findBalancedElements(source, tagName){
    const re = new RegExp('<\\/?' + tagName + '\\b[^>]*>', 'gi');
    const output = [];
    let depth = 0, start = -1, match;
    while((match = re.exec(source))){
      const closing = /^<\//.test(match[0]);
      const selfClosing = /\/\s*>$/.test(match[0]);
      if(!closing){
        if(depth === 0) start = match.index;
        if(!selfClosing) depth++;
        else if(depth === 0) output.push({ start: match.index, end: re.lastIndex, text: match[0] });
      }else if(depth > 0){
        depth--;
        if(depth === 0 && start >= 0){
          output.push({ start, end: re.lastIndex, text: source.slice(start, re.lastIndex) });
          start = -1;
        }
      }
    }
    return output;
  }

  function directChildElements(container, tagName){
    const open = container.match(new RegExp('^<' + tagName + '\\b[^>]*>', 'i'));
    const close = container.match(new RegExp('</' + tagName + '\\s*>$', 'i'));
    const innerStart = open ? open[0].length : 0;
    const innerEnd = close ? container.length - close[0].length : container.length;
    const inner = container.slice(innerStart, innerEnd);
    return findBalancedElements(inner, tagName === 'ol' ? 'li' : 'navPoint').map(item => ({
      start: innerStart + item.start,
      end: innerStart + item.end,
      text: item.text
    }));
  }

  function replaceRanges(source, replacements){
    let output = source;
    replacements.slice().sort((a,b) => b.start - a.start).forEach(item => {
      output = output.slice(0, item.start) + item.text + output.slice(item.end);
    });
    return output;
  }

  function cleanNavOl(ol, navPath, zipFiles, totals){
    const children = directChildElements(ol, 'ol');
    const seen = new Set();
    const replacements = [];

    children.forEach(child => {
      let li = child.text;
      const nestedOls = findBalancedElements(li, 'ol');
      if(nestedOls.length){
        const nestedReplacements = nestedOls.map(item => ({
          start: item.start,
          end: item.end,
          text: cleanNavOl(item.text, navPath, zipFiles, totals)
        }));
        li = replaceRanges(li, nestedReplacements);
        li = li.replace(/<ol\b[^>]*>\s*<\/ol\s*>/gi, () => { totals.emptyContainersRemoved++; return ''; });
      }

      const anchor = li.match(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a\s*>/i);
      const href = anchor ? anchor[2] : '';
      const label = anchor ? stripTags(anchor[3]) : stripTags((li.match(/<(?:span|a)\b[^>]*>([\s\S]*?)<\/(?:span|a)\s*>/i) || [,''])[1]);
      const childCount = findBalancedElements(li, 'ol').length;

      if(href && !localTargetExists(navPath, href, zipFiles)){
        totals.missingTargetsRemoved++;
        replacements.push({ start: child.start, end: child.end, text: '' });
        return;
      }
      if(!label && childCount === 0){
        totals.emptyEntriesRemoved++;
        replacements.push({ start: child.start, end: child.end, text: '' });
        return;
      }
      const key = href ? href.split('?')[0] + '|' + label : '';
      if(key && seen.has(key)){
        totals.duplicateEntriesRemoved++;
        replacements.push({ start: child.start, end: child.end, text: '' });
        return;
      }
      if(key) seen.add(key);
      if(li !== child.text) replacements.push({ start: child.start, end: child.end, text: li });
    });

    return replaceRanges(ol, replacements);
  }

  function cleanNav(source, navPath, zipFiles){
    const totals = { missingTargetsRemoved:0, emptyEntriesRemoved:0, duplicateEntriesRemoved:0, emptyContainersRemoved:0 };
    let output = String(source);
    const navBlocks = findBalancedElements(output, 'nav');
    const replacements = [];
    navBlocks.forEach(block => {
      const openTag = (block.text.match(/^<nav\b[^>]*>/i) || [''])[0];
      const type = getAttr(openTag, 'epub:type') || getAttr(openTag, 'type');
      const role = getAttr(openTag, 'role');
      if(type && !/(?:^|\s)toc(?:\s|$)/i.test(type) && role !== 'doc-toc') return;
      const ols = findBalancedElements(block.text, 'ol');
      if(!ols.length) return;
      let cleaned = block.text;
      cleaned = replaceRanges(cleaned, ols.map(item => ({ start:item.start, end:item.end, text:cleanNavOl(item.text, navPath, zipFiles, totals) })));
      cleaned = cleaned.replace(/<ol\b[^>]*>\s*<\/ol\s*>/gi, () => { totals.emptyContainersRemoved++; return ''; });
      if(cleaned !== block.text) replacements.push({ start:block.start, end:block.end, text:cleaned });
    });
    output = replaceRanges(output, replacements);
    return Object.assign({ text: output }, totals);
  }

  function cleanNcxNavPoint(navPoint, ncxPath, zipFiles, totals){
    let point = navPoint;
    const open = point.match(/^<navPoint\b[^>]*>/i);
    const close = point.match(/<\/navPoint\s*>$/i);
    const innerStart = open ? open[0].length : 0;
    const innerEnd = close ? point.length - close[0].length : point.length;
    const inner = point.slice(innerStart, innerEnd);
    const nested = findBalancedElements(inner, 'navPoint');
    if(nested.length){
      point = replaceRanges(point, nested.map(item => ({
        start:innerStart + item.start, end:innerStart + item.end, text:cleanNcxNavPoint(item.text, ncxPath, zipFiles, totals)
      })));
    }
    const contentTag = (point.match(/<content\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1[^>]*\/?>/i) || []);
    const href = contentTag[2] || '';
    const labelMatch = point.match(/<navLabel\b[^>]*>[\s\S]*?<text\b[^>]*>([\s\S]*?)<\/text\s*>[\s\S]*?<\/navLabel\s*>/i);
    const label = labelMatch ? stripTags(labelMatch[1]) : '';
    const childCount = findBalancedElements(point.replace(/^<navPoint\b[^>]*>|<\/navPoint\s*>$/gi, ''), 'navPoint').length;
    if(href && !localTargetExists(ncxPath, href, zipFiles)){ totals.missingTargetsRemoved++; return ''; }
    if(!label && childCount === 0){ totals.emptyEntriesRemoved++; return ''; }
    return point;
  }

  function cleanNcx(source, ncxPath, zipFiles){
    const totals = { missingTargetsRemoved:0, emptyEntriesRemoved:0, duplicateEntriesRemoved:0, emptyContainersRemoved:0 };
    let output = String(source);
    const navMaps = findBalancedElements(output, 'navMap');
    output = replaceRanges(output, navMaps.map(map => {
      let cleaned = map.text;
      const points = directChildElements(map.text, 'navMap');
      const seen = new Set();
      const replacements = [];
      points.forEach(point => {
        const result = cleanNcxNavPoint(point.text, ncxPath, zipFiles, totals);
        if(!result){ replacements.push({start:point.start,end:point.end,text:''}); return; }
        const href = ((result.match(/<content\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1/i) || [])[2] || '');
        const label = stripTags(((result.match(/<navLabel\b[^>]*>[\s\S]*?<text\b[^>]*>([\s\S]*?)<\/text\s*>/i) || [])[1] || ''));
        const key = href ? href.split('?')[0] + '|' + label : '';
        if(key && seen.has(key)){ totals.duplicateEntriesRemoved++; replacements.push({start:point.start,end:point.end,text:''}); return; }
        if(key) seen.add(key);
        if(result !== point.text) replacements.push({start:point.start,end:point.end,text:result});
      });
      cleaned = replaceRanges(cleaned, replacements);
      return {start:map.start,end:map.end,text:cleaned};
    }));
    return Object.assign({ text: output }, totals);
  }

  const NavNcxCleanupStep = {
    id: 'nav-ncx-cleanup',
    cleanNav,
    cleanNcx,
    async run(context){
      let navScanned=0, navChanged=0, ncxScanned=0, ncxChanged=0;
      const totals = { missingTargetsRemoved:0, emptyEntriesRemoved:0, duplicateEntriesRemoved:0, emptyContainersRemoved:0 };
      const changedPaths = [];
      for(const [path, entry] of Object.entries(context.zip.files)){
        if(!entry || entry.dir) continue;
        const ext = U.extension(path);
        if(ext !== 'ncx' && ext !== 'xhtml' && ext !== 'html' && ext !== 'htm') continue;
        const before = await entry.async('string');
        let result = null;
        if(ext === 'ncx'){
          ncxScanned++;
          result = cleanNcx(before, path, context.zip.files);
          if(result.text !== before) ncxChanged++;
        }else if(/<nav\b[^>]*(?:epub:type\s*=\s*["'][^"']*toc|role\s*=\s*["']doc-toc)/i.test(before)){
          navScanned++;
          result = cleanNav(before, path, context.zip.files);
          if(result.text !== before) navChanged++;
        }
        if(!result) continue;
        Object.keys(totals).forEach(key => { totals[key] += result[key]; });
        if(result.text !== before){ context.zip.file(path, result.text); changedPaths.push(path); }
      }
      context.report.navFilesScanned = navScanned;
      context.report.navFilesChanged = navChanged;
      context.report.ncxFilesScanned = ncxScanned;
      context.report.ncxFilesChanged = ncxChanged;
      context.report.navNcxMissingTargetsRemoved = totals.missingTargetsRemoved;
      context.report.navNcxEmptyEntriesRemoved = totals.emptyEntriesRemoved;
      context.report.navNcxDuplicateEntriesRemoved = totals.duplicateEntriesRemoved;
      context.report.navNcxEmptyContainersRemoved = totals.emptyContainersRemoved;
      context.report.navNcxChangedPaths = changedPaths;
      return context;
    }
  };

  root.NavNcxCleanupStep = NavNcxCleanupStep;
  if(typeof module !== 'undefined' && module.exports) module.exports = NavNcxCleanupStep;
})(typeof globalThis !== 'undefined' ? globalThis : window);
