// Converts selected standalone dialogue paragraphs to the EPUB fb style.

const FbStep = {
  id: "fb",
  name: "Fb",
  version: "1.0",
  description: "Apply the fb class to quote-only blocks between visible blank paragraphs",
  enabled: true,
  priority: 45,
  after: ["paragraph-html"],
  before: ["footnote-append"],

  canRun(context){
    return context.config?.cleaner?.fb !== false;
  },

  run(context){
    const fbEnabled = !!(
      document.getElementById("enableFb") &&
      document.getElementById("enableFb").checked
    );

    if(typeof BookieFbEngine !== "undefined"){
      const result = BookieFbEngine.clean(context.html, { enabled: fbEnabled });
      context.html = result.html;
      context.meta.fb = result.report;
    }

    return context;
  }
};
