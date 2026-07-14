// Game-mode UI state and user-defined channel pattern/color rules.
// User patterns include their brackets. Matching ignores whitespace, while the
// original paragraph contents, brackets, punctuation, and spaces remain intact.

const BookieGameModeSettings = (()=>{
  const DEFAULT_CUSTOM_COLOR="#C8A2FF";
  const DEFAULT_RULE_GROUPS=[
    {className:"chat",markers:["[일반]","[전체]","[system]","[시스템]"],colorName:"흰색"},
    {className:"chat_p",markers:["[귓속말]"],colorName:"분홍색"},
    {className:"chat_b",markers:["[파티]","[팀]"],colorName:"연청색"},
    {className:"chat_y",markers:["[지역]"],colorName:"노란색"},
    {className:"chat_g",markers:["[길드]"],colorName:"초록색"},
    {className:"chat_or",markers:["[외치기]"],colorName:"주황색"},
    {className:"chat_bb",markers:["[연합]","[공격대]"],colorName:"진한 파랑"}
  ];
  let rules=[];
  let nextRuleId=1;
  let initialized=false;
  let confirmedCustomColor=DEFAULT_CUSTOM_COLOR;
  let settledColorValue="#FFFFFF";

  function byId(id){
    return typeof document!=="undefined" ? document.getElementById(id) : null;
  }

  function matcher(){
    return typeof BookieGameRuleMatcher!=="undefined" ? BookieGameRuleMatcher : null;
  }

  function escapeHtml(value){
    return String(value || "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/\"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }

  function safeColor(value){
    const color=String(value || "").trim();
    return /^#[0-9a-f]{6}$/i.test(color) ? color.toUpperCase() : "";
  }

  function safeClassName(value){
    const className=String(value || "").trim();
    return /^chat_custom_[1-9]\d*$/.test(className) ? className : "";
  }

  function normalizePattern(value){
    const service=matcher();
    return service ? service.normalizeWhitespace(value) : String(value || "").replace(/\s+/gu,"");
  }

  function isSupportedPattern(value){
    const service=matcher();
    if(service) return service.isSupportedPattern(value);
    const pattern=normalizePattern(value);
    return (pattern.startsWith("[") && pattern.endsWith("]")) ||
      (pattern.startsWith("(") && pattern.endsWith(")"));
  }

  function patternMatches(pattern,text){
    const service=matcher();
    return service ? service.matches(pattern,text) : normalizePattern(pattern)===normalizePattern(text);
  }

  function getRules(){
    return rules.map(rule=>({...rule}));
  }

  function setMessage(message,isError=false){
    const target=byId("gameRuleMessage");
    if(!target) return;
    target.textContent=message || "";
    target.classList.toggle("is-error",!!isError);
  }

  function defaultMarkerIsOverridden(marker){
    return rules.some(rule=>patternMatches(rule.pattern,marker));
  }

  function renderDefaultRules(){
    const list=byId("gameDefaultRuleList");
    if(!list) return;

    const rows=DEFAULT_RULE_GROUPS.map(group=>{
      const markers=group.markers.filter(marker=>!defaultMarkerIsOverridden(marker));
      if(!markers.length) return "";
      return `<p class="gameRulePreviewLine ${group.className}">${markers.join("")}${group.colorName}</p>`;
    }).filter(Boolean);

    const example='<p class="gameRulePreviewLine gameRuleExample chat_or"><span class="gameRuleExampleLabel">예시</span>[외치기]Tiro: 반가워, 난 Tiro야!</p>';
    list.innerHTML=example+(rows.length
      ? rows.join("")
      : '<div class="gameRuleEmpty">기본 규칙이 모두 사용자 색상으로 변경됐어요.</div>');
  }

  function renderRules(){
    const list=byId("gameRuleList");
    if(!list) return;

    if(!rules.length){
      list.innerHTML='<div class="gameRuleEmpty">아직 추가한 규칙이 없어요.</div>';
      renderDefaultRules();
      return;
    }

    list.innerHTML=rules.map(rule=>
      `<div class="gameCustomRuleItem" data-game-rule-id="${rule.id}">`+
        `<span class="gameRulePreviewText" style="color:${rule.color}">${escapeHtml(rule.pattern)} ${escapeHtml(rule.colorName)}</span>`+
        `<button type="button" class="gameRuleRemove" data-remove-game-rule="${rule.id}" aria-label="${escapeHtml(rule.pattern)} 규칙 삭제">×</button>`+
      `</div>`
    ).join("");
    renderDefaultRules();
  }

  function selectedColor(){
    const select=byId("gameColorSelect");
    if(!select) return {color:"#FFFFFF",colorName:"흰색"};

    if(select.value==="custom" || select.value==="custom_applied"){
      const custom=safeColor(confirmedCustomColor) || DEFAULT_CUSTOM_COLOR;
      return {color:custom,colorName:`직접 선택 ${custom}`};
    }

    const option=select.options?.[select.selectedIndex];
    return {
      color:safeColor(select.value) || "#FFFFFF",
      colorName:option?.dataset?.colorName || option?.textContent || "선택 색상"
    };
  }

  function addRule(){
    const input=byId("gameChannelInput");
    const pattern=String(input?.value || "");
    const matchKey=normalizePattern(pattern);
    if(!matchKey){
      setMessage("채널 규칙을 입력해줘.",true);
      input?.focus();
      return null;
    }
    if(!isSupportedPattern(pattern)){
      setMessage("괄호를 올바르게 입력하거나 일반:내용처럼 고정 글자를 함께 입력해줘.",true);
      input?.focus();
      return null;
    }

    const choice=selectedColor();
    const existing=rules.find(rule=>rule.matchKey===matchKey);
    if(existing){
      existing.pattern=pattern;
      existing.color=choice.color;
      existing.colorName=choice.colorName;
      setMessage(`${pattern} 규칙의 색상을 변경했어요.`);
      renderRules();
      if(input) input.value="";
      return {...existing};
    }

    const id=nextRuleId++;
    const rule={
      id,
      pattern,
      matchKey,
      className:`chat_custom_${id}`,
      color:choice.color,
      colorName:choice.colorName
    };
    rules.push(rule);
    renderRules();
    setMessage(`${pattern} 규칙을 추가했어요.`);
    if(input) input.value="";
    return {...rule};
  }

  function removeRule(id){
    const numericId=Number(id);
    const index=rules.findIndex(rule=>rule.id===numericId);
    if(index<0) return false;
    const [removed]=rules.splice(index,1);
    renderRules();
    setMessage(`${removed.pattern} 규칙을 삭제했어요.`);
    return true;
  }

  function positionCustomColorPalette(){
    const select=byId("gameColorSelect");
    const row=byId("gameCustomColorRow");
    if(!select || !row || row.hidden || !row.style || typeof select.getBoundingClientRect!=="function") return;
    const rect=select.getBoundingClientRect();
    const viewportWidth=typeof window!=="undefined" ? window.innerWidth : 0;
    const viewportHeight=typeof window!=="undefined" ? window.innerHeight : 0;
    const measuredWidth=Math.max(220,Number(row.offsetWidth) || 235);
    const paletteWidth=viewportWidth ? Math.min(measuredWidth,Math.max(0,viewportWidth-16)) : measuredWidth;
    const paletteHeight=Math.max(43,Number(row.offsetHeight) || 43);
    const left=viewportWidth
      ? Math.max(8,Math.min(rect.left,viewportWidth-paletteWidth-8))
      : rect.left;
    const below=rect.bottom+6;
    const top=viewportHeight && below+paletteHeight>viewportHeight-8
      ? Math.max(8,rect.top-paletteHeight-6)
      : below;
    row.style.left=`${Math.round(left)}px`;
    row.style.top=`${Math.round(top)}px`;
  }

  function settleCustomColorPalettePosition(afterSettle){
    positionCustomColorPalette();
    if(typeof window!=="undefined" && typeof window.requestAnimationFrame==="function"){
      window.requestAnimationFrame(()=>{
        positionCustomColorPalette();
        window.requestAnimationFrame(()=>{
          positionCustomColorPalette();
          const row=byId("gameCustomColorRow");
          const select=byId("gameColorSelect");
          if(!row?.hidden && select?.value==="custom" && typeof afterSettle==="function") afterSettle();
        });
      });
      return;
    }
    if(typeof afterSettle==="function") afterSettle();
  }

  function hideCustomColorPalette(){
    const row=byId("gameCustomColorRow");
    const select=byId("gameColorSelect");
    const input=byId("gameCustomColor");
    if(select?.value==="custom"){
      select.value=settledColorValue || "#FFFFFF";
      if(input) input.value=confirmedCustomColor;
      updateCustomColorValue();
    }
    if(row){
      row.hidden=true;
      row.setAttribute("aria-hidden","true");
    }
    select?.setAttribute("aria-expanded","false");
  }

  function openNativeColorPicker(){
    const input=byId("gameCustomColor");
    if(!input) return;
    try{
      if(typeof input.showPicker==="function") input.showPicker();
      else if(typeof input.click==="function") input.click();
    }catch(error){}
  }

  function openCustomColorPalette(openPicker=false){
    const row=byId("gameCustomColorRow");
    const select=byId("gameColorSelect");
    if(!row) return;
    row.hidden=false;
    row.setAttribute("aria-hidden","false");
    select?.setAttribute("aria-expanded","true");
    select?.blur?.();
    updateCustomColorValue();
    settleCustomColorPalettePosition(openPicker ? openNativeColorPicker : null);
  }

  function updateColorControls(openPicker=false){
    const value=byId("gameColorSelect")?.value || "#FFFFFF";
    if(value==="custom"){
      const input=byId("gameCustomColor");
      if(input) input.value=confirmedCustomColor;
      openCustomColorPalette(openPicker===true);
      return;
    }
    settledColorValue=value;
    hideCustomColorPalette();
  }

  function updateCustomColorValue(){
    const input=byId("gameCustomColor");
    const output=byId("gameCustomColorValue");
    if(output) output.value=safeColor(input?.value) || DEFAULT_CUSTOM_COLOR;
  }

  function confirmCustomColor(){
    updateCustomColorValue();
    const color=safeColor(byId("gameCustomColor")?.value) || DEFAULT_CUSTOM_COLOR;
    const select=byId("gameColorSelect");
    const applied=byId("gameCustomColorAppliedOption");
    confirmedCustomColor=color;
    if(applied){
      applied.hidden=false;
      applied.textContent=`직접 선택 ${color}`;
    }
    if(select) select.value="custom_applied";
    settledColorValue="custom_applied";
    setMessage(`${color} 색상을 선택했어요.`);
    hideCustomColorPalette();
    return color;
  }

  function updateControls(){
    const toggle=byId("enableGameMode");
    const enabled=!!toggle?.checked;
    const settings=byId("gameModeSettings");
    const section=byId("gameModeSection");
    const bracketInputs=[byId("gameBracketSquare"),byId("gameBracketRound")];

    if(toggle) toggle.setAttribute("aria-expanded",String(enabled));
    if(settings){
      settings.hidden=!enabled;
      settings.setAttribute("aria-hidden",String(!enabled));
    }
    section?.classList.toggle("is-open",enabled);
    if(!enabled) hideCustomColorPalette();
    bracketInputs.forEach(input=>{
      if(input) input.disabled=!enabled;
    });
  }

  function buildCustomCss(ruleList=rules){
    const blocks=[];
    (Array.isArray(ruleList) ? ruleList : []).forEach(rule=>{
      const className=safeClassName(rule?.className);
      const color=safeColor(rule?.color);
      if(!className || !color) return;
      blocks.push(`.${className} {\n  color: ${color};\n}`);
    });
    return blocks.join("\n\n");
  }

  function buildEpubCss(baseCss){
    const base=String(baseCss || "").trimEnd();
    const custom=buildCustomCss();
    if(!custom) return `${base}\n`;
    return `${base}\n\n/* User game channel colors */\n${custom}\n`;
  }

  function hasState(){
    return rules.length>0 ||
      !!byId("enableGameMode")?.checked ||
      !!byId("gameChannelInput")?.value ||
      ["custom","custom_applied"].includes(byId("gameColorSelect")?.value) ||
      String(byId("gameCustomColor")?.value || "").toUpperCase()!==DEFAULT_CUSTOM_COLOR;
  }

  function reset(){
    rules=[];
    nextRuleId=1;

    const toggle=byId("enableGameMode");
    const square=byId("gameBracketSquare");
    const round=byId("gameBracketRound");
    const channel=byId("gameChannelInput");
    const select=byId("gameColorSelect");
    const custom=byId("gameCustomColor");
    const applied=byId("gameCustomColorAppliedOption");
    confirmedCustomColor=DEFAULT_CUSTOM_COLOR;
    settledColorValue="#FFFFFF";
    if(toggle) toggle.checked=false;
    if(square) square.checked=true;
    if(round) round.checked=false;
    if(channel) channel.value="";
    if(select) select.value="#FFFFFF";
    if(custom) custom.value=DEFAULT_CUSTOM_COLOR;
    if(applied){
      applied.hidden=true;
      applied.textContent=`직접 선택 ${DEFAULT_CUSTOM_COLOR}`;
    }

    setMessage("");
    updateCustomColorValue();
    updateColorControls();
    renderRules();
    updateControls();
  }

  function init(){
    if(initialized) return;
    initialized=true;

    byId("enableGameMode")?.addEventListener("change",updateControls);
    byId("gameColorSelect")?.addEventListener("change",()=>updateColorControls(true));
    byId("gameCustomColor")?.addEventListener("input",updateCustomColorValue);
    byId("gameCustomColorConfirm")?.addEventListener("click",confirmCustomColor);
    byId("gameAddRuleButton")?.addEventListener("click",addRule);
    byId("gameChannelInput")?.addEventListener("keydown",event=>{
      if(event.key!=="Enter" || event.isComposing) return;
      event.preventDefault();
      addRule();
    });
    byId("gameRuleList")?.addEventListener("click",event=>{
      const button=event.target.closest("[data-remove-game-rule]");
      if(button) removeRule(button.dataset.removeGameRule);
    });
    if(typeof window!=="undefined"){
      window.addEventListener?.("resize",positionCustomColorPalette);
      window.addEventListener?.("scroll",positionCustomColorPalette,true);
    }
    if(typeof document!=="undefined" && typeof document.addEventListener==="function"){
      document.addEventListener("keydown",event=>{
        if(event.key==="Escape") hideCustomColorPalette();
      });
      document.addEventListener("click",event=>{
        const target=event.target;
        if(target?.closest?.("#gameCustomColorRow, #gameColorSelect")) return;
        if(!byId("gameCustomColorRow")?.hidden) hideCustomColorPalette();
      });
    }

    updateCustomColorValue();
    updateColorControls();
    renderRules();
    updateControls();
  }

  return {
    init,
    reset,
    hasState,
    getRules,
    addRule,
    removeRule,
    confirmCustomColor,
    openCustomColorPalette,
    hideCustomColorPalette,
    positionCustomColorPalette,
    updateControls,
    buildCustomCss,
    buildEpubCss,
    normalizePattern,
    renderDefaultRules
  };
})();
