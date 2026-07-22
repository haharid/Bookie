// Bookie 3.2.1 - app.js
// Core text cleanup helpers and HTML conversion functions.
// Main processing entry is delegated to BookieEngine.process().

let detectedParagraphGap = 2;

function normalizeParagraphGapValue(value){
  const number = Number(value);
  return Number.isFinite(number) && number >= 2 ? Math.floor(number) : 2;
}

// ========================
// Paragraph Gap Detection
// - Detects the dominant paragraph gap before conversion.
// - Used by blank-line and paragraph HTML conversion logic.
// ========================
function detectParagraphStyle(text){
  const sample = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\u2060\u2063\uFEFF]/g, "")
    .split("\n")
    .slice(0, 500)
    .join("\n")
    .replace(/^[^\S\n]+$/gm, "")
    .replace(/^\n+|\n+$/g, "");

  const counts = new Map();

  // Count exact newline runs. The most frequently repeated run is the normal
  // paragraph pattern; longer, less frequent runs are intentional spacing.
  const runs = sample.match(/\n{2,}/g) || [];
  for(const run of runs){
    counts.set(run.length, (counts.get(run.length) || 0) + 1);
  }

  const ranked = Array.from(counts.entries())
    .sort((a, b)=>b[1] - a[1] || a[0] - b[0]);

  detectedParagraphGap = ranked.length ? ranked[0][0] : 2;
  return detectedParagraphGap;
}

