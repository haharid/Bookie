// FootnoteAppend Step v3
// Appends semantic footnote targets after visible chapter content.

const FootnoteAppendStep = {
  id: "footnote-append",
  name: "FootnoteAppend",
  version: "3.0",
  description: "Append hidden reading-system popup targets",
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
