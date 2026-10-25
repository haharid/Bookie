// Bookie 3.3.2 - ParagraphHtml Step Upgrade
// Adds Step metadata and canRun() while keeping default logic unchanged.

const ParagraphHtmlStep = {
  id: "paragraph-html",
  name: "ParagraphHtml",
  version: "1.0",
  description: "Build paragraph HTML output",
  enabled: true,
  priority: 40,
  after: ["dialogue"],
  before: ["footnote-append"],

  canRun(context){
    return context.config?.cleaner?.paragraph !== false;
  },

  run(context){
    context.html = buildParagraphHtml(context.html);
    return context;
  }
};
