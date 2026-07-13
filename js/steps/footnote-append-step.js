// Bookie 3.5.1 - FootnoteAppend Step
// Kept for pipeline compatibility; Footnote v2 no longer appends hidden inline note blocks.

const FootnoteAppendStep = {
  id: "footnote-append",
  name: "FootnoteAppend",
  version: "2.0",
  description: "Compatibility step for collected footnotes",
  enabled: true,
  priority: 50,
  after: ["paragraph-html"],
  before: ["plugin"],

  canRun(context){
    return context.config?.cleaner?.footnote !== false;
  },

  run(context){
    context.html = context.html + (context.meta.notesHtml || "");
    return context;
  }
};
