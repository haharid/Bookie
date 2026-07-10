// Bookie 3.5.1 - Footnote Step v2
// Keeps popup/end-note links while removing hidden inline footnote blocks.

const FootnoteStep = {
  id: "footnote",
  name: "Footnote",
  version: "2.0",
  description: "Extract footnotes and link them to the end-note page",
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
