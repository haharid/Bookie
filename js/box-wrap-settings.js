// BOX-add UI state and user-defined paragraph/CSS rules.
// Search can be literal or wildcard-based; selecting a result line creates an editable regular expression.

const BookieBoxWrapSettings=(()=>{
  const EXAMPLE_TEXT="예시 문장입니다.";
  const SEARCH_CONTEXT_LINES=10;
  const SEARCH_RESULT_LIMIT=50;
  let rules=[];
  let nextRuleId=1;
  let initialized=false;
  let searchMatches=[];
  let previewQuery="";
  let previewText="";
  let previewSelectionText="";
  let selectedSearchIndex=-1;
  let searchMatchTotal=0;
  let activeDeleteTexts=[];
  let deleteSelectionKey="";

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

  function normalizePattern(value){
    const pattern=String(value || "").trim();
    if(pattern==="[]") return "[내용]";
    if(pattern==="()") return "(내용)";
    return pattern;
  }

  // Kept for older saved rules and callers. New BOX rules use regexSource.
  function parsePattern(value){
    const pattern=normalizePattern(value);
    const tokenIndex=pattern.indexOf("내용");
    if(tokenIndex<0) return null;
    const prefix=pattern.slice(0,tokenIndex);
    const suffix=pattern.slice(tokenIndex+2);
    if(!prefix && !suffix) return null;
    return {pattern,prefix,suffix};
  }

  function patternMatches(pattern,value){
    const parsed=parsePattern(pattern);
    if(!parsed) return false;
    const text=String(value || "").trim();
    return text.startsWith(parsed.prefix) && text.endsWith(parsed.suffix) &&
      text.length>=parsed.prefix.length+parsed.suffix.length;
  }

  function exampleForPattern(value){
    const parsed=parsePattern(value);
    if(!parsed) return String(value || "").trim() || EXAMPLE_TEXT;
    return `${parsed.prefix}${EXAMPLE_TEXT}${parsed.suffix}`;
  }

  function getPattern(){
    return String(byId("boxWrapPattern")?.value || "").trim();
  }

  function escapeRegex(value){
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  }

  function wildcardTemplateSource(value){
    const template=String(value || "").trim();
    if(!template.includes("내용")) return "";
    return template.split("내용").map(escapeRegex).join("[\\s\\S]*?");
  }

  function pairedBoundary(value){
    const text=String(value || "").trim();
    if(text.length<2) return null;
    const pairs=new Map([
      ["[","]"],["(",")"],["{","}"],["<",">"],
      ["「","」"],["『","』"],["【","】"],["〈","〉"],["《","》"],
      ["“","”"],["‘","’"],["\"","\""],["'","'"]
    ]);
    const first=Array.from(text)[0];
    const last=Array.from(text).at(-1);
    if(pairs.get(first)===last) return {first,last};
    if(first===last && /[\p{P}\p{S}]/u.test(first)) return {first,last};
    if(/[\p{P}\p{S}]/u.test(first) && /[\p{P}\p{S}]/u.test(last)) return {first,last};
    return null;
  }

  function regexSourceFromSelection(value){
    const selected=String(value || "").trim();
    if(!selected) return "";
    const boundary=pairedBoundary(selected);
    const body=boundary
      ? `${escapeRegex(boundary.first)}(?:(?!${escapeRegex(boundary.last)})[\\s\\S])*${escapeRegex(boundary.last)}`
      : selected.split(/\s+/).map(escapeRegex).join("\\s*");
    return `(?:^|\\n)[ \\t]*${body}[ \\t]*(?=\\n|$)`;
  }

  function compileSearchPattern(query,wildcardSearch=false){
    const value=String(query || "").trim();
    if(!value) return {ok:false,error:"검색할 내용을 입력해줘.",regex:null,source:""};
    if(!wildcardSearch) return {ok:true,error:"",regex:null,source:""};
    const templateSource=wildcardTemplateSource(value);
    const source=templateSource || value;
    try{
      const regex=new RegExp(source,"gu");
      const probe=new RegExp(source,"u");
      if(probe.test("")) return {ok:false,error:"빈 내용과 일치하는 검색식은 사용할 수 없어요.",regex:null,source:""};
      return {ok:true,error:"",regex,source};
    }catch(error){
      return {ok:false,error:`정규식 검색 내용을 확인해줘: ${error.message}`,regex:null,source:""};
    }
  }

  function validateRegexSource(value){
    const source=String(value || "").trim();
    if(!source) return {ok:false,error:"검색 결과에서 적용할 줄을 선택해줘.",source:""};
    try{
      const regex=new RegExp(source,"u");
      if(regex.test("")) return {ok:false,error:"빈 내용과 일치하는 정규식은 사용할 수 없어요.",source:""};
      return {ok:true,error:"",source};
    }catch(error){
      return {ok:false,error:`정규식을 확인해줘: ${error.message}`,source:""};
    }
  }

  function normalizeDeclarations(value){
    const raw=String(value || "").replace(/\/\*[\s\S]*?\*\//g,"").trim();
    if(!raw) return {ok:false,error:"CSS 속성을 입력해줘.",css:""};
    if(/[{}<>]/.test(raw)){
      return {ok:false,error:"클래스명과 { } 없이 CSS 속성만 입력해줘.",css:""};
    }

    const declarations=[];
    for(const chunk of raw.split(";")){
      const declaration=chunk.trim();
      if(!declaration) continue;
      const colon=declaration.indexOf(":");
      if(colon<=0){
        return {ok:false,error:`CSS 형식을 확인해줘: ${declaration}`,css:""};
      }
      const property=declaration.slice(0,colon).trim();
      const propertyValue=declaration.slice(colon+1).trim();
      if(!/^(?:--[a-z0-9_-]+|-?[a-z][a-z0-9-]*)$/i.test(property) || !propertyValue){
        return {ok:false,error:`CSS 속성을 확인해줘: ${declaration}`,css:""};
      }
      if(/(?:@import|expression\s*\(|javascript\s*:)/i.test(propertyValue)){
        return {ok:false,error:`사용할 수 없는 CSS 값이에요: ${property}`,css:""};
      }
      declarations.push(`${property}: ${propertyValue}`);
    }

    if(!declarations.length) return {ok:false,error:"CSS 속성을 입력해줘.",css:""};
    return {ok:true,error:"",css:`${declarations.join(";\n")};`};
  }

  function getRules(){
    return rules.map(rule=>({
      ...rule,
      removeTexts:Array.isArray(rule.removeTexts) && rule.removeTexts.length
        ? [...rule.removeTexts]
        : (rule.removeText ? [String(rule.removeText)] : [])
    }));
  }

  function getOptions(){
    return {enabled:!!byId("enableBoxWrap")?.checked && rules.length>0,rules:getRules()};
  }

  function setMessage(message,isError=false){
    const summary=byId("boxWrapSearchSummary");
    if(!summary) return;
    summary.textContent=message || "";
    summary.classList.toggle("is-error",!!isError);
  }

  function updateControls(expanded){
    const toggle=byId("boxAddToggle");
    const settings=byId("boxAddSettings");
    const section=byId("boxAddSection");
    const arrow=byId("boxAddArrow");
    const enabled=byId("enableBoxWrap");
    const isExpanded=typeof expanded==="boolean"
      ? expanded
      : toggle?.getAttribute("aria-expanded")==="true";

    toggle?.setAttribute("aria-expanded",String(isExpanded));
    if(enabled) enabled.checked=isExpanded;
    if(settings){
      settings.hidden=!isExpanded;
      settings.setAttribute("aria-hidden",String(!isExpanded));
    }
    section?.classList.toggle("is-open",isExpanded);
    if(arrow) arrow.textContent=isExpanded ? "▾" : "▸";
    return isExpanded;
  }

  function toggleSection(){
    const expanded=byId("boxAddToggle")?.getAttribute("aria-expanded")==="true";
    return updateControls(!expanded);
  }

  function sourceLinesWithStarts(source){
    const text=String(source || "").replace(/\r\n/g,"\n").replace(/\r/g,"\n");
    const lines=text.split("\n");
    const starts=[];
    let offset=0;
    lines.forEach(line=>{
      starts.push(offset);
      offset+=line.length+1;
    });
    return {text,lines,starts};
  }

  function lineIndexAt(starts,offset){
    let low=0;
    let high=starts.length-1;
    while(low<=high){
      const middle=(low+high)>>1;
      if(starts[middle]<=offset) low=middle+1;
      else high=middle-1;
    }
    return Math.max(0,high);
  }

  function contextForMatch(lines,startLine,endLine,radius){
    const start=Math.max(0,startLine-radius);
    const end=Math.min(lines.length-1,endLine+radius);
    const context=[];
    for(let index=start;index<=end;index++){
      context.push({
        lineIndex:index,
        text:String(lines[index] || ""),
        isMatch:index>=startLine && index<=endLine
      });
    }
    return context;
  }

  function findSourceMatches(source,query,contextLines=SEARCH_CONTEXT_LINES,options={}){
    const keyword=String(query || "").trim();
    if(!keyword) return [];
    const parsed=sourceLinesWithStarts(source);
    const {text,lines,starts}=parsed;
    const radius=Math.max(0,Math.floor(Number(contextLines) || 0));
    const matches=[];

    if(options.wildcardSearch===true){
      const compiled=compileSearchPattern(keyword,true);
      if(!compiled.ok) return [];
      let match;
      while((match=compiled.regex.exec(text))){
        const startOffset=match.index;
        const endOffset=Math.max(startOffset,match.index+match[0].length-1);
        const startLine=lineIndexAt(starts,startOffset);
        const endLine=lineIndexAt(starts,endOffset);
        matches.push({
          lineIndex:startLine,
          endLineIndex:endLine,
          startOffset,
          endOffset:match.index+match[0].length,
          text:match[0],
          context:contextForMatch(lines,startLine,endLine,radius)
        });
        if(match[0]==="") compiled.regex.lastIndex++;
      }
      return matches;
    }

    lines.forEach((line,lineIndex)=>{
      if(!String(line).includes(keyword)) return;
      const lineOffset=String(line).indexOf(keyword);
      matches.push({
        lineIndex,
        endLineIndex:lineIndex,
        startOffset:starts[lineIndex]+lineOffset,
        endOffset:starts[lineIndex]+lineOffset+keyword.length,
        text:String(line),
        context:contextForMatch(lines,lineIndex,lineIndex,radius)
      });
    });
    return matches;
  }

  function findSourceParagraphs(source,query){
    return findSourceMatches(source,query).map(match=>match.text);
  }

  function countSourceParagraphs(source,query){
    return findSourceMatches(source,query).length;
  }

  function availableSearchSources(){
    const api=typeof window!=="undefined" ? window.BookieEditableFrontPreview : null;
    const files=api?.getPreviewFiles?.() || [];
    if(files.length){
      return files.filter(file=>file.text).map((file,index)=>({
        key:file.key || `file-${index}`,
        fileName:file.fileName || `파일 ${index+1}`,
        fileIndex:Number.isInteger(file.fileIndex) ? file.fileIndex : index,
        text:String(file.text || "")
      }));
    }
    const source=typeof fileText!=="undefined" ? String(fileText || "") : "";
    return source ? [{key:"combined",fileName:"TXT",fileIndex:0,text:source}] : [];
  }

  function collectSearchMatches(query,wildcardSearch=false){
    const matches=[];
    availableSearchSources().forEach(source=>{
      findSourceMatches(source.text,query,SEARCH_CONTEXT_LINES,{wildcardSearch}).forEach(match=>{
        matches.push({
          ...match,
          key:source.key,
          fileName:source.fileName,
          fileIndex:source.fileIndex,
          sourceText:source.text
        });
      });
    });
    return matches;
  }

  function showSearchPanel(show){
    const panel=byId("boxSearchPanel");
    if(panel) panel.hidden=!show;
  }

  function renderSearchResults(){
    const host=byId("boxSearchResults");
    if(!host) return;
    if(!previewQuery){
      host.innerHTML='<div class="boxSearchEmpty">검색 결과가 여기에 표시돼요.</div>';
      return;
    }
    if(!searchMatches.length){
      host.innerHTML='<div class="boxSearchEmpty">일치하는 줄이 없어요.</div>';
      return;
    }
    host.innerHTML=searchMatches.map((match,index)=>
      `<button type="button" class="boxSearchResultLine${index===selectedSearchIndex ? " is-selected" : ""}" `+
        `data-box-search-index="${index}" aria-pressed="${index===selectedSearchIndex}">`+
        `<span class="boxSearchResultNo">${match.fileIndex+1}권 · L${match.lineIndex+1}</span>`+
        `<span class="boxSearchResultText">${match.text ? escapeHtml(match.text) : "&nbsp;"}</span>`+
      '</button>'
    ).join("");
  }

  function activateSearchResult(index,sourceText="",selectionText=""){
    const numeric=Number(index);
    if(!Number.isInteger(numeric) || numeric<0 || numeric>=searchMatches.length) return false;
    const nextPreview=String(sourceText || searchMatches[numeric].text);
    const nextSelection=String(selectionText || "");
    const nextKey=`${searchMatches[numeric]?.key || ""}:${numeric}:${String(byId("boxRegexPattern")?.value || "").trim()}:${nextPreview}:${nextSelection}`;
    if(nextKey!==currentSelectionKey() && (activeDeleteTexts.length || byId("boxDeleteText")?.value)) clearDeleteState(true);
    selectedSearchIndex=numeric;
    previewText=nextPreview;
    previewSelectionText=nextSelection;
    renderSearchResults();
    updateExample();
    return true;
  }

  function clearSearchSelection(){
    selectedSearchIndex=-1;
    previewText="";
    previewSelectionText="";
    const input=byId("boxRegexPattern");
    if(input) input.value="";
    clearDeleteState(true);
    renderSearchResults();
    updateExample();
    setMessage("선택을 해제했어요.");
    return false;
  }

  function selectSearchResult(index){
    const numeric=Number(index);
    if(!Number.isInteger(numeric) || numeric<0 || numeric>=searchMatches.length) return false;
    if(selectedSearchIndex===numeric) return clearSearchSelection();
    const match=searchMatches[numeric];
    return !!setRegexFromSelection(match.text,numeric,match.text);
  }

  function setRegexFromSelection(value,index=selectedSearchIndex,sourceText=""){
    const source=regexSourceFromSelection(value);
    if(!source) return "";
    const numeric=Number(index);
    const targetMatch=searchMatches[numeric];
    const nextPreview=String(sourceText || targetMatch?.text || "");
    const selectedText=String(value || "");
    const nextKey=`${targetMatch?.key || ""}:${numeric}:${source}:${nextPreview}:${selectedText}`;
    if((activeDeleteTexts.length || byId("boxDeleteText")?.value) && nextKey!==currentSelectionKey()) clearDeleteState(true);
    const input=byId("boxRegexPattern");
    if(input) input.value=source;
    activateSearchResult(index,sourceText,selectedText);
    setMessage(`선택한 줄의 정규식을 만들었어요: ${source}`);
    return source;
  }

  function presetNumber(){
    const value=Number(byId("boxPresetSelect")?.value || 0);
    return value>=1 && value<=6 ? value : 0;
  }

  function presetClassName(number,italic=false){
    const value=Number(number);
    if(value<1 || value>6) return "";
    return `box${value}${italic ? "1" : ""}`;
  }

  function extractDeclarationsFromBoxCss(className){
    const css=typeof BOX_CSS!=="undefined" ? BOX_CSS : "";
    const safeName=String(className || "").replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    if(!safeName) return "";
    const match=css.match(new RegExp(`\\.${safeName}\\s*\\{([\\s\\S]*?)\\}`));
    if(!match) return "";
    const lines=match[1].trim().split("\n");
    const indent=lines.reduce((smallest,line)=>{
      if(!line.trim()) return smallest;
      const size=(line.match(/^\s*/) || [""])[0].length;
      return smallest===null ? size : Math.min(smallest,size);
    },null) || 0;
    return lines.map(line=>line.slice(indent)).join("\n").trim();
  }

  function describeDeclarations(value){
    const descriptions={
      margin:"박스 바깥 여백: 위 오른쪽 아래 왼쪽",
      padding:"박스 안쪽 여백",
      "background-color":"박스 배경색",
      "border-radius":"모서리 둥글기: 왼쪽 위부터 시계 방향",
      color:"글자색",
      border:"박스 테두리: 두께 모양 색상"
    };
    const output=[];
    String(value || "").split("\n").forEach(line=>{
      const match=line.trim().match(/^([a-z-]+)\s*:/i);
      const description=match ? descriptions[match[1].toLowerCase()] : "";
      if(description) output.push(`/* ${description} */`);
      output.push(line.trim());
    });
    return output.join("\n").trim();
  }

  function updatePresetControls(){
    const number=presetNumber();
    const italic=byId("boxPresetItalic");
    if(italic){
      italic.disabled=!number;
      if(italic.disabled) italic.checked=false;
    }
    return number;
  }

  function applyPreset(){
    const number=updatePresetControls();
    if(!number){
      updateExample();
      return "";
    }

    const italic=!!byId("boxPresetItalic")?.checked;
    const className=presetClassName(number,italic);
    const declarations=extractDeclarationsFromBoxCss(className);
    const input=byId("boxCssDeclarations");
    if(input && declarations) input.value=declarations;
    setMessage("");
    updateExample();
    return className;
  }

  function removeLiteralTexts(value,removeTexts){
    const targets=Array.isArray(removeTexts) ? removeTexts : [removeTexts];
    return targets.reduce((result,target)=>{
      const text=String(target || "");
      return text ? result.split(text).join("") : result;
    },String(value || ""));
  }

  function currentSelectionKey(regexSource=byId("boxRegexPattern")?.value || "",index=selectedSearchIndex){
    const match=searchMatches[index];
    return `${match?.key || ""}:${index}:${String(regexSource || "").trim()}:${previewText}:${previewSelectionText}`;
  }

  function clearDeleteState(clearInput=true){
    activeDeleteTexts=[];
    deleteSelectionKey="";
    const input=byId("boxDeleteText");
    if(clearInput && input) input.value="";
  }

  function applyDeleteText(){
    const input=byId("boxDeleteText");
    const value=String(input?.value || "");
    if(!value.trim()){
      setMessage("삭제할 단어를 입력해줘.",true);
      input?.focus();
      return "";
    }
    if(!activeDeleteTexts.includes(value)) activeDeleteTexts.push(value);
    deleteSelectionKey=currentSelectionKey();
    if(input) input.value="";
    updateExample();
    setMessage(`${activeDeleteTexts.map(target=>`“${target}”`).join(", ")} 삭제를 예시에 반영했어요. 설정 추가를 누르면 실제 적용돼요.`);
    return value;
  }

  function regexMatchesInText(source,regexSource,limit=50){
    const value=String(regexSource || "").trim();
    if(!value) return [];
    try{
      const regex=new RegExp(value,"gu");
      const results=[];
      let match;
      while(results.length<limit && (match=regex.exec(String(source || "")))){
        if(match[0]) results.push(match[0].trim());
        else regex.lastIndex++;
      }
      return results;
    }catch(error){
      return [];
    }
  }

  function alternativePreviewTexts(selectedText,regexSource){
    const match=searchMatches[selectedSearchIndex];
    if(!match?.sourceText) return [];
    const found=regexMatchesInText(match.sourceText,regexSource,100);
    const alternatives=[];
    let skippedSelected=false;
    for(const value of found){
      if(!skippedSelected && value.trim()===String(selectedText || "").trim()){
        skippedSelected=true;
        continue;
      }
      alternatives.push(value);
      if(alternatives.length>=5) break;
    }
    return alternatives;
  }

  function applyPreviewCss(element,css){
    if(!element) return;
    element.removeAttribute?.("style");
    if(css && element.style) element.style.cssText=css;
  }

  function updateExample(){
    const query=getPattern();
    const example=previewQuery===query && previewText
      ? previewText
      : (query || EXAMPLE_TEXT);
    const source=byId("boxSourceExample");
    const result=byId("boxResultExample");
    const resultParagraph=byId("boxResultParagraph");
    const alternatives=byId("boxAlternativePreviews");
    const regexSource=String(byId("boxRegexPattern")?.value || "").trim();
    const normalized=normalizeDeclarations(byId("boxCssDeclarations")?.value || "");
    const css=normalized.ok ? normalized.css : "";
    if(source) source.textContent=example;
    if(resultParagraph) resultParagraph.textContent=removeLiteralTexts(example,activeDeleteTexts);
    applyPreviewCss(result,css);
    if(alternatives){
      const examples=alternativePreviewTexts(example,regexSource);
      alternatives.innerHTML=examples.map((value,index)=>
        `<div class="boxAlternativeSample">`+
          `<div class="boxAlternativeSampleLabel">추가 적용 예시 ${index+1}</div>`+
          `<div class="boxAlternativeExample"><p>${escapeHtml(removeLiteralTexts(value,activeDeleteTexts))}</p></div>`+
        '</div>'
      ).join("");
      alternatives.querySelectorAll?.(".boxAlternativeExample").forEach(element=>applyPreviewCss(element,css));
    }
  }

  function runSearch(){
    const input=byId("boxWrapPattern");
    const query=getPattern();
    if(!query){
      searchMatches=[];
      searchMatchTotal=0;
      previewQuery="";
      previewText="";
      previewSelectionText="";
      selectedSearchIndex=-1;
      renderSearchResults();
      showSearchPanel(false);
      updateExample();
      setMessage("검색할 내용을 입력해줘.",true);
      input?.focus();
      return 0;
    }

    const sources=availableSearchSources();
    if(!sources.length){
      searchMatches=[];
      searchMatchTotal=0;
      previewQuery="";
      previewText="";
      previewSelectionText="";
      selectedSearchIndex=-1;
      renderSearchResults();
      showSearchPanel(false);
      updateExample();
      setMessage("TXT 파일을 먼저 넣어줘.",true);
      return 0;
    }

    const wildcardSearch=!!byId("boxRegexSearch")?.checked;
    const compiled=compileSearchPattern(query,wildcardSearch);
    if(!compiled.ok){
      searchMatches=[];
      searchMatchTotal=0;
      previewQuery="";
      previewText="";
      selectedSearchIndex=-1;
      renderSearchResults();
      showSearchPanel(false);
      updateExample();
      setMessage(compiled.error,true);
      return 0;
    }

    const allMatches=collectSearchMatches(query,wildcardSearch);
    searchMatchTotal=allMatches.length;
    searchMatches=allMatches.slice(0,SEARCH_RESULT_LIMIT);
    previewQuery=query;
    selectedSearchIndex=-1;
    previewText="";
    previewSelectionText="";
    const regexInput=byId("boxRegexPattern");
    if(regexInput) regexInput.value="";
    clearDeleteState(true);
    renderSearchResults();
    showSearchPanel(true);
    updateExample();
    const limitMessage=searchMatchTotal>SEARCH_RESULT_LIMIT
      ? ` 전체 ${searchMatchTotal}개 중 앞의 ${SEARCH_RESULT_LIMIT}개만 표시했어요.`
      : "";
    setMessage(searchMatches.length
      ? `${searchMatches.length}개 결과를 찾았어요.${limitMessage}${wildcardSearch ? " ‘내용’은 모든 글자로 검색했어요." : ""} 적용할 줄을 선택해줘.`
      : "검색 결과가 없어요.");
    return searchMatches.length;
  }

  function renderRules(){
    const list=byId("boxRuleList");
    if(!list) return;
    if(!rules.length){
      list.innerHTML='<div class="boxRuleEmpty">아직 추가한 BOX 설정이 없어요.</div>';
      return;
    }

    list.innerHTML=rules.map(rule=>{
      const meta=[];
      const removeTexts=Array.isArray(rule.removeTexts) && rule.removeTexts.length
        ? rule.removeTexts
        : (rule.removeText ? [rule.removeText] : []);
      if(removeTexts.length) meta.push(`<span>${removeTexts.map(value=>`“${escapeHtml(value)}”`).join(", ")} 삭제</span>`);
      if(rule.requireBlankAround) meta.push('<span>위·아래 빈줄만</span>');
      return `<div class="boxRuleItem" data-box-rule-id="${rule.id}">`+
        '<div class="boxRuleInfo">'+
          `<div class="boxRuleTitle"><span>/${escapeHtml(rule.regexSource)}/</span><span class="boxRuleClass">.${rule.className}</span></div>`+
          (meta.length ? `<div class="boxRuleMeta">${meta.join("")}</div>` : "")+
          `<pre class="boxRuleCss">${escapeHtml(rule.declarations)}</pre>`+
        '</div>'+
        `<button type="button" class="boxRuleRemove" data-remove-box-rule="${rule.id}" aria-label="BOX 설정 삭제">×</button>`+
      '</div>';
    }).join("");
  }

  function addRule(){
    const regexInput=byId("boxRegexPattern");
    const cssInput=byId("boxCssDeclarations");
    const validatedRegex=validateRegexSource(regexInput?.value || "");
    if(!validatedRegex.ok){
      setMessage(validatedRegex.error,true);
      regexInput?.focus();
      return null;
    }

    const normalized=normalizeDeclarations(cssInput?.value || "");
    if(!normalized.ok){
      setMessage(normalized.error,true);
      cssInput?.focus();
      return null;
    }

    const ruleValues={
      regexSource:validatedRegex.source,
      searchQuery:getPattern(),
      removeTexts:[...activeDeleteTexts],
      requireBlankAround:!!byId("boxRequireBlankAround")?.checked,
      declarations:normalized.css
    };
    const existing=rules.find(rule=>rule.regexSource===validatedRegex.source);
    if(existing){
      Object.assign(existing,ruleValues);
      setMessage(`/${validatedRegex.source}/의 ${existing.className} 설정을 변경했어요.`);
      renderRules();
      updateExample();
      return {...existing};
    }

    const id=nextRuleId++;
    const rule={id,className:`boxt_${id}`,...ruleValues};
    rules.push(rule);
    setMessage(`/${validatedRegex.source}/을 .${rule.className} 설정으로 추가했어요.`);
    renderRules();
    updateExample();
    return {...rule};
  }

  function removeRule(id){
    const numericId=Number(id);
    const index=rules.findIndex(rule=>rule.id===numericId);
    if(index<0) return false;
    const [removed]=rules.splice(index,1);
    renderRules();
    setMessage(`/${removed.regexSource}/의 .${removed.className} 설정을 삭제했어요.`);
    return true;
  }

  function buildCustomCss(ruleList=rules){
    return (Array.isArray(ruleList) ? ruleList : [])
      .filter(rule=>/^boxt_[1-9]\d*$/.test(String(rule?.className || "")))
      .map(rule=>`.${rule.className} {\n${String(rule.declarations || "").split("\n").map(line=>`  ${line}`).join("\n")}\n}`)
      .join("\n\n");
  }

  function buildEpubCss(baseCss){
    const base=String(baseCss || "").trimEnd();
    const custom=buildCustomCss();
    if(!custom) return `${base}\n`;
    return `${base}\n\n/* User BOX styles */\n${custom}\n`;
  }

  function hasState(){
    const defaultCss=normalizeDeclarations(extractDeclarationsFromBoxCss("box4"));
    const currentCss=normalizeDeclarations(byId("boxCssDeclarations")?.value || "");
    const changedCss=currentCss.ok && (!defaultCss.ok || currentCss.css!==defaultCss.css);
    return rules.length>0 || !!getPattern() || !!String(byId("boxRegexPattern")?.value || "").trim() ||
      changedCss || !!String(byId("boxDeleteText")?.value || "") || activeDeleteTexts.length>0 ||
      !!byId("boxRequireBlankAround")?.checked || !!byId("boxRegexSearch")?.checked ||
      presetNumber()!==4 || !!byId("boxPresetItalic")?.checked || !!byId("enableBoxWrap")?.checked;
  }

  function reset(){
    rules=[];
    nextRuleId=1;
    searchMatches=[];
    searchMatchTotal=0;
    previewQuery="";
    previewText="";
    previewSelectionText="";
    selectedSearchIndex=-1;
    clearDeleteState(true);
    const pattern=byId("boxWrapPattern");
    const regex=byId("boxRegexPattern");
    const css=byId("boxCssDeclarations");
    const preset=byId("boxPresetSelect");
    const italic=byId("boxPresetItalic");
    const remove=byId("boxDeleteText");
    const blank=byId("boxRequireBlankAround");
    const regexSearch=byId("boxRegexSearch");
    const enabled=byId("enableBoxWrap");
    if(pattern) pattern.value="";
    if(regex) regex.value="";
    if(css) css.value="";
    if(preset) preset.value="4";
    if(remove) remove.value="";
    if(blank) blank.checked=false;
    if(regexSearch) regexSearch.checked=false;
    if(enabled) enabled.checked=false;
    if(italic){
      italic.checked=false;
      italic.disabled=false;
    }
    setMessage("");
    renderSearchResults();
    showSearchPanel(false);
    renderRules();
    applyPreset();
    updateControls(false);
  }

  function init(){
    if(initialized) return;
    initialized=true;
    const pattern=byId("boxWrapPattern");
    const regex=byId("boxRegexPattern");
    const css=byId("boxCssDeclarations");
    const remove=byId("boxDeleteText");
    const results=byId("boxSearchResults");
    const regexSearch=byId("boxRegexSearch");
    byId("boxAddToggle")?.addEventListener("click",toggleSection);
    byId("boxWrapSearchButton")?.addEventListener("click",runSearch);
    byId("boxDeleteTextButton")?.addEventListener("click",applyDeleteText);
    byId("boxAddRuleButton")?.addEventListener("click",addRule);
    byId("boxPresetSelect")?.addEventListener("change",applyPreset);
    byId("boxPresetItalic")?.addEventListener("change",applyPreset);
    byId("enableBoxWrap")?.addEventListener("change",event=>{
      setMessage("");
      updateControls(!!event.target.checked);
    });
    pattern?.addEventListener("keydown",event=>{
      if(event.key!=="Enter" || event.isComposing) return;
      event.preventDefault();
      runSearch();
    });
    pattern?.addEventListener("input",()=>{
      searchMatches=[];
      searchMatchTotal=0;
      previewQuery="";
      previewText="";
      previewSelectionText="";
      selectedSearchIndex=-1;
      clearDeleteState(true);
      setMessage("");
      renderSearchResults();
      showSearchPanel(false);
      updateExample();
    });
    regexSearch?.addEventListener("change",()=>{
      searchMatches=[];
      searchMatchTotal=0;
      previewQuery="";
      previewText="";
      previewSelectionText="";
      selectedSearchIndex=-1;
      clearDeleteState(true);
      setMessage("");
      renderSearchResults();
      showSearchPanel(false);
      updateExample();
    });
    regex?.addEventListener("input",()=>{
      if(activeDeleteTexts.length && currentSelectionKey()!==deleteSelectionKey) clearDeleteState(true);
      setMessage("");
      updateExample();
    });
    css?.addEventListener("input",()=>{
      setMessage("");
      updateExample();
    });
    remove?.addEventListener("input",()=>{
      setMessage("");
    });
    results?.addEventListener("click",event=>{
      const row=event.target.closest?.("[data-box-search-index]");
      if(row) selectSearchResult(Number(row.dataset.boxSearchIndex));
    });
    byId("boxRuleList")?.addEventListener("click",event=>{
      const button=event.target.closest?.("[data-remove-box-rule]");
      if(button) removeRule(button.dataset.removeBoxRule);
    });
    renderSearchResults();
    showSearchPanel(false);
    renderRules();
    if(byId("boxPresetSelect") && !byId("boxPresetSelect").value) byId("boxPresetSelect").value="4";
    updatePresetControls();
    applyPreset();
    updateControls(false);
  }

  if(typeof document!=="undefined") document.addEventListener("DOMContentLoaded",init);

  return {
    init,
    reset,
    hasState,
    getPattern,
    getRules,
    getOptions,
    parsePattern,
    patternMatches,
    exampleForPattern,
    wildcardTemplateSource,
    compileSearchPattern,
    regexSourceFromSelection,
    validateRegexSource,
    normalizeDeclarations,
    runSearch,
    findSourceMatches,
    collectSearchMatches,
    findSourceParagraphs,
    countSourceParagraphs,
    renderSearchResults,
    selectSearchResult,
    setRegexFromSelection,
    presetNumber,
    presetClassName,
    extractDeclarationsFromBoxCss,
    describeDeclarations,
    updatePresetControls,
    applyPreset,
    applyDeleteText,
    clearDeleteState,
    regexMatchesInText,
    addRule,
    removeRule,
    buildCustomCss,
    buildEpubCss,
    updateExample,
    updateControls,
    toggleSection
  };
})();

if(typeof window!=="undefined") window.BookieBoxWrapSettings=BookieBoxWrapSettings;
