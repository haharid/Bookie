// Bookie 3.9.0 - EPUB Optimizer Engine
(function(root){
  'use strict';
  const pipeline = root.BookieOptimizerPipeline || (typeof require === 'function' ? require('./optimizer-pipeline.js') : null);
  const scan = root.DuplicateResourceScanStep || (typeof require === 'function' ? require('./steps/duplicate-resource-scan-step.js') : null);
  const select = root.DuplicateResourceSelectStep || (typeof require === 'function' ? require('./steps/duplicate-resource-select-step.js') : null);
  const rewrite = root.DuplicateResourceRewriteStep || (typeof require === 'function' ? require('./steps/duplicate-resource-rewrite-step.js') : null);
  const remove = root.DuplicateResourceRemoveStep || (typeof require === 'function' ? require('./steps/duplicate-resource-remove-step.js') : null);
  const unusedCollect = root.UnusedResourceCollectStep || (typeof require === 'function' ? require('./steps/unused-resource-collect-step.js') : null);
  const unusedDetect = root.UnusedResourceDetectStep || (typeof require === 'function' ? require('./steps/unused-resource-detect-step.js') : null);
  const unusedRemove = root.UnusedResourceRemoveStep || (typeof require === 'function' ? require('./steps/unused-resource-remove-step.js') : null);
  const junkCleaner = root.MetadataJunkCleanerStep || (typeof require === 'function' ? require('./steps/metadata-junk-cleaner-step.js') : null);
  const cssCleanup = root.CssCleanupStep || (typeof require === 'function' ? require('./steps/css-cleanup-step.js') : null);
  const opfCleanup = root.OpfCleanupStep || (typeof require === 'function' ? require('./steps/opf-cleanup-step.js') : null);
  const navNcxCleanup = root.NavNcxCleanupStep || (typeof require === 'function' ? require('./steps/nav-ncx-cleanup-step.js') : null);
  const zipCleanup = root.ZipCleanupStep || (typeof require === 'function' ? require('./steps/zip-cleanup-step.js') : null);
  const reportStep = root.OptimizerReportStep || (typeof require === 'function' ? require('./steps/optimizer-report-step.js') : null);

  pipeline.reset().use(scan).use(select).use(rewrite).use(remove).use(unusedCollect).use(unusedDetect).use(unusedRemove).use(junkCleaner).use(cssCleanup).use(opfCleanup).use(navNcxCleanup).use(zipCleanup).use(reportStep);

  const BookieOptimizerEngine = {
    lastReport: null,
    async optimize(zip, options = {}){
      if(!zip || !zip.files || typeof zip.file !== 'function' || typeof zip.remove !== 'function'){
        throw new Error('유효한 JSZip 인스턴스가 필요합니다.');
      }
      const context = {
        zip,
        options,
        inventory: [],
        duplicateGroups: [],
        replacementMap: new Map(),
        report: {
          version: '3.9.0',
          mode: 'bookie-3.9.0-final-optimizer',
          scannedResources: 0,
          duplicateGroups: 0,
          duplicateFiles: 0,
          rewrittenTextFiles: 0,
          removedFiles: 0,
          bytesEligible: 0,
          savedBytes: 0,
          manifestResources: 0,
          reachableResources: 0,
          unusedCandidates: 0,
          unusedRemovedFiles: 0,
          unusedSavedBytes: 0,
          unusedManifestItemsRemoved: 0,
          unusedRemovedPaths: [],
          fontFilesRemoved: 0,
          fontSavedBytes: 0,
          fontManifestItemsRemoved: 0,
          fontFaceBlocksRemoved: 0,
          fontCssFilesChanged: 0,
          fontRemovedPaths: [],
          fontEncryptionEntriesRemoved: 0,
          junkFilesRemoved: 0,
          junkSavedBytes: 0,
          junkRemovedPaths: [],
          cssFilesScanned: 0,
          cssFilesChanged: 0,
          cssEmptyRulesRemoved: 0,
          cssDuplicateDeclarationsRemoved: 0,
          cssChangedPaths: [],
          opfFilesScanned: 0,
          opfFilesChanged: 0,
          opfMetadataDuplicatesRemoved: 0,
          opfDuplicateManifestItemsRemoved: 0,
          opfMissingManifestItemsRemoved: 0,
          opfManifestIdReferencesRewritten: 0,
          opfDanglingSpineItemsRemoved: 0,
          opfDanglingCoverMetaRemoved: 0,
          opfDanglingGuideReferencesRemoved: 0,
          opfChangedPaths: [],
          navFilesScanned: 0,
          navFilesChanged: 0,
          ncxFilesScanned: 0,
          ncxFilesChanged: 0,
          navNcxMissingTargetsRemoved: 0,
          navNcxEmptyEntriesRemoved: 0,
          navNcxDuplicateEntriesRemoved: 0,
          navNcxEmptyContainersRemoved: 0,
          navNcxChangedPaths: [],
          zipDirectoryEntriesRemoved: 0,
          zipJunkFilesRemoved: 0,
          zipSavedBytes: 0,
          zipRemovedPaths: [],
          before: null,
          after: null,
          estimatedSavedBytes: 0,
          estimatedSavedPercent: 0,
          summary: '',
          stepTimingsMs: {},
          totalDurationMs: 0,
          warnings: [],
          errors: [],
          steps: []
        }
      };
      context.report.before = await reportStep.snapshot(zip);
      context.report.add = function(key, value){ this[key] = (Number(this[key]) || 0) + (Number(value) || 0); return this[key]; };
      context.report.warn = function(message){ this.warnings.push(String(message)); };
      context.report.error = function(message){ this.errors.push(String(message)); };
      await pipeline.run(context);
      context.report.summary = reportStep.makeSummary(context.report);
      this.lastReport = context.report;
      return context.report;
    },
    getLastReport(){ return this.lastReport; }
  };

  root.BookieOptimizerEngine = BookieOptimizerEngine;
  if(typeof module !== 'undefined' && module.exports) module.exports = BookieOptimizerEngine;
})(typeof globalThis !== 'undefined' ? globalThis : window);
