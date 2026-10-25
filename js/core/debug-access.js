// Bookie 3.3.4 - Debug Access
// Exposes the last pipeline context/report for manual debugging without changing EPUB output.
(function(global){
  const BookieDebug = {
    getContext(){
      if(global.BookieEngine && global.BookieEngine.lastContext){
        return global.BookieEngine.lastContext;
      }
      return null;
    },

    getReport(){
      const context = this.getContext();
      if(!context) return null;

      if(context.report) return context.report;

      if(global.BookieLogger && typeof global.BookieLogger.createReport === "function"){
        return global.BookieLogger.createReport(context);
      }

      return null;
    },

    print(){
      const context = this.getContext();

      if(!context){
        return "BookieDebug: no context yet. Convert one EPUB first.";
      }

      if(context.debug && context.debug.lastReportText){
        return context.debug.lastReportText;
      }

      if(global.BookieLogger && typeof global.BookieLogger.reportText === "function"){
        return global.BookieLogger.reportText(context);
      }

      return "BookieDebug: report is unavailable.";
    },

    table(){
      const report = this.getReport();
      return report && Array.isArray(report.steps) ? report.steps : [];
    },

    errors(){
      const report = this.getReport();
      return report && Array.isArray(report.errors) ? report.errors : [];
    },

    dependencies(){
      const report = this.getReport();
      return report && Array.isArray(report.dependencies) ? report.dependencies : [];
    }
  };

  global.BookieDebug = BookieDebug;
})(window);
