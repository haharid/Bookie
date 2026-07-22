// BOX-add UI state and user-defined paragraph/CSS rules.
// Search can be literal or wildcard-based; selecting a result line creates an editable regular expression.

const BookieBoxWrapSettings=(()=>{
  const EXAMPLE_TEXT="예시 문장입니다.";
  const WILDCARD_TOKEN="티롱";
  const MULTILINE_WILDCARD_TOKEN="소롱";
  const SEARCH_CONTEXT_LINES=10;
  const SEARCH_RESULT_LIMIT=30;
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
  let regexEditing=false;
  let paragraphEditing=false;
  let appliedRegexSource="";

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
    if(pattern==="[]") return `[${WILDCARD_TOKEN}]`;
    if(pattern==="()") return `(${WILDCARD_TOKEN})`;
    return pattern;
  }

  // Kept for older saved rules and callers. New BOX rules use regexSource.
  function parsePattern(value){
    const pattern=normalizePattern(value);
    const tokenMatch=pattern.match(/티롱|소롱/u);
    if(!tokenMatch) return null;
    const tokenIndex=tokenMatch.index;
    const token=tokenMatch[0];
    const prefix=pattern.slice(0,tokenIndex);
    const suffix=pattern.slice(tokenIndex+token.length);
    if(!prefix && !suffix) return null;
    return {pattern,prefix,suffix,token};
  }

  function patternMatches(pattern,value){
    const parsed=parsePattern(pattern);
    if(!parsed) return false;
    const text=String(value || "").trim();
    if(!text.startsWith(parsed.prefix) || !text.endsWith(parsed.suffix) ||
      text.length<parsed.prefix.length+parsed.suffix.length) return false;
    if(parsed.token===MULTILINE_WILDCARD_TOKEN &&
      /^[\p{P}\p{S}]+$/u.test(parsed.prefix) && /^[\p{P}\p{S}]+$/u.test(parsed.suffix)){
      const inner=text.slice(parsed.prefix.length,text.length-parsed.suffix.length);
      if(inner.includes(parsed.prefix) || inner.includes(parsed.suffix)) return false;
    }
    return true;
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

  function quoteShortcutSource(value){
    const query=String(value || "").trim();
    if(query==='"') return '^[ \\t]*(?:"|“)';
    if(query==="'") return "^[ \\t]*(?:'|‘)";
    if(query==='""') return '(?:"[^"\\r\\n]*"|“[^”\\r\\n]*”)';
    if(query==="''") return "(?:'[^'\\r\\n]*'|‘[^’\\r\\n]*’)";
    return "";
  }

  function startsWithSearchSymbol(value){
    const first=Array.from(String(value || "").trim())[0] || "";
    return !!first && /[\p{P}\p{S}]/u.test(first);
  }

  function isWrappedWildcardTemplate(value){
    const template=String(value || "").trim();
    return /^[\p{P}\p{S}]+(?:티롱|소롱)[\p{P}\p{S}]+$/u.test(template);
  }

  function wildcardTemplateSource(value){
    const template=String(value || "").trim();
    if(!template.includes(WILDCARD_TOKEN) && !template.includes(MULTILINE_WILDCARD_TOKEN)) return "";
    const strictSorong=template.match(/^([\p{P}\p{S}]+)소롱([\p{P}\p{S}]+)$/u);
    if(strictSorong){
      const opening=escapeRegex(strictSorong[1]);
      const closing=escapeRegex(strictSorong[2]);
      return `${opening}(?:(?!${opening}|${closing})[\\s\\S])+?${closing}`;
    }
    let source="";
    let cursor=0;
    const tokenPattern=/티롱|소롱/gu;
    const tokens=Array.from(template.matchAll(tokenPattern));
    tokens.forEach((match,index)=>{
      source+=escapeRegex(template.slice(cursor,match.index));
      const tokenEnd=match.index+match[0].length;
      const nextTokenStart=tokens[index+1]?.index ?? template.length;
      const nextLiteral=template.slice(tokenEnd,nextTokenStart);
      if(match[0]===MULTILINE_WILDCARD_TOKEN && nextLiteral){
        source+=`(?:(?!${escapeRegex(nextLiteral)})[\\s\\S])+?`;
      }else{
        source+=match[0]===MULTILINE_WILDCARD_TOKEN ? "[\\s\\S]+?" : "[^\\r\\n]+?";
      }
      cursor=tokenEnd;
    });
    return source+escapeRegex(template.slice(cursor));
  }

  function wildcardTemplateFromSelection(value){
    const selected=String(value || "").replace(/\r\n?/g,"\n").trim();
    if(!selected) return "";
    const wildcardToken=selected.includes("\n") ? MULTILINE_WILDCARD_TOKEN : WILDCARD_TOKEN;

    const quotePairs={
      "\"":"\"",
      "'":"'",
      "“":"”",
      "‘":"’",
      "「":"」",
      "『":"』",
      "《":"》",
      "〈":"〉"
    };
    const bracketPairs={"[":"]","(":")","{":"}","【":"】","〔":"〕"};
    const first=selected[0];
    const quoteClose=quotePairs[first];
    if(quoteClose && selected.endsWith(quoteClose) && selected.length>1){
      const inner=selected.slice(1,-1).trim();
      const ending=(inner.match(/[.!?。！？…]+$/u) || [""])[0];
      return `${first}${wildcardToken}${ending}${quoteClose}`;
    }

    let cursor=0;
    let template="";
    while(cursor<selected.length){
      const open=selected[cursor];
      const close=bracketPairs[open];
      if(!close) break;
      const closeIndex=selected.indexOf(close,cursor+1);
      if(closeIndex<0) break;
      template+=`${open}${wildcardToken}${close}`;
      cursor=closeIndex+1;
      while(cursor<selected.length && /\s/u.test(selected[cursor])) cursor++;
    }

    const remaining=selected.slice(cursor).trim();
    if(remaining){
      const ending=(remaining.match(/[.!?。！？…]+$/u) || [""])[0];
      template+=`${wildcardToken}${ending}`;
    }else if(!template){
      template=wildcardToken;
    }
    return template;
  }

  function templateRegexSource(template){
    return wildcardTemplateSource(template);
  }

  function exactRegexSourceFromSelection(value){
    const selected=String(value || "").replace(/\r\n?/g,"\n").trim();
    if(!selected) return "";
    const body=escapeRegex(selected).replace(/\n/g,"\\n");
    return `(?:^|\\n)[ \\t]*${body}[ \\t]*(?=\\n|$)`;
  }

  function regexSourceFromSelection(value){
    const selected=String(value || "").replace(/\r\n?/g,"\n").trim();
    const template=wildcardTemplateFromSelection(selected);
    if(!template) return "";
    const body=templateRegexSource(template);
    return `(?:^|\\n)[ \\t]*${body}[ \\t]*(?=\\n|$)`;
  }

  function regexSourceFromWrappedSearch(value){
    const template=String(value || "").trim();
    if(!isWrappedWildcardTemplate(template)) return "";
    const body=wildcardTemplateSource(template);
    return body ? `(?:^|\\n)[ \\t]*${body}[ \\t]*(?=\\n|$)` : "";
  }

  function compileSearchPattern(query){
    const value=String(query || "").trim();
    if(!value) return {ok:false,error:"검색할 내용을 입력해줘.",regex:null,source:""};
    const shortcutSource=quoteShortcutSource(value);
    const templateSource=wildcardTemplateSource(value);
    if(!templateSource && !shortcutSource) return {ok:true,error:"",regex:null,source:""};
    const anchoredTemplate=templateSource && startsWithSearchSymbol(value)
      ? `^[ \\t]*${templateSource}`
      : templateSource;
    const source=shortcutSource || (value.includes(MULTILINE_WILDCARD_TOKEN)
      ? `${anchoredTemplate}[ \\t]*(?=\\n|$)`
      : anchoredTemplate);
    const lineStartShortcut=value==='"' || value==="'";
    const flags=(templateSource && startsWithSearchSymbol(value)) || lineStartShortcut ? "gmu" : "gu";
    const probeFlags=flags.replace("g","");
    try{
      const regex=new RegExp(source,flags);
      const probe=new RegExp(source,probeFlags);
      if(probe.test("")) return {ok:false,error:"빈 내용과 일치하는 검색식은 사용할 수 없어요.",regex:null,source:""};
      return {ok:true,error:"",regex,source};
    }catch(error){
      return {ok:false,error:`티롱·소롱 와일드카드 검색식을 확인해줘: ${error.message}`,regex:null,source:""};
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

  function syncRegexEditor(){
    const input=byId("boxRegexPattern");
    const button=byId("boxRegexEditButton");
    if(input){
      input.readOnly=!regexEditing;
      input.setAttribute?.("aria-readonly",String(!regexEditing));
    }
    if(button){
      button.textContent=regexEditing ? "완료" : "수정";
      button.disabled=!regexEditing && !String(input?.value || "").trim();
      button.setAttribute?.("aria-label",regexEditing ? "적용 정규식 수정 완료" : "적용 정규식 수정");
    }
    return regexEditing;
  }

  function setAppliedRegexSource(value){
    appliedRegexSource=String(value || "").trim();
    regexEditing=false;
    const input=byId("boxRegexPattern");
    if(input) input.value=appliedRegexSource;
    syncRegexEditor();
    return appliedRegexSource;
  }

  function selectedParagraphValue(){
    const source=byId("boxSourceExample");
    const value=source
      ? (typeof source.innerText==="string" ? source.innerText : source.textContent)
      : previewText;
    return String(value || "").replace(/\r\n?/g,"\n").trim();
  }

  function syncParagraphEditor(){
    const source=byId("boxSourceExample");
    const editButton=byId("boxParagraphEditButton");
    const selectButton=byId("boxParagraphSelectButton");
    const hasParagraph=selectedSearchIndex>=0 && !!String(previewText || "").trim();
    if(source){
      source.contentEditable=paragraphEditing ? "true" : "false";
      source.setAttribute?.("contenteditable",String(paragraphEditing));
      source.setAttribute?.("aria-readonly",String(!paragraphEditing));
      source.classList.toggle("is-editing",paragraphEditing);
    }
    if(editButton){
      editButton.textContent=paragraphEditing ? "완료" : "수정";
      editButton.disabled=!hasParagraph;
    }
    if(selectButton) selectButton.disabled=!hasParagraph || paragraphEditing;
    return paragraphEditing;
  }

  function toggleParagraphEdit(){
    const source=byId("boxSourceExample");
    if(selectedSearchIndex<0 || !source){
      setMessage("검색 결과에서 수정할 문단을 먼저 선택해줘.",true);
      return false;
    }
    if(!paragraphEditing){
      paragraphEditing=true;
      syncParagraphEditor();
      setMessage("선택한 문단을 수정한 뒤 완료를 눌러줘.");
      source.focus?.();
      return true;
    }

    const value=selectedParagraphValue();
    if(!value){
      setMessage("선택한 문단은 비워둘 수 없어요.",true);
      source.focus?.();
      return false;
    }
    previewText=value;
    previewSelectionText=value;
    paragraphEditing=false;
    syncParagraphEditor();
    updateExample();
    setMessage("선택한 문단 수정을 완료했어요. 그대로 적용하려면 선택을 눌러줘.");
    return true;
  }

  function selectExactParagraph(){
    if(paragraphEditing){
      setMessage("선택한 문단 수정을 먼저 완료해줘.",true);
      return "";
    }
    const selectedText=selectedParagraphValue();
    const source=exactRegexSourceFromSelection(selectedText);
    if(selectedSearchIndex<0 || !source){
      setMessage("검색 결과에서 적용할 문단을 먼저 선택해줘.",true);
      return "";
    }
    const targetMatch=searchMatches[selectedSearchIndex];
    const nextKey=`${targetMatch?.key || ""}:${selectedSearchIndex}:${source}:${selectedText}:${selectedText}`;
    if((activeDeleteTexts.length || byId("boxDeleteText")?.value) && nextKey!==currentSelectionKey()) clearDeleteState(true);
    previewText=selectedText;
    previewSelectionText=selectedText;
    setAppliedRegexSource(source);
    renderSearchResults();
    updateExample();
    setMessage("선택한 문단을 원문 그대로 적용했어요.");
    return source;
  }

  function updateEditedParagraphPreview(){
    if(!paragraphEditing) return;
    const value=selectedParagraphValue();
    previewText=value;
    previewSelectionText=value;
    const resultParagraph=byId("boxResultParagraph");
    if(resultParagraph) resultParagraph.textContent=removeLiteralTexts(value,activeDeleteTexts);
  }

  function toggleRegexEdit(){
    const input=byId("boxRegexPattern");
    if(!input) return false;
    if(!regexEditing){
      if(!String(input.value || "").trim()){
        setMessage("검색 결과에서 적용할 줄을 먼저 선택해줘.",true);
        return false;
      }
      regexEditing=true;
      syncRegexEditor();
      setMessage("정규식을 수정한 뒤 완료를 눌러줘.");
      input.focus?.();
      input.select?.();
      return true;
    }

    const validated=validateRegexSource(input.value);
    if(!validated.ok){
      setMessage(validated.error,true);
      input.focus?.();
      return false;
    }
    const nextKey=currentSelectionKey(validated.source);
    if((activeDeleteTexts.length || byId("boxDeleteText")?.value) && nextKey!==deleteSelectionKey) clearDeleteState(true);
    setAppliedRegexSource(validated.source);
    updateExample();
    setMessage("정규식 수정을 완료했어요.");
    return true;
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
    const isExpanded=typeof expanded==="boolean"
      ? expanded
      : toggle?.getAttribute("aria-expanded")==="true";

    toggle?.setAttribute("aria-expanded",String(isExpanded));
    toggle?.setAttribute("aria-label",isExpanded ? "BOX 추가 설정 접기" : "BOX 추가 설정 열기");
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

  function findSourceMatches(source,query,contextLines=SEARCH_CONTEXT_LINES){
    const keyword=String(query || "").trim();
    if(!keyword) return [];
    const parsed=sourceLinesWithStarts(source);
    const {text,lines,starts}=parsed;
    const radius=Math.max(0,Math.floor(Number(contextLines) || 0));
    const matches=[];

    if(keyword.includes(WILDCARD_TOKEN) || keyword.includes(MULTILINE_WILDCARD_TOKEN) || quoteShortcutSource(keyword)){
      const compiled=compileSearchPattern(keyword);
      if(!compiled.ok) return [];
      const seenLineRanges=new Set();
      let match;
      while((match=compiled.regex.exec(text))){
        const startOffset=match.index;
        const endOffset=Math.max(startOffset,match.index+match[0].length-1);
        const startLine=lineIndexAt(starts,startOffset);
        const endLine=lineIndexAt(starts,endOffset);
        const rangeKey=`${startLine}:${endLine}`;
        if(!seenLineRanges.has(rangeKey)){
          seenLineRanges.add(rangeKey);
          matches.push({
            lineIndex:startLine,
            endLineIndex:endLine,
            startOffset,
            endOffset:match.index+match[0].length,
            text:lines.slice(startLine,endLine+1).join("\n"),
            context:contextForMatch(lines,startLine,endLine,radius)
          });
        }
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

  function collectSearchMatches(query){
    const matches=[];
    availableSearchSources().forEach(source=>{
      findSourceMatches(source.text,query,SEARCH_CONTEXT_LINES).forEach(match=>{
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
    paragraphEditing=false;
    renderSearchResults();
    updateExample();
    return true;
  }

  function clearSearchSelection(){
    selectedSearchIndex=-1;
    const autoSource=regexSourceFromWrappedSearch(previewQuery || getPattern());
    previewText=autoSource && searchMatches.length ? String(searchMatches[0].text || "") : "";
    previewSelectionText="";
    paragraphEditing=false;
    setAppliedRegexSource(autoSource);
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
    setAppliedRegexSource(source);
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

  function previewSearchIndex(){
    if(selectedSearchIndex>=0) return selectedSearchIndex;
    return previewText && regexSourceFromWrappedSearch(previewQuery) && searchMatches.length ? 0 : -1;
  }

  function currentSelectionKey(regexSource=byId("boxRegexPattern")?.value || "",index=previewSearchIndex()){
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

  function alternativePreviewData(selectedText,regexSource){
    const match=searchMatches[previewSearchIndex()];
    const source=String(regexSource || "").trim();
    if(!match?.sourceText || !source) return {items:[],total:0,remaining:0};
    try{
      const regex=new RegExp(source,"gu");
      const selected=String(selectedText || "").trim();
      const items=[];
      let total=0;
      let skippedSelected=false;
      let found;
      while((found=regex.exec(match.sourceText))){
        const value=String(found[0] || "").trim();
        if(!value){
          regex.lastIndex++;
          continue;
        }
        if(!skippedSelected && value===selected){
          skippedSelected=true;
          continue;
        }
        total++;
        if(items.length<5) items.push(value);
      }
      return {items,total,remaining:Math.max(0,total-items.length)};
    }catch(error){
      return {items:[],total:0,remaining:0};
    }
  }

  function alternativePreviewTexts(selectedText,regexSource){
    return alternativePreviewData(selectedText,regexSource).items;
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
    const regexSource=appliedRegexSource;
    const normalized=normalizeDeclarations(byId("boxCssDeclarations")?.value || "");
    const css=normalized.ok ? normalized.css : "";
    if(source && !paragraphEditing) source.textContent=example;
    if(resultParagraph) resultParagraph.textContent=removeLiteralTexts(example,activeDeleteTexts);
    applyPreviewCss(result,css);
    if(alternatives){
      const previewData=alternativePreviewData(example,regexSource);
      alternatives.innerHTML=previewData.items.map((value,index)=>
        `<div class="boxAlternativeSample">`+
          `<div class="boxAlternativeSampleLabel">자동 생성 ${index+1}</div>`+
          `<div class="boxAlternativeExample"><p>${escapeHtml(removeLiteralTexts(value,activeDeleteTexts))}</p></div>`+
        '</div>'
      ).join("")+(previewData.remaining ? `<div class="boxAlternativeMore">그 외 ${previewData.remaining}개</div>` : "");
      alternatives.querySelectorAll?.(".boxAlternativeExample").forEach(element=>applyPreviewCss(element,css));
    }
    syncParagraphEditor();
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
      paragraphEditing=false;
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
      paragraphEditing=false;
      renderSearchResults();
      showSearchPanel(false);
      updateExample();
      setMessage("TXT 파일을 먼저 넣어줘.",true);
      return 0;
    }

    const compiled=compileSearchPattern(query);
    if(!compiled.ok){
      searchMatches=[];
      searchMatchTotal=0;
      previewQuery="";
      previewText="";
      selectedSearchIndex=-1;
      paragraphEditing=false;
      renderSearchResults();
      showSearchPanel(false);
      updateExample();
      setMessage(compiled.error,true);
      return 0;
    }

    const allMatches=collectSearchMatches(query);
    searchMatchTotal=allMatches.length;
    searchMatches=allMatches.slice(0,SEARCH_RESULT_LIMIT);
    previewQuery=query;
    selectedSearchIndex=-1;
    previewText="";
    previewSelectionText="";
    paragraphEditing=false;
    const autoRegexSource=regexSourceFromWrappedSearch(query);
    if(autoRegexSource && searchMatches.length) previewText=String(searchMatches[0].text || "");
    setAppliedRegexSource(autoRegexSource);
    clearDeleteState(true);
    renderSearchResults();
    showSearchPanel(true);
    updateExample();
    const limitMessage=searchMatchTotal>SEARCH_RESULT_LIMIT
      ? ` 전체 ${searchMatchTotal}개 중 앞의 ${SEARCH_RESULT_LIMIT}개만 표시했어요.`
      : "";
    setMessage(searchMatches.length
      ? `${searchMatches.length}개 결과를 찾았어요.${limitMessage}${query.includes(MULTILINE_WILDCARD_TOKEN) ? " ‘소롱’은 여러 줄을 지나 다음 고정 문자가 처음 나타난 곳에서 멈추고, 검색식의 마지막 문자가 줄 끝인 범위만 찾았어요." : query.includes(WILDCARD_TOKEN) ? " ‘티롱’은 한 줄의 모든 글자로 검색했어요." : ""}${autoRegexSource ? " 적용 정규식이 자동 생성됐어요. 결과 줄을 선택하면 선택한 줄에 맞게 바뀌어요." : " 적용할 줄을 선택해줘."}`
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
    if(regexEditing){
      setMessage("적용 정규식 수정을 먼저 완료해줘.",true);
      byId("boxRegexEditButton")?.focus?.();
      return null;
    }
    const validatedRegex=validateRegexSource(appliedRegexSource || regexInput?.value || "");
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
      !!byId("boxRequireBlankAround")?.checked ||
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
    paragraphEditing=false;
    clearDeleteState(true);
    const pattern=byId("boxWrapPattern");
    const regex=byId("boxRegexPattern");
    const css=byId("boxCssDeclarations");
    const preset=byId("boxPresetSelect");
    const italic=byId("boxPresetItalic");
    const remove=byId("boxDeleteText");
    const blank=byId("boxRequireBlankAround");
    const enabled=byId("enableBoxWrap");
    if(pattern) pattern.value="";
    if(regex) regex.value="";
    if(css) css.value="";
    if(preset) preset.value="4";
    if(remove) remove.value="";
    if(blank) blank.checked=false;
    setAppliedRegexSource("");
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
    const sectionToggle=byId("boxAddToggle");
    sectionToggle?.addEventListener("click",event=>{
      if(event.target===byId("enableBoxWrap") || event.target?.closest?.("#enableBoxWrap")) return;
      toggleSection();
    });
    sectionToggle?.addEventListener("keydown",event=>{
      if(event.target!==sectionToggle || !["Enter"," "].includes(event.key)) return;
      event.preventDefault();
      toggleSection();
    });
    byId("boxWrapSearchButton")?.addEventListener("click",runSearch);
    byId("boxDeleteTextButton")?.addEventListener("click",applyDeleteText);
    byId("boxAddRuleButton")?.addEventListener("click",addRule);
    byId("boxAddCollapseButton")?.addEventListener("click",()=>updateControls(false));
    byId("boxRegexEditButton")?.addEventListener("click",toggleRegexEdit);
    byId("boxParagraphEditButton")?.addEventListener("click",toggleParagraphEdit);
    byId("boxParagraphSelectButton")?.addEventListener("click",selectExactParagraph);
    byId("boxPresetSelect")?.addEventListener("change",applyPreset);
    byId("boxPresetItalic")?.addEventListener("change",applyPreset);
    byId("enableBoxWrap")?.addEventListener("change",event=>{
      setMessage("");
      if(event.target.checked) updateControls(true);
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
      paragraphEditing=false;
      setAppliedRegexSource("");
      clearDeleteState(true);
      setMessage("");
      renderSearchResults();
      showSearchPanel(false);
      updateExample();
    });
    regex?.addEventListener("input",()=>{
      if(regexEditing) setMessage("");
    });
    byId("boxSourceExample")?.addEventListener("input",updateEditedParagraphPreview);
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
    setAppliedRegexSource(regex?.value || "");
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
    wildcardTemplateFromSelection,
    quoteShortcutSource,
    startsWithSearchSymbol,
    isWrappedWildcardTemplate,
    exactRegexSourceFromSelection,
    compileSearchPattern,
    regexSourceFromSelection,
    regexSourceFromWrappedSearch,
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
    toggleParagraphEdit,
    selectExactParagraph,
    toggleRegexEdit,
    presetNumber,
    presetClassName,
    extractDeclarationsFromBoxCss,
    describeDeclarations,
    updatePresetControls,
    applyPreset,
    applyDeleteText,
    clearDeleteState,
    regexMatchesInText,
    alternativePreviewData,
    alternativePreviewTexts,
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
