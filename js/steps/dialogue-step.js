// Bookie 3.5.0 - Dialogue Engine v3 Step
// Delegates dialogue cleanup to BookieDialogueEngine while keeping output compatible.

const DialogueStep = {
  id: "dialogue",
  name: "Dialogue",
  version: "3.0",
  description: "Clean dialogue-style paragraphs with Dialogue Engine v3",
  enabled: true,
  priority: 30,
  after: ["blankline"],
  before: ["paragraph-html"],

  canRun(context){
    return context.config?.cleaner?.dialogue !== false;
  },

  run(context){
    const dialogueEnabled = !!(document.getElementById("checkDialogue") && document.getElementById("checkDialogue").checked);

    if(typeof BookieDialogueEngine !== "undefined"){
      const result = BookieDialogueEngine.clean(context.html, {
        enabled: dialogueEnabled,
        paragraphGap: typeof detectedParagraphGap !== "undefined" ? detectedParagraphGap : 2
      });

      context.html = result.html;
      context.meta.dialogue = result.report;
      return context;
    }

    context.html = dialogueClean(context.html);
    return context;
  }
};
