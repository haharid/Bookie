// Converts selected standalone dialogue paragraphs to the EPUB fb style.

const FbStep = {
  id: "fb",
  name: "Fb",
  version: "1.2",
  description: "Apply the fb class to selected quote-only or leading-dash paragraphs",
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
    const blankDashEnabled = !!document.getElementById("enableFbDash")?.checked;
    const allDashEnabled = !!document.getElementById("enableFbDashAll")?.checked;

    if(typeof BookieFbEngine !== "undefined"){
      const result = BookieFbEngine.clean(context.html, {
        enabled: blankDelimitedEnabled || allQuotesEnabled || blankDashEnabled || allDashEnabled,
        quoteEnabled: blankDelimitedEnabled || allQuotesEnabled,
        mode: allQuotesEnabled ? "all" : "between-blanks",
        dashEnabled: blankDashEnabled || allDashEnabled,
        dashMode: allDashEnabled ? "all" : "between-blanks"
      });
      context.html = result.html;
      context.meta.fb = result.report;
    }

    return context;
  }
};
