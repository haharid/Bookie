// Bookie 3.9.0 - Embedded Font Cleaner Step
(function(root){
  'use strict';
  const U = root.BookieOptimizerUtils || (typeof require === 'function' ? require('../optimizer-utils.js') : null);
  const FONT_EXTENSIONS = new Set(['ttf','otf','woff','woff2','eot','pfb','pfm']);

  function attr(tag, name){
    const match = String(tag).match(new RegExp(`\\b${name}\\s*=\\s*(["'])([^"']+)\\1`, 'i'));
    return match ? match[2] : '';
  }

  function stripFontFace(css){
    const source = String(css || '');
    let output = '';
    let i = 0;
    let removed = 0;
    while(i < source.length){
      const match = /@font-face\b/ig;
      match.lastIndex = i;
      const found = match.exec(source);
      if(!found){ output += source.slice(i); break; }
      output += source.slice(i, found.index);
      let p = match.lastIndex;
      while(p < source.length && /\s/.test(source[p])) p++;
      if(source[p] !== '{'){
        output += source.slice(found.index, match.lastIndex);
        i = match.lastIndex;
        continue;
      }
      let depth = 0;
      let quote = '';
      let comment = false;
      let escaped = false;
      let end = -1;
      for(let j = p; j < source.length; j++){
        const ch = source[j];
        const next = source[j + 1];
        if(comment){ if(ch === '*' && next === '/'){ comment = false; j++; } continue; }
        if(quote){
          if(escaped){ escaped = false; continue; }
          if(ch === '\\'){ escaped = true; continue; }
          if(ch === quote) quote = '';
          continue;
        }
        if(ch === '/' && next === '*'){ comment = true; j++; continue; }
        if(ch === '"' || ch === "'"){ quote = ch; continue; }
        if(ch === '{') depth++;
        else if(ch === '}'){
          depth--;
          if(depth === 0){ end = j + 1; break; }
        }
      }
      if(end < 0){ output += source.slice(found.index); break; }
      removed++;
      i = end;
    }
    return { css: output, removed };
  }

  const EmbeddedFontCleanerStep = {
    id: 'embedded-font-cleaner',
    async run(context){
      const fontPaths = Object.keys(context.zip.files || {})
        .filter(path => context.zip.files[path] && !context.zip.files[path].dir && FONT_EXTENSIONS.has(U.extension(path)))
        .sort();
      const fontPathSet = new Set(fontPaths);
      const fontIdsByOpf = new Map();
      let manifestItemsRemoved = 0;

      const opfPaths = Object.keys(context.zip.files || {}).filter(path => /\.opf$/i.test(path)).sort();
      for(const opfPath of opfPaths){
        const entry = context.zip.files[opfPath];
        if(!entry) continue;
        const before = await entry.async('string');
        const ids = new Set();
        const after = before.replace(/<item\b[^>]*>/gi, tag => {
          const href = attr(tag, 'href');
          const resolved = href ? U.resolvePath(opfPath, href) : null;
          const mediaType = attr(tag, 'media-type');
          const isFont = (resolved && (fontPathSet.has(resolved) || FONT_EXTENSIONS.has(U.extension(resolved)))) || /(?:font|application\/(?:vnd\.ms-opentype|x-font-))/i.test(mediaType);
          if(!isFont) return tag;
          const id = attr(tag, 'id');
          if(id) ids.add(id);
          manifestItemsRemoved++;
          return '';
        });
        if(ids.size) fontIdsByOpf.set(opfPath, ids);
        if(after !== before) context.zip.file(opfPath, after);
      }

      let fontFaceBlocksRemoved = 0;
      let cssFilesChanged = 0;
      const cssPaths = Object.keys(context.zip.files || {}).filter(path => /\.css$/i.test(path)).sort();
      for(const cssPath of cssPaths){
        const entry = context.zip.files[cssPath];
        if(!entry) continue;
        const before = await entry.async('string');
        const result = stripFontFace(before);
        if(result.removed > 0){
          context.zip.file(cssPath, result.css);
          fontFaceBlocksRemoved += result.removed;
          cssFilesChanged++;
        }
      }

      let removedFiles = 0;
      let savedBytes = 0;
      for(const path of fontPaths){
        const entry = context.zip.files[path];
        if(!entry) continue;
        const bytes = await entry.async('uint8array');
        savedBytes += bytes.byteLength;
        context.zip.remove(path);
        removedFiles++;
      }

      context.removedFontPaths = fontPathSet;
      context.report.fontFilesRemoved = removedFiles;
      context.report.fontSavedBytes = savedBytes;
      context.report.fontManifestItemsRemoved = manifestItemsRemoved;
      context.report.fontFaceBlocksRemoved = fontFaceBlocksRemoved;
      context.report.fontCssFilesChanged = cssFilesChanged;
      context.report.fontRemovedPaths = fontPaths;
      context.report.removedFiles += removedFiles;
      context.report.savedBytes += savedBytes;
      return context;
    },
    stripFontFace
  };

  root.EmbeddedFontCleanerStep = EmbeddedFontCleanerStep;
  if(typeof module !== 'undefined' && module.exports) module.exports = EmbeddedFontCleanerStep;
})(typeof globalThis !== 'undefined' ? globalThis : window);
