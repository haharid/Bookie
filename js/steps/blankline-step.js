// Bookie 3.4.1 - Blankline Engine v2 Step
// Delegates blank-line normalization to BookieBlanklineEngine while keeping output compatible.

const BlanklineStep = {
  id: "blankline",
  name: "Blankline",
  version: "2.0",
  description: "Clean duplicated blank lines with Blankline Engine v2",
  enabled: true,
  priority: 20,
  after: ["footnote"],
  before: ["dialogue"],

  canRun(context){
    return context.config?.cleaner?.blankline !== false;
  },

  run(context){
    const spaceClean = !!(document.getElementById("checkSpaceClean") && document.getElementById("checkSpaceClean").checked);

    if(typeof BookieBlanklineEngine !== "undefined"){
      const result = BookieBlanklineEngine.clean(context.html, {
        paragraphGap: detectedParagraphGap,
        spaceClean
      });

      context.html = result.html;
      context.meta.blankline = result.report;
      return context;
    }

    context.html = cleanBlankLines(context.html);
    return context;
  }
};
