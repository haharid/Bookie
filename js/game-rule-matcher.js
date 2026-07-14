// Pure matching helpers shared by the game-mode UI and conversion engine.
// Matching ignores whitespace, while the original paragraph text is never changed.

const BookieGameRuleMatcher = (()=>{
  const CONTENT_TOKEN="내용";

  function normalizeWhitespace(value){
    return String(value || "")
      .replace(/(?:&nbsp;|&#0*160;|&#x0*a0;)/gi,"")
      .replace(/\s+/gu,"");
  }

  function isSupportedPattern(value){
    const pattern=normalizeWhitespace(value);
    if(!pattern) return false;

    const square=pattern.startsWith("[") && pattern.endsWith("]");
    const round=pattern.startsWith("(") && pattern.endsWith(")");
    if(square || round) return true;

    // Partially entered or mismatched brackets are rejected. Bracketless
    // patterns such as 일반:내용 are accepted only when fixed letters or
    // numbers remain after removing every 내용 wildcard token.
    if(/[\[\]()]/.test(pattern)) return false;
    const fixedText=pattern.split(CONTENT_TOKEN).join("");
    return /[\p{L}\p{N}]/u.test(fixedText);
  }

  function bracketType(value){
    const pattern=normalizeWhitespace(value);
    if(pattern.startsWith("[") && pattern.endsWith("]")) return "square";
    if(pattern.startsWith("(") && pattern.endsWith(")")) return "round";
    return "";
  }

  function escapeRegExp(value){
    return String(value).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  }

  function compilePattern(value){
    const pattern=normalizeWhitespace(value);
    if(!isSupportedPattern(pattern)) return null;

    const type=bracketType(pattern);
    const wildcard=type==="square" ? "[^\\]]*" : type==="round" ? "[^)]*" : ".*";
    const source=pattern.split(CONTENT_TOKEN).map(escapeRegExp).join(wildcard);

    try{
      return new RegExp(`^${source}`,"u");
    }catch(error){
      return null;
    }
  }

  function matches(pattern,text){
    const expression=compilePattern(pattern);
    return !!expression && expression.test(normalizeWhitespace(text));
  }

  function specificity(pattern){
    const normalized=normalizeWhitespace(pattern);
    const tokenCount=normalized.split(CONTENT_TOKEN).length-1;
    const literalLength=normalized.split(CONTENT_TOKEN).join("").length;
    return {tokenCount,literalLength};
  }

  function findBestRule(ruleList,text,options={}){
    const square=options.square!==false;
    const round=options.round!==false;
    const candidates=(Array.isArray(ruleList) ? ruleList : []).filter(rule=>{
      if(!/^chat_custom_[1-9]\d*$/.test(String(rule?.className || ""))) return false;
      const type=bracketType(rule?.pattern);
      if((type==="square" && !square) || (type==="round" && !round)) return false;
      return matches(rule?.pattern,text);
    });

    candidates.sort((a,b)=>{
      const aScore=specificity(a.pattern);
      const bScore=specificity(b.pattern);
      if(aScore.tokenCount!==bScore.tokenCount) return aScore.tokenCount-bScore.tokenCount;
      if(aScore.literalLength!==bScore.literalLength) return bScore.literalLength-aScore.literalLength;
      return Number(b.id || 0)-Number(a.id || 0);
    });
    return candidates[0] || null;
  }

  return {
    CONTENT_TOKEN,
    normalizeWhitespace,
    isSupportedPattern,
    bracketType,
    compilePattern,
    matches,
    findBestRule
  };
})();