// ========================
// Blankline Cleaner
// - Normalizes line endings and safe whitespace.
// - Keeps the existing Stable blank-line behavior unchanged.
// ========================
function cleanBlankLines(text){
  const spaceClean = !!(document.getElementById("checkSpaceClean") && document.getElementById("checkSpaceClean").checked);

  if(typeof BookieBlanklineEngine !== "undefined"){
    return BookieBlanklineEngine.clean(text, {
      paragraphGap: detectedParagraphGap,
      spaceClean
    }).html;
  }

  // Fallback for legacy loading order. Output must match Bookie 3.3 Stable behavior.
  text = text.replace(/\r\n/g,"\n").replace(/\r/g,"\n");
  text = text
    .replace(/\u00A0/g," ")
    .replace(/[\u200B-\u200D\u2060\u2063\uFEFF]/g,"");

  if(spaceClean){
    text = text
      .replace(/[ \t]+$/gm,"")
      .replace(/^[ \t]+/gm,"")
      .replace(/[ \t]{2,}/g," ")
      .replace(/\n[ \t]+/g,"\n")
      .replace(/[ \t]+\n/g,"\n")
      .replace(/ +(?=[.!?…"'”’)]*$)/gm,"");
  }

  const paragraphGap = normalizeParagraphGapValue(detectedParagraphGap);
  text = text.replace(/\n{2,}/g, run=>{
    return run.length > paragraphGap ? "\n".repeat(paragraphGap + 1) : run;
  });

  return text.trim();
}

// ========================
// Dialogue Cleaner
// - Optional legacy checkbox behavior.
// - Not expanded in Bookie 3.1 refactoring.
// ========================
function dialogueClean(text){
  if(!(document.getElementById("checkDialogue") && document.getElementById("checkDialogue").checked)) return text;

  const separator = "\n".repeat(normalizeParagraphGapValue(detectedParagraphGap));

  return text
    // "대사." "대사." 형태 분리
    .replace(/([”"])(\s+)([“"])/g, `$1${separator}$3`)
    // 닫는 따옴표 뒤 바로 다음 여는 따옴표
    .replace(/([”"])([“"])/g, `$1${separator}$2`)
    // 문장 끝 따옴표 뒤 대문자/한글 대사 시작이 붙는 경우 완화
    .replace(/([.!?…][”"])(\s*)([“"])/g, `$1${separator}$3`);
}

// ========================
// Footnote Processing
// - Existing Stable footnote behavior.
// - Structure improvement is reserved for Bookie 3.2 Foundation.
// ========================
function processFootnotes(text){

  if(!(document.getElementById("enableFootnotes") &&
       document.getElementById("enableFootnotes").checked)){
    return {
      body:text,
      notesHtml:""
    };
  }

  const lines = String(text || "").replace(/\r\n?/g,"\n").split("\n");
  const invisible=/[\u00AD\u034F\u061C\u180E\u200B-\u200F\u2060-\u206F\uFEFF]/g;
  const visibleLine=rawLine=>String(rawLine || "")
    .replace(invisible,"")
    .trim()
    .replace(/^<p\b[^>]*>\s*/i,"")
    .replace(/\s*<\/p>$/i,"")
    .trim();
  const definitionForLine=rawLine=>{
    const match=visibleLine(rawLine).match(/^(\d+)\)\s+(.+)$/);
    return match ? {sourceNo:Number(match[1]),text:match[2].trim()} : null;
  };
  const removedIndexes=new Set();
  const definitions=[];
  const labelIndexes=[];

  lines.forEach((rawLine,index)=>{
    if(/^(?:각주|주석)$/.test(visibleLine(rawLine))) labelIndexes.push(index);
  });

  labelIndexes.forEach(labelIndex=>{
    removedIndexes.add(labelIndex);
    for(let index=labelIndex+1;index<lines.length;index++){
      const visible=visibleLine(lines[index]);
      if(!visible) continue;
      const definition=definitionForLine(lines[index]);
      if(!definition) break;
      definitions.push({...definition,lineIndex:index});
      removedIndexes.add(index);
    }
  });

  // Legacy fallback: without an explicit label, accept only a numbered block
  // at the very end when the same number already appears in real body text.
  if(!labelIndexes.length){
    const trailing=[];
    for(let index=lines.length-1;index>=0;index--){
      const visible=visibleLine(lines[index]);
      if(!visible) continue;
      const definition=definitionForLine(lines[index]);
      if(!definition) break;
      trailing.unshift({...definition,lineIndex:index});
    }
    const bodyBeforeTrailing=lines.slice(0,trailing[0]?.lineIndex ?? lines.length).join("\n");
    trailing.forEach(definition=>{
      const marker=new RegExp(`(^|\\n)([^\\n]*\\S[^\\n]*)${definition.sourceNo}\\)`);
      if(!marker.test(bodyBeforeTrailing)) return;
      definitions.push(definition);
      removedIndexes.add(definition.lineIndex);
    });
  }

  const notes=[];
  definitions.forEach(definition=>{
    footnoteCounter++;
    const noteObj={
      no:footnoteCounter,
      sourceNo:definition.sourceNo,
      text:definition.text,
      refHref:""
    };
    notes.push(noteObj);
    footnoteList.push(noteObj);
  });

  let body=lines.filter((rawLine,index)=>!removedIndexes.has(index)).join("\n");
  const unusedNotes=[...notes];

  const isFootnoteMarkerCandidate=(source,offset,match)=>{
    const lineStart=source.lastIndexOf("\n",offset-1)+1;
    const linePrefix=source.slice(lineStart,offset);
    if(!linePrefix.trim()) return false;

    // Do not consume a number that closes a numeric parenthetical expression.
    // This targets (0, 1) and (1/1) without rejecting a real marker after a
    // comma, such as "문장,1)" or "문장, 1)".
    const lineThroughMarker=source.slice(lineStart,offset+match.length);
    if(/\(\s*\d+(?:\s*[,/]\s*\d+)*\)$/.test(lineThroughMarker)) return false;

    const immediatePrevious=source.charAt(offset-1);
    if(immediatePrevious==="/") return false;

    return true;
  };

  body=body.replace(/\d+\)/g,function(match,offset,source){
    const sourceNo=Number(match.slice(0,-1));
    const noteIndex=unusedNotes.findIndex(note=>note.sourceNo===sourceNo);
    if(noteIndex<0) return match;
    if(!isFootnoteMarkerCandidate(source,offset,match)) return match;
    const [note]=unusedNotes.splice(noteIndex,1);
    return `<a href="#fn${note.no}"
              id="ref${note.no}"
              epub:type="noteref" style="color:#4a7dff;text-decoration:none;">${note.no})</a>`;
  });

  // Keep the description inside the chapter as an EPUB footnote target.
  // Compatible reading systems hide this semantic aside from the normal body
  // and open it as a popup when the matching noteref is selected. The same
  // note objects are also collected into the final footnotes.xhtml page.
  let notesHtml="";
  notes.forEach(note=>{
    notesHtml += `
<aside id="fn${note.no}" epub:type="footnote">
  <p style="margin:0;">${esc(note.text)}</p>
</aside>`;
  });

  return {
    body,
    notesHtml
  };
}

// ========================
// Paragraph Cleaner
// - Converts cleaned text line breaks into EPUB paragraph HTML.
// - Keeps the existing Stable paragraph behavior unchanged.
// ========================
function buildParagraphHtml(raw){

  const paragraphBreakRules=(typeof BookieParagraphBreakSettings!=="undefined")
    ? BookieParagraphBreakSettings.getConversionRules()
    : [{source:"***",output:"* * *",matchStars:true,isDefault:true}];

  if(typeof BookieParagraphEngine !== "undefined"){
    return BookieParagraphEngine.build(raw, {
      paragraphGap: detectedParagraphGap,
      escapeFn: esc,
      paragraphBreakRules
    }).html;
  }

  // Fallback for legacy loading order. Output must match Bookie 3.4.1 Stable behavior.

  // 특수문자 단독 줄은 독립 문단 유지
  raw = raw.replace(
    /\n([@\]#※▶▷◆■□★☆]+)\n/g,
    '\n\n$1\n\n'
  );

  // 문단 구분 기호 전용 토큰
  const paragraphBreakTokens=[];
  raw = String(raw || "").split("\n").map(line=>{
    const text=String(line || "").trim();
    const rule=paragraphBreakRules.find(item=>item.matchStars
      ? text.replace(/\s+/gu,"")==="***"
      : text===String(item.source || "").trim());
    if(!rule) return line;
    const token=`[[BOOKIE_PARAGRAPH_BREAK_${paragraphBreakTokens.length}]]`;
    paragraphBreakTokens.push({token,output:String(rule.output ?? rule.source ?? "")});
    return token;
  }).join("\n");

  // 각주 링크 임시 보호
  const protectedLinks = [];

  raw = raw.replace(
    /<a\b[^>]*(?:epub:type=["']noteref["']|href=["'](?:footnotes\.xhtml)?#fn\d+["'])[^>]*>[\s\S]*?<\/a>/g,
    function(m){
      const key = `[[FOOTNOTE_LINK_${protectedLinks.length}]]`;
      protectedLinks.push(m);
      return key;
    }
  );

  let t = esc(raw);

  // 보호했던 각주 링크 복원
  protectedLinks.forEach((link, i)=>{
    t = t.replace(`[[FOOTNOTE_LINK_${i}]]`, link);
  });

  const paragraphGap = normalizeParagraphGapValue(detectedParagraphGap);
  t = t.replace(/\n{2,}/g, run=>{
    return run.length > paragraphGap
      ? '</p><p class="txt"><br/></p><p>'
      : '</p><p>';
  });

  // 일반 줄바꿈 1개는 그냥 이어쓰기
  t = t.replace(/\n/g," ");

  // 문단 구분 기호 치환
  paragraphBreakTokens.forEach(item=>{
    t=t.replace(
      item.token,
      `</p><p style="text-align: center;">${esc(item.output)}</p><p>`
    );
  });

  // 문단 꼬임 정리
  t = t
    .replace(/<p><\/p>/g,'')
    .replace(/<p>\s*<p>/g,'<p>')
    .replace(/<\/p>\s*<\/p>/g,'</p>')
    // *** 앞뒤 br 제거
    .replace(/<br\/><\/p><p><br\/><\/p><p style="text-align: center;">/g,'</p><p class="txt"><br/></p><p style="text-align: center;">')
    .replace(/<p><br\/><\/p><br\/><p>/g,'<p class="txt"><br/></p><p>');

  return `<p>${t}</p>`;
}

// ========================
// Text Part Entry
// - Delegates the main processing order to BookieEngine.
// - Keeps Stable output unchanged.
// ========================
function textPartToHtml(text){
  if(typeof BookieGameChatEngine!=="undefined" &&
     typeof currentBookieGameChatOptions==="function"){
    const gameChatOptions=currentBookieGameChatOptions();
    const protectedResult=BookieGameChatEngine.protectRawText(text,gameChatOptions);
    const boxWrapOptions=typeof BookieBoxWrapSettings!=="undefined"
      ? BookieBoxWrapSettings.getOptions()
      : {enabled:false,rules:[]};
    return BookieEngine.process(protectedResult.text,{
      gameChatOptions,
      gameChatProtection:protectedResult.items,
      boxWrapOptions
    });
  }

  const boxWrapOptions=typeof BookieBoxWrapSettings!=="undefined"
    ? BookieBoxWrapSettings.getOptions()
    : {enabled:false,rules:[]};
  return BookieEngine.process(text,{boxWrapOptions});
}
