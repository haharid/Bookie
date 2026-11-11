// Applies optional game-chat channel styling after paragraph HTML is built.

function currentBookieGameChatOptions(){
  const enabled=!!document.getElementById("enableGameMode")?.checked;
  const square=!!document.getElementById("gameBracketSquare")?.checked;
  const round=!!document.getElementById("gameBracketRound")?.checked;
  const customRules=typeof BookieGameModeSettings!=="undefined"
    ? BookieGameModeSettings.getRules()
    : [];
  return {enabled,square,round,customRules};
}

const GameChatStep = {
  id: "game-chat",
  name: "GameChat",
  version: "1.0",
  description: "Convert game channel markers and wrap consecutive chat paragraphs",
  enabled: true,
  priority: 42,
  after: ["paragraph-html"],
  before: ["fb", "footnote-append"],

  run(context){
    const options=context.options?.gameChatOptions || currentBookieGameChatOptions();

    if(typeof BookieGameChatEngine!=="undefined"){
      const protectedItems=context.options?.gameChatProtection || [];
      const restored=BookieGameChatEngine.restoreProtectedParagraphs(context.html,protectedItems);
      const result=BookieGameChatEngine.clean(restored.html,options);
      context.html=result.html;
      context.meta.gameChat={
        ...result.report,
        protected:protectedItems.length,
        restored:restored.restored
      };
    }

    return context;
  }
};
