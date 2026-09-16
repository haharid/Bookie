// Converts selected standalone dialogue paragraphs to the EPUB fb style.

const FbStep = {
  id: "fb",
  name: "Fb",
  version: "1.1",
  description: "Apply the fb class to quote-only paragraphs using the selected blank-delimited or all-quotes mode",
  enabled: true,
  priority: 45,
  after: ["paragraph-html"],
  before: ["footnote-append"],

  canRun(context){
    return context.config?.cleaner?.fb !== false;
  },

  run(context){
    const blankDelimitedEnabled = !!(
      document.getElementById("enableFb") &&
      document.getElementById("enableFb").checked
    );
    const allQuotesEnabled = !!(
      document.getElementById("enableFbAll") &&
      document.getElementById("enableFbAll").checked
    );

    if(typeof BookieFbEngine !== "undefined"){
      const result = BookieFbEngine.clean(context.html, {
        enabled: blankDelimitedEnabled || allQuotesEnabled,
        mode: allQuotesEnabled ? "all" : "between-blanks"
      });
      context.html = result.html;
      context.meta.fb = result.report;
    }

    return context;
  }
};
