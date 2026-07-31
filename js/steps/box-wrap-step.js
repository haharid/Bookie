// Applies BOX-add rules after automatic whitespace/paragraph processing and game chat conversion.

const BoxWrapStep={
  id:"box-wrap",
  name:"BoxWrap",
  version:"2.0",
  description:"Wrap regex-selected paragraphs with generated boxt_N styles",
  enabled:true,
  priority:44,
  after:["blankline","paragraph-html","game-chat"],
  before:["fb","footnote-append"],

  canRun(context){
    return context.config?.cleaner?.boxWrap!==false;
  },

  run(context){
    const options=context.options?.boxWrapOptions || (
      typeof BookieBoxWrapSettings!=="undefined"
        ? BookieBoxWrapSettings.getOptions()
        : {enabled:false,rules:[]}
    );

    if(typeof BookieBoxWrapEngine!=="undefined"){
      const result=BookieBoxWrapEngine.clean(context.html,options);
      context.html=result.html;
      context.meta.boxWrap=result.report;
    }
    return context;
  }
};
