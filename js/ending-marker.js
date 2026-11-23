// Completion labels and lines containing the title are matched only at the end of a source TXT, then styled
// after conversion so their original paragraph content stays intact.
(function(global){
  const pairs={"(":")","[":"]","{":"}","<":">","〈":"〉","《":"》","【":"】","〔":"〕"};
  const blank='<p(?:\\s+class=["\']txt["\'])?>[\\s\\u200B\\u2060\\uFEFF]*(?:(?:<br\\s*\\/?>|&nbsp;|&#160;)[\\s\\u200B\\u2060\\uFEFF]*)*<\\/p>';
  const blankTail=new RegExp(`(?:\\s*${blank})*\\s*$`,"i");
  const label=/^(?:(?:본편(?:\s*(?:및|[·&/+])?\s*외전)?|본외전|(?:특별\s*|추가\s*)?외전(?:\s*\d+)?|번외(?:편)?|후일담|에필로그|전편|전체|(?:제\s*)?\d+\s*[부권])\s*[:：\-–—·]?\s*)?(?:완결|완|完結|完|끝|종결|the\s+end|end|fin)$/iu;

  function normalize(value){
    return String(value ?? "").normalize("NFC")
      .replace(/[\u200B-\u200D\u2060\u2063\uFEFF]/g,"")
      .replace(/\s+/gu," ").trim();
  }

  function undecorate(value){
    let text=normalize(value);
    while(text){
      const before=text;
      text=text.replace(/[.。]+$/u,"").trim();
      if(pairs[text[0]]===text[text.length-1]) text=text.slice(1,-1).trim();
      const decorated=text.match(/^[-–—~*·ㆍ=]+\s*(.*?)\s*[-–—~*·ㆍ=]+$/u);
      if(decorated) text=decorated[1].trim();
      if(text===before) break;
    }
    return text;
  }

  function containsTitle(value,titles=[]){
    const text=normalize(value).toLocaleLowerCase();
    return titles.some(value=>{
      const title=undecorate(value).toLocaleLowerCase();
      return !!title && text.includes(title);
    });
  }

  function matches(value,titles=[]){
    // Title containment is an independent rule. Prefixes, suffixes, quotes and
    // the presence or absence of a completion keyword do not restrict it.
    return containsTitle(value,titles) || label.test(undecorate(value));
  }

  function previewApi(){
    return global.BookieEditableFrontPreview;
  }

  function sourceEnd(lineIndex,totalLines){
    const api=previewApi();
    const end=api && typeof api.combinedFileEndForLineIndex==="function"
      ? api.combinedFileEndForLineIndex(lineIndex) : null;
    return Number.isInteger(end) ? Math.min(end,totalLines) : totalLines;
  }

  function sourceTitles(lineIndex,bookTitle){
    const titles=[bookTitle];
    const api=previewApi();
    const files=api && typeof api.getPreviewFiles==="function" ? api.getPreviewFiles() : [];
    const file=files.find(item=>lineIndex>=item.combinedOffset &&
      lineIndex<item.combinedOffset+(item.keptLines?.length || 0));
    if(file?.fileName) titles.push(file.fileName.replace(/\.txt$/i,""));
    return titles;
  }

  function isFootnoteTail(sourceLines,start,end,requireEnabled=true){
    if(requireEnabled && !global.document?.getElementById("enableFootnotes")?.checked) return false;
    let first=start;
    while(first<end && !normalize(sourceLines[first])) first++;
    if(!/^(?:각주|주석)$/.test(normalize(sourceLines[first]))) return false;
    let count=0;
    for(let index=first+1;index<end;index++){
      const line=normalize(sourceLines[index]);
      if(!line) continue;
      if(!/^\d+\)\s+\S/.test(line)) return false;
      count++;
    }
    return count>0;
  }

  function isSourceEndingLine(lineIndex,sourceLines,bookTitle){
    const end=sourceEnd(lineIndex,sourceLines.length);
    for(let index=lineIndex+1;index<end;index++){
      if(!normalize(sourceLines[index])) continue;
      // TOC detection runs on upload, before the user may enable footnotes.
      // An explicit note appendix still cannot make an ending a chapter title.
      if(!isFootnoteTail(sourceLines,index,end,false)) return false;
      break;
    }
    return matches(sourceLines[lineIndex],sourceTitles(lineIndex,bookTitle));
  }

  function decodeText(value){
    const named={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" "};
    return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(entity,key)=>{
      if(key[0]!=="#") return named[key.toLowerCase()];
      const number=key[1].toLowerCase()==="x" ? parseInt(key.slice(2),16) : Number(key.slice(1));
      return number>0 && number<=0x10FFFF ? String.fromCodePoint(number) : entity;
    });
  }

  function format(html,titles=[]){
    const original=String(html || "");
    let body=original;
    let notes="";
    // Semantic popup footnotes follow the visible body. Keep their bytes and
    // targets out of both detection and spacing changes.
    const noteTail=body.match(/(?:\s*<aside\b(?=[^>]*\bepub:type=["']footnote["'])[^>]*>(?:(?!<\/?aside\b)[\s\S])*?<\/aside>)+\s*$/i);
    if(noteTail){
      notes=noteTail[0];
      body=body.slice(0,noteTail.index);
    }
    const trailing=body.match(blankTail)[0];
    const core=body.slice(0,body.length-trailing.length);
    const paragraph=core.match(/<p\b([^>]*)>((?:(?!<\/?p\b)[\s\S])*?)<\/p>(\s*(?:<\/(?:div|section|blockquote)>\s*)*)$/i);
    if(!paragraph) return original;
    let attributes=paragraph[1];
    const classes=attributes.match(/\bclass\s*=\s*["']([^"']*)["']/i)?.[1] || "";
    const text=paragraph[2].replace(/<\/?(?:a|span|b|strong|em|i|u|s|small|sup|sub)\b[^>]*>/gi,"");
    const decoded=decodeText(text);
    const titled=containsTitle(decoded,titles);
    if(/<[^>]*>/.test(text) || !matches(decoded,titles)) return original;
    // The title rule also applies to styled final lines. Keep their classes,
    // inline links and container tags; short labels retain the previous guards.
    if(!titled && (paragraph[3].trim() || /<a\b/i.test(paragraph[2]) ||
       classes.split(/\s+/).some(name=>name && !/^(?:txt|fb|flashback)$/.test(name)))) return original;

    let style="";
    attributes=attributes.replace(/\s+style\s*=\s*(["'])([\s\S]*?)\1/gi,(match,quote,value)=>{
      style=value.split(";").filter(rule=>rule.trim() && !/^\s*(?:text-align|text-indent)\s*:/i.test(rule)).join(";");
      return "";
    }).trimEnd();
    if(style) style=style.trim()+"; ";
    const prefix=core.slice(0,paragraph.index).replace(blankTail,"");
    const spacer=prefix.trim() ? "<p><br/></p>" : "";
    return prefix+spacer+`<p${attributes} style="${style}text-align: right; text-indent: 0;">${paragraph[2]}</p>`+paragraph[3]+trailing+notes;
  }

  global.BookieEndingMarker={matches,format,sourceEnd,sourceTitles,isFootnoteTail,isSourceEndingLine};
})(typeof window!=="undefined" ? window : globalThis);
