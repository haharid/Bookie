// Paragraph-break UI state and automatic candidate discovery.
// Custom rules are applied only to complete standalone lines. When the new
// text field is empty, the selected source text is kept as the visible break.

const BookieParagraphBreakSettings=(()=>{
  const DEFAULT_RULE={source:"***",output:"* * *",matchStars:true,isDefault:true};
  const MAX_CANDIDATES=40;
  let rules=[];
  let candidates=[];
  let nextRuleId=1;
  let initialized=false;

  function byId(id){
    return typeof document!=="undefined" ? document.getElementById(id) : null;
  }

  function escapeHtml(value){
    return String(value || "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/\"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }

  function cleanValue(value){
    return String(value || "").replace(/\r\n?/g,"\n").trim();
  }

  function isDefaultStar(value){
    return cleanValue(value).replace(/\s+/gu,"")==="***";
  }

  function hasEmbeddedDefaultStar(value){
    const text=cleanValue(value);
    return /\*\s*\*\s*\*/u.test(text) && !isDefaultStar(text);
  }

  function detectCandidatesFromText(source){
    const lines=String(source || "").replace(/\r\n?/g,"\n").split("\n");
    const found=new Map();

    lines.forEach((line,index)=>{
      const value=cleanValue(line);
      if(!value || hasEmbeddedDefaultStar(value)) return;
      const existing=found.get(value) || {
        value,
        count:0,
        firstIndex:index,
        defaultStar:isDefaultStar(value)
      };
      existing.count++;
      found.set(value,existing);
    });

    return [...found.values()]
      .filter(item=>{
        if(item.defaultStar) return true;
        return item.count>=5;
      })
      .sort((a,b)=>{
        if(a.defaultStar!==b.defaultStar) return a.defaultStar ? -1 : 1;
        if(a.count!==b.count) return b.count-a.count;
        return a.firstIndex-b.firstIndex;
      })
      .slice(0,MAX_CANDIDATES)
      .map(item=>item.value);
  }

  function sourceText(){
    return typeof fileText!=="undefined" ? String(fileText || "") : "";
  }

  function setMessage(message,isError=false){
    const target=byId("paragraphBreakMessage");
    if(!target) return;
    target.textContent=message || "";
    target.classList.toggle("is-error",!!isError);
  }

  function renderCandidates(){
    const list=byId("paragraphBreakCandidates");
    if(!list) return;
    const current=cleanValue(byId("paragraphBreakCurrent")?.value);

    if(!candidates.length){
      list.innerHTML='<div class="paragraphBreakEmpty">탐색된 후보가 없어요. 위 입력창에 직접 입력할 수 있어요.</div>';
      return;
    }

    list.innerHTML=candidates.map((candidate,index)=>
      `<button type="button" class="paragraphBreakCandidate${current===candidate ? " is-selected" : ""}" data-paragraph-break-candidate="${index}" title="${escapeHtml(candidate)}">${escapeHtml(candidate)}</button>`
    ).join("");
  }

  function renderRules(){
    const list=byId("paragraphBreakRules");
    if(!list) return;

    if(!rules.length){
      list.innerHTML='<div class="paragraphBreakEmpty">미선택 상태에서는 ***와 * * *를 자동 변환해요.</div>';
      return;
    }

    list.innerHTML=rules.map(rule=>{
      const changed=rule.output!==rule.source;
      const description=changed
        ? `<span>${escapeHtml(rule.source)}</span><span aria-hidden="true">→</span><span>${escapeHtml(rule.output)}</span>`
        : `<span>${escapeHtml(rule.source)}</span><small>그대로</small>`;
      return `<div class="paragraphBreakRule" data-paragraph-break-rule="${rule.id}">`+
        `<div class="paragraphBreakRuleText">${description}</div>`+
        `<button type="button" class="paragraphBreakRuleRemove" data-remove-paragraph-break="${rule.id}" aria-label="${escapeHtml(rule.source)} 문단 구분 규칙 삭제">×</button>`+
      `</div>`;
    }).join("");
  }

  function refreshCandidates(source=sourceText()){
    candidates=detectCandidatesFromText(source);
    renderCandidates();
    return [...candidates];
  }

  function open(){
    const settings=byId("paragraphBreakSettings");
    const toggle=byId("paragraphBreakToggle");
    const arrow=byId("paragraphBreakArrow");
    if(!settings) return;
    settings.hidden=false;
    settings.setAttribute("aria-hidden","false");
    toggle?.setAttribute("aria-expanded","true");
    if(arrow) arrow.textContent="▾";
    refreshCandidates();
  }

  function close(){
    const settings=byId("paragraphBreakSettings");
    const toggle=byId("paragraphBreakToggle");
    const arrow=byId("paragraphBreakArrow");
    if(!settings) return;
    settings.hidden=true;
    settings.setAttribute("aria-hidden","true");
    toggle?.setAttribute("aria-expanded","false");
    if(arrow) arrow.textContent="▸";
  }

  function toggle(){
    const settings=byId("paragraphBreakSettings");
    if(!settings) return;
    if(settings.hidden) open();
    else close();
  }

  function addRuleValues(source,replacement=""){
    const current=cleanValue(source);
    const next=cleanValue(replacement);
    if(!current) return null;
    const output=next || current;
    const existing=rules.find(rule=>rule.source===current);
    if(existing){
      existing.output=output;
      renderRules();
      return {...existing};
    }
    const rule={id:nextRuleId++,source:current,output};
    rules.push(rule);
    renderRules();
    return {...rule};
  }

  function applyCurrentRule(){
    const currentInput=byId("paragraphBreakCurrent");
    const replacementInput=byId("paragraphBreakReplacement");
    const current=cleanValue(currentInput?.value);
    const replacement=cleanValue(replacementInput?.value);

    if(!current){
      setMessage("현재 기호·문구를 선택하거나 입력해줘.",true);
      currentInput?.focus();
      return null;
    }

    const rule=addRuleValues(current,replacement);
    setMessage(replacement
      ? `${current} → ${replacement}로 적용했어요.`
      : `${current} 문구를 그대로 구분 기호로 적용했어요.`);
    renderCandidates();
    return rule;
  }

  function removeRule(id){
    const numericId=Number(id);
    const index=rules.findIndex(rule=>rule.id===numericId);
    if(index<0) return false;
    const [removed]=rules.splice(index,1);
    renderRules();
    setMessage(`${removed.source} 규칙을 삭제했어요.`);
    return true;
  }

  function getRules(){
    return rules.map(rule=>({...rule}));
  }

  function getConversionRules(){
    return rules.length ? getRules() : [{...DEFAULT_RULE}];
  }

  function hasState(){
    return !!(rules.length || cleanValue(byId("paragraphBreakCurrent")?.value) ||
      cleanValue(byId("paragraphBreakReplacement")?.value));
  }

  function reset(){
    rules=[];
    candidates=[];
    nextRuleId=1;
    const current=byId("paragraphBreakCurrent");
    const replacement=byId("paragraphBreakReplacement");
    if(current) current.value="";
    if(replacement) replacement.value="";
    setMessage("");
    renderCandidates();
    renderRules();
    close();
  }

  function init(){
    if(initialized) return;
    initialized=true;
    const toggleButton=byId("paragraphBreakToggle");
    const applyButton=byId("paragraphBreakApply");
    const candidateList=byId("paragraphBreakCandidates");
    const ruleList=byId("paragraphBreakRules");
    const currentInput=byId("paragraphBreakCurrent");
    const replacementInput=byId("paragraphBreakReplacement");

    toggleButton?.addEventListener("click",toggle);
    applyButton?.addEventListener("click",applyCurrentRule);
    currentInput?.addEventListener("input",renderCandidates);
    [currentInput,replacementInput].forEach(input=>input?.addEventListener("keydown",event=>{
      if(event.key!=="Enter" || event.isComposing || event.repeat) return;
      event.preventDefault();
      applyCurrentRule();
    }));
    candidateList?.addEventListener("click",event=>{
      const button=event.target.closest("[data-paragraph-break-candidate]");
      if(!button || !currentInput) return;
      const index=Number(button.dataset.paragraphBreakCandidate);
      if(!Number.isInteger(index) || !candidates[index]) return;
      currentInput.value=candidates[index];
      setMessage("");
      renderCandidates();
      currentInput.focus();
    });
    ruleList?.addEventListener("click",event=>{
      const button=event.target.closest("[data-remove-paragraph-break]");
      if(button) removeRule(button.dataset.removeParagraphBreak);
    });

    renderCandidates();
    renderRules();
    close();
  }

  if(typeof window!=="undefined") window.addEventListener("load",init);

  return {
    init,
    open,
    close,
    toggle,
    refreshCandidates,
    detectCandidatesFromText,
    addRuleValues,
    applyCurrentRule,
    removeRule,
    getRules,
    getConversionRules,
    hasState,
    reset
  };
})();
