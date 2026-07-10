// Bookie 3.9.0 - Optimizer Report Finalizer Step
(function(root){
  'use strict';
  const U = root.BookieOptimizerUtils || (typeof require === 'function' ? require('../optimizer-utils.js') : null);

  function category(path){
    const ext = U.extension(path);
    if(['xhtml','html','htm'].includes(ext)) return 'html';
    if(ext === 'css') return 'css';
    if(['jpg','jpeg','png','gif','webp','svg','avif'].includes(ext)) return 'images';
    if(['ttf','otf','woff','woff2','eot','pfb','pfm'].includes(ext)) return 'fonts';
    if(['mp3','m4a','aac','ogg','wav'].includes(ext)) return 'audio';
    if(['mp4','m4v','webm'].includes(ext)) return 'video';
    return 'other';
  }

  async function snapshot(zip){
    const counts = { total:0, html:0, css:0, images:0, fonts:0, audio:0, video:0, other:0 };
    let bytes = 0;
    for(const [path, entry] of Object.entries(zip.files || {})){
      if(!entry || entry.dir || /\/$/.test(path)) continue;
      counts.total++;
      counts[category(path)]++;
      try{ bytes += (await entry.async('uint8array')).byteLength; }catch(error){}
    }
    return { counts, bytes };
  }

  function formatBytes(value){
    const bytes = Math.max(0, Number(value) || 0);
    if(bytes < 1024) return `${bytes} B`;
    if(bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function makeSummary(report){
    const before = report.before || { counts:{}, bytes:0 };
    const after = report.after || { counts:{}, bytes:0 };
    const saved = Math.max(0, before.bytes - after.bytes);
    const percent = before.bytes > 0 ? (saved / before.bytes * 100) : 0;
    return [
      'Bookie Optimizer Report',
      `리소스: ${before.counts.total || 0} → ${after.counts.total || 0}`,
      `내부 데이터: ${formatBytes(before.bytes)} → ${formatBytes(after.bytes)}`,
      `절감: ${formatBytes(saved)} (${percent.toFixed(1)}%)`,
      `중복 리소스: ${report.duplicateFiles || 0}`,
      `미사용 리소스: ${report.unusedRemovedFiles || 0}`,
      `내장 폰트: ${report.fontFilesRemoved || 0}`,
      `메타데이터 찌꺼기: ${report.junkFilesRemoved || 0}`,
      `CSS 변경 파일: ${report.cssFilesChanged || 0}`,
      `OPF 변경 파일: ${report.opfFilesChanged || 0}`,
      `NAV/NCX 변경 파일: ${(report.navFilesChanged || 0) + (report.ncxFilesChanged || 0)}`,
      `ZIP 폴더 엔트리 제거: ${report.zipDirectoryEntriesRemoved || 0}`,
      `총 실행 시간: ${((report.totalDurationMs || 0) / 1000).toFixed(2)}초`,
      `경고: ${(report.warnings || []).length} / 오류: ${(report.errors || []).length}`
    ].join('\n');
  }

  const OptimizerReportStep = {
    id: 'optimizer-report',
    async run(context){
      context.report.after = await snapshot(context.zip);
      const beforeBytes = context.report.before ? context.report.before.bytes : 0;
      const afterBytes = context.report.after.bytes;
      context.report.estimatedSavedBytes = Math.max(0, beforeBytes - afterBytes);
      context.report.estimatedSavedPercent = beforeBytes > 0 ? context.report.estimatedSavedBytes / beforeBytes * 100 : 0;
      context.report.summary = makeSummary(context.report);
      return context;
    },
    snapshot,
    formatBytes,
    makeSummary
  };

  root.OptimizerReportStep = OptimizerReportStep;
  if(typeof module !== 'undefined' && module.exports) module.exports = OptimizerReportStep;
})(typeof globalThis !== 'undefined' ? globalThis : window);
