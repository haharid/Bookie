// Bookie 3.4.4 - General Cleanup Engine v2
// Engine entry with upgraded Step metadata.
// Rule: keep Stable output unchanged.

BookieStepRegistry.clear();
BookieStepRegistry.registerMany([
  FootnoteStep,
  BlanklineStep,
  DialogueStep,
  ParagraphHtmlStep,
  GameChatStep,
  BoxWrapStep,
  FbStep,
  FootnoteAppendStep,
  GeneralCleanupStep,
  PluginStep
]);

BookiePipeline.reset();
BookieStepRegistry.applyTo(BookiePipeline);

const BookieEngine = {

  lastContext: null,

  getLastContext(){
    return this.lastContext;
  },

  getLastReport(){
    return this.lastContext ? this.lastContext.report : null;
  },

  process(sourceText, options = {}){
    const context = createBookieContext(sourceText, options);

    if(typeof BookiePluginManager !== "undefined" && context.config.plugins !== false){
      BookiePluginManager.setup(context);
    }

    BookiePipeline.run(context);

    this.lastContext = context;

    return context.html;
  }

};
