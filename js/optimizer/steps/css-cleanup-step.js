// Bookie 3.9.0 - Conservative CSS Cleanup Step
(function(root){
  'use strict';

  function findClosingBrace(source, openIndex){
    let depth = 0;
    let quote = '';
    let comment = false;
    let escaped = false;
    for(let i = openIndex; i < source.length; i++){
      const ch = source[i];
      const next = source[i + 1];
      if(comment){
        if(ch === '*' && next === '/') { comment = false; i++; }
        continue;
      }
      if(quote){
        if(escaped){ escaped = false; continue; }
        if(ch === '\\'){ escaped = true; continue; }
        if(ch === quote) quote = '';
        continue;
      }
      if(ch === '/' && next === '*'){ comment = true; i++; continue; }
      if(ch === '"' || ch === "'"){ quote = ch; continue; }
      if(ch === '{') depth++;
      else if(ch === '}'){
        depth--;
        if(depth === 0) return i;
      }
    }
    return -1;
  }

  function hasTopLevelBrace(source){
    let quote = '';
    let comment = false;
    let escaped = false;
    let paren = 0;
    let bracket = 0;
    for(let i = 0; i < source.length; i++){
      const ch = source[i];
      const next = source[i + 1];
      if(comment){
        if(ch === '*' && next === '/') { comment = false; i++; }
        continue;
      }
      if(quote){
        if(escaped){ escaped = false; continue; }
        if(ch === '\\'){ escaped = true; continue; }
        if(ch === quote) quote = '';
        continue;
      }
      if(ch === '/' && next === '*'){ comment = true; i++; continue; }
      if(ch === '"' || ch === "'"){ quote = ch; continue; }
      if(ch === '(') paren++;
      else if(ch === ')' && paren > 0) paren--;
      else if(ch === '[') bracket++;
      else if(ch === ']' && bracket > 0) bracket--;
      else if(ch === '{' && paren === 0 && bracket === 0) return true;
    }
    return false;
  }

  function splitDeclarations(source){
    const chunks = [];
    let start = 0;
    let quote = '';
    let comment = false;
    let escaped = false;
    let paren = 0;
    let bracket = 0;
    for(let i = 0; i < source.length; i++){
      const ch = source[i];
      const next = source[i + 1];
      if(comment){
        if(ch === '*' && next === '/') { comment = false; i++; }
        continue;
      }
      if(quote){
        if(escaped){ escaped = false; continue; }
        if(ch === '\\'){ escaped = true; continue; }
        if(ch === quote) quote = '';
        continue;
      }
      if(ch === '/' && next === '*'){ comment = true; i++; continue; }
      if(ch === '"' || ch === "'"){ quote = ch; continue; }
      if(ch === '(') paren++;
      else if(ch === ')' && paren > 0) paren--;
      else if(ch === '[') bracket++;
      else if(ch === ']' && bracket > 0) bracket--;
      else if(ch === ';' && paren === 0 && bracket === 0){
        chunks.push({ text: source.slice(start, i), delimiter: ';' });
        start = i + 1;
      }
    }
    chunks.push({ text: source.slice(start), delimiter: '' });
    return chunks;
  }

  function cleanDeclarations(source){
    if(hasTopLevelBrace(source)) return { css: source, duplicatesRemoved: 0 };
    const chunks = splitDeclarations(source);
    const lastIndex = new Map();
    chunks.forEach((chunk, index) => {
      const key = chunk.text.trim();
      if(key) lastIndex.set(key, index);
    });
    let duplicatesRemoved = 0;
    let css = '';
    chunks.forEach((chunk, index) => {
      const key = chunk.text.trim();
      if(key && lastIndex.get(key) !== index){
        duplicatesRemoved++;
        return;
      }
      css += chunk.text + chunk.delimiter;
    });
    return { css, duplicatesRemoved };
  }

  function isEffectivelyEmpty(source){
    return String(source)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/[;\s]/g, '') === '';
  }

  function isRuleContainer(header){
    return /^@(media|supports|layer|container|document|scope)\b/i.test(header.trim());
  }

  function cleanStylesheet(source){
    const css = String(source || '');
    let output = '';
    let cursor = 0;
    let segmentStart = 0;
    let quote = '';
    let comment = false;
    let escaped = false;
    let emptyRulesRemoved = 0;
    let duplicateDeclarationsRemoved = 0;

    for(let i = 0; i < css.length; i++){
      const ch = css[i];
      const next = css[i + 1];
      if(comment){
        if(ch === '*' && next === '/') { comment = false; i++; }
        continue;
      }
      if(quote){
        if(escaped){ escaped = false; continue; }
        if(ch === '\\'){ escaped = true; continue; }
        if(ch === quote) quote = '';
        continue;
      }
      if(ch === '/' && next === '*'){ comment = true; i++; continue; }
      if(ch === '"' || ch === "'"){ quote = ch; continue; }
      if(ch === ';') segmentStart = i + 1;
      if(ch !== '{') continue;

      const close = findClosingBrace(css, i);
      if(close < 0) break;
      const header = css.slice(segmentStart, i).trim();
      const body = css.slice(i + 1, close);
      output += css.slice(cursor, segmentStart);

      if(header.startsWith('@')){
        if(isRuleContainer(header)){
          const nested = cleanStylesheet(body);
          output += css.slice(segmentStart, i + 1) + nested.css + '}';
          emptyRulesRemoved += nested.emptyRulesRemoved;
          duplicateDeclarationsRemoved += nested.duplicateDeclarationsRemoved;
        }else{
          output += css.slice(segmentStart, close + 1);
        }
      }else{
        const cleaned = cleanDeclarations(body);
        duplicateDeclarationsRemoved += cleaned.duplicatesRemoved;
        if(isEffectivelyEmpty(cleaned.css)){
          emptyRulesRemoved++;
        }else{
          output += css.slice(segmentStart, i + 1) + cleaned.css + '}';
        }
      }

      cursor = close + 1;
      segmentStart = cursor;
      i = close;
    }

    output += css.slice(cursor);
    return { css: output, emptyRulesRemoved, duplicateDeclarationsRemoved };
  }

  const CssCleanupStep = {
    id: 'css-cleanup',
    async run(context){
      let filesChanged = 0;
      let emptyRulesRemoved = 0;
      let duplicateDeclarationsRemoved = 0;
      const changedPaths = [];
      const paths = Object.keys(context.zip.files || {})
        .filter(path => context.zip.files[path] && !context.zip.files[path].dir && /\.css$/i.test(path))
        .sort();

      for(const path of paths){
        const entry = context.zip.files[path];
        const before = await entry.async('string');
        const result = cleanStylesheet(before);
        if(result.css !== before){
          context.zip.file(path, result.css);
          filesChanged++;
          changedPaths.push(path);
        }
        emptyRulesRemoved += result.emptyRulesRemoved;
        duplicateDeclarationsRemoved += result.duplicateDeclarationsRemoved;
      }

      context.report.cssFilesScanned = paths.length;
      context.report.cssFilesChanged = filesChanged;
      context.report.cssEmptyRulesRemoved = emptyRulesRemoved;
      context.report.cssDuplicateDeclarationsRemoved = duplicateDeclarationsRemoved;
      context.report.cssChangedPaths = changedPaths;
      return context;
    },
    cleanStylesheet,
    cleanDeclarations
  };

  root.CssCleanupStep = CssCleanupStep;
  if(typeof module !== 'undefined' && module.exports) module.exports = CssCleanupStep;
})(typeof globalThis !== 'undefined' ? globalThis : window);
