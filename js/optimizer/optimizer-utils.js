// Bookie 3.9.0 - EPUB Optimizer shared utilities
(function(root){
  'use strict';

  const RESOURCE_MIME = {
    jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', gif:'image/gif', webp:'image/webp', svg:'image/svg+xml',
    otf:'font/otf', ttf:'font/ttf', woff:'font/woff', woff2:'font/woff2',
    mp3:'audio/mpeg', m4a:'audio/mp4', ogg:'audio/ogg', wav:'audio/wav',
    mp4:'video/mp4', webm:'video/webm'
  };

  const TEXT_EXTENSIONS = new Set(['xhtml','html','htm','xml','opf','ncx','css','svg']);

  function normalizePath(value){
    const parts = String(value || '').replace(/\\/g, '/').split('/');
    const output = [];
    parts.forEach(part => {
      if(!part || part === '.') return;
      if(part === '..') output.pop();
      else output.push(part);
    });
    return output.join('/');
  }

  function dirname(value){
    const normalized = normalizePath(value);
    const index = normalized.lastIndexOf('/');
    return index < 0 ? '' : normalized.slice(0, index);
  }

  function basename(value){
    const normalized = normalizePath(value);
    const index = normalized.lastIndexOf('/');
    return index < 0 ? normalized : normalized.slice(index + 1);
  }

  function extension(value){
    const base = basename(value);
    const index = base.lastIndexOf('.');
    return index < 0 ? '' : base.slice(index + 1).toLowerCase();
  }

  function resolvePath(fromFile, target){
    const clean = String(target || '').split('#')[0].split('?')[0];
    if(!clean || /^(?:[a-z]+:|\/\/|#|data:)/i.test(clean)) return null;
    return normalizePath((dirname(fromFile) ? dirname(fromFile) + '/' : '') + clean);
  }

  function relativePath(fromFile, targetFile){
    const from = dirname(fromFile).split('/').filter(Boolean);
    const target = normalizePath(targetFile).split('/').filter(Boolean);
    let i = 0;
    while(i < from.length && i < target.length && from[i] === target[i]) i++;
    return '../'.repeat(from.length - i) + target.slice(i).join('/');
  }

  function splitSuffix(value){
    const match = String(value || '').match(/^([^?#]*)([?#].*)?$/);
    return { path: match ? match[1] : String(value || ''), suffix: match && match[2] ? match[2] : '' };
  }

  function isResource(path){
    return Object.prototype.hasOwnProperty.call(RESOURCE_MIME, extension(path));
  }

  function mediaType(path){
    return RESOURCE_MIME[extension(path)] || 'application/octet-stream';
  }

  function isTextFile(path){
    return TEXT_EXTENSIONS.has(extension(path));
  }

  function bytesToHex(bytes){
    return Array.from(bytes).map(v => v.toString(16).padStart(2, '0')).join('');
  }

  async function sha256(bytes){
    if(root.crypto && root.crypto.subtle){
      const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      return bytesToHex(new Uint8Array(await root.crypto.subtle.digest('SHA-256', buffer)));
    }
    if(typeof require === 'function'){
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(Buffer.from(bytes)).digest('hex');
    }
    throw new Error('SHA-256을 사용할 수 없는 환경입니다.');
  }

  function rewriteUrlValue(sourcePath, rawValue, replacementMap){
    const split = splitSuffix(rawValue);
    const absolute = resolvePath(sourcePath, split.path);
    if(!absolute || !replacementMap.has(absolute)) return rawValue;
    return relativePath(sourcePath, replacementMap.get(absolute)) + split.suffix;
  }

  function rewriteTextReferences(sourcePath, text, replacementMap){
    let output = String(text);
    output = output.replace(/\b(?:src|href|poster|xlink:href)\s*=\s*(["'])([^"']+)\1/gi, (full, quote, value) => {
      const rewritten = rewriteUrlValue(sourcePath, value, replacementMap);
      return full.replace(value, rewritten);
    });
    output = output.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (full, quote, value) => {
      const rewritten = rewriteUrlValue(sourcePath, value.trim(), replacementMap);
      return `url(${quote}${rewritten}${quote})`;
    });
    return output;
  }

  const api = {
    normalizePath, dirname, basename, extension, resolvePath, relativePath,
    isResource, mediaType, isTextFile, sha256, rewriteTextReferences
  };

  root.BookieOptimizerUtils = api;
  if(typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
