// Applies optional game-chat channel styling after paragraph HTML is built.

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
    const enabled=!!document.getElementById("enableGameMode")?.checked;
    const square=!!document.getElementById("gameBracketSquare")?.checked;
    const round=!!document.getElementById("gameBracketRound")?.checked;

    if(typeof BookieGameChatEngine!=="undefined"){
      const result=BookieGameChatEngine.clean(context.html,{enabled,square,round});
      context.html=result.html;
      context.meta.gameChat=result.report;
    }

    return context;
  }
};
