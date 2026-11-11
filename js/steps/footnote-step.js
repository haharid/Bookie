// Footnote Step v3
// Keeps a same-document popup target and also collects the final end-note page.

const FootnoteStep = {
  id: "footnote",
  name: "Footnote",
  version: "3.0",
  description: "Extract footnotes for same-document popups and the end-note page",
  enabled: true,
  priority: 10,
  before: ["blankline"],

  canRun(context){
    return context.config?.cleaner?.footnote !== false;
  },

  run(context){
    const foot = processFootnotes(context.html);

    context.html = foot.body;
    context.meta.notesHtml = foot.notesHtml;

    return context;
  }
};
