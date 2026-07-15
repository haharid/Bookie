// Bookie 3.9.0 - Unused Resource Reachability Collect Step
(function(root){
  'use strict';
  const U = root.BookieOptimizerUtils || (typeof require === 'function' ? require('../optimizer-utils.js') : null);

  const TARGET_EXTENSIONS = new Set([
    'jpg','jpeg','png','gif','webp','svg',
    'otf','ttf','woff','woff2',
    'mp3','m4a','ogg','wav','mp4','webm',
    'css'
  ]);

  function attr(tag, name){
    const match = String(tag).match(new RegExp(`\\b${name}\\s*=\\s*(["'])([^"']+)\\1`, 'i'));
    return match ? match[2] : '';
  }

  function collectTextReferences(sourcePath, text){
    const refs = [];
    const push = value => {
      const resolved = U.resolvePath(sourcePath, value);
      if(resolved) refs.push(resolved);
    };
    String(text).replace(/\b(?:src|href|poster|xlink:href)\s*=\s*(["'])([^"']+)\1/gi, (full, quote, value) => {
      push(value);
      return full;
    });
    String(text).replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (full, quote, value) => {
      push(value.trim());
      return full;
    });
    return refs;
  }

  const UnusedResourceCollectStep = {
    id: 'unused-resource-collect',
    async run(context){
      const manifestByPath = new Map();
      const manifestById = new Map();
      const roots = new Set();
      const opfPaths = Object.keys(context.zip.files || {}).filter(name => /\.opf$/i.test(name)).sort();

      for(const opfPath of opfPaths){
        const opf = await context.zip.files[opfPath].async('string');
        opf.replace(/<item\b[^>]*>/gi, tag => {
          const id = attr(tag, 'id');
          const href = attr(tag, 'href');
          if(!id || !href) return tag;
          const path = U.resolvePath(opfPath, href);
          if(!path) return tag;
          const item = {
            id,
            path,
            mediaType: attr(tag, 'media-type'),
            properties: attr(tag, 'properties'),
            fallback: attr(tag, 'fallback'),
            mediaOverlay: attr(tag, 'media-overlay'),
            opfPath
          };
          manifestByPath.set(path, item);
          manifestById.set(id, item);
          if(/(?:^|\s)(?:nav|cover-image)(?:\s|$)/i.test(item.properties)) roots.add(path);
          if(/application\/x-dtbncx\+xml/i.test(item.mediaType)) roots.add(path);
          return tag;
        });

        opf.replace(/<itemref\b[^>]*\bidref\s*=\s*(["'])([^"']+)\1[^>]*>/gi, (full, quote, idref) => {
          const item = manifestById.get(idref);
          if(item) roots.add(item.path);
          return full;
        });
        opf.replace(/<meta\b[^>]*\bname\s*=\s*(["'])cover\1[^>]*\bcontent\s*=\s*(["'])([^"']+)\2[^>]*>/gi, (full, q1, q2, id) => {
          const item = manifestById.get(id);
          if(item) roots.add(item.path);
          return full;
        });
        opf.replace(/<reference\b[^>]*\bhref\s*=\s*(["'])([^"']+)\1[^>]*>/gi, (full, quote, href) => {
          const path = U.resolvePath(opfPath, href);
          if(path) roots.add(path);
          return full;
        });
      }

      manifestByPath.forEach(item => {
        [item.fallback, item.mediaOverlay].forEach(id => {
          const linked = id && manifestById.get(id);
          if(linked) roots.add(linked.path);
        });
      });

      const reachable = new Set();
      const queue = Array.from(roots);
      while(queue.length){
        const current = queue.shift();
        if(!current || reachable.has(current)) continue;
        reachable.add(current);
        const entry = context.zip.files[current];
        if(!entry || entry.dir || !U.isTextFile(current)) continue;
        const text = await entry.async('string');
        collectTextReferences(current, text).forEach(ref => {
          if(context.zip.files[ref] && !reachable.has(ref)) queue.push(ref);
        });
      }

      context.unusedManifest = manifestByPath;
      context.reachableResources = reachable;
      context.unusedTargetExtensions = TARGET_EXTENSIONS;
      context.report.manifestResources = manifestByPath.size;
      context.report.reachableResources = reachable.size;
      return context;
    }
  };

  root.UnusedResourceCollectStep = UnusedResourceCollectStep;
  if(typeof module !== 'undefined' && module.exports) module.exports = UnusedResourceCollectStep;
})(typeof globalThis !== 'undefined' ? globalThis : window);
