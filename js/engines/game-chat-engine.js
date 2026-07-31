// Optional game-chat conversion for already-built paragraph HTML.
// Recognizes configured channel markers only at the beginning of plain <p> blocks.

const BookieGameChatEngine = {
  classByLabel: {
    "전체": "chat",
    "일반": "chat",
    "시스템": "chat",
    "귓속말": "chat_p",
    "파티": "chat_b",
    "팀": "chat_b",
    "지역": "chat_y",
    "길드": "chat_g",
    "외치기": "chat_or",
    "연합": "chat_bb",
    "공격대": "chat_bb"
  },

  normalizeForMatch(value){
    if(typeof BookieGameRuleMatcher!=="undefined"){
      return BookieGameRuleMatcher.normalizeWhitespace(value);
    }
    return String(value || "").replace(/\s+/gu,"");
  },

  classForLabel(label){
    const value=this.normalizeForMatch(label);
    if(/^system$/i.test(value)) return "chat";
    return this.classByLabel[value] || "";
  },

  customClassForContent(content,options={}){
    if(typeof BookieGameRuleMatcher==="undefined") return "";
    const rule=BookieGameRuleMatcher.findBestRule(options.customRules,content,options);
    return rule?.className || "";
  },

  classForContent(content,options={}){
    const customClass=this.customClassForContent(content,options);
    if(customClass) return customClass;

    const square=options.square!==false;
    const round=options.round!==false;
    const normalized=this.normalizeForMatch(content);
    const marker=normalized.match(/^(?:\[([^\]]*)\]|\(([^)]*)\))/u);
    if(!marker) return "";

    const usesSquare=typeof marker[1]!=="undefined";
    if((usesSquare && !square) || (!usesSquare && !round)) return "";
    return this.classForLabel(usesSquare ? marker[1] : marker[2]);
  },

  escapeRawContent(value){
    return String(value || "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;");
  },

  protectRawText(text,options={}){
    const before=String(text || "");
    if(options.enabled!==true){
      return {text:before,items:[],protected:0};
    }

    // Game-channel source lines must not be normalized as ordinary prose before
    // their class is attached. Replace only matching complete source lines with
    // collision-safe tokens, then restore the exact source text after paragraph
    // HTML has been built.
    let tokenPrefix="BOOKIE_GAME_CHAT_SOURCE_";
    while(before.includes(`[[${tokenPrefix}`)) tokenPrefix+="_";

    const items=[];
    const output=before.split("\n").map(line=>{
      const className=this.classForContent(line,options);
      if(!className) return line;

      const key=`[[${tokenPrefix}${items.length}]]`;
      items.push({key,className,content:line});
      return key;
    }).join("\n");

    return {text:output,items,protected:items.length};
  },

  restoreProtectedParagraphs(html,items=[]){
    let output=String(html || "");
    let restored=0;

    (Array.isArray(items) ? items : []).forEach(item=>{
      const key=String(item?.key || "");
      const className=String(item?.className || "");
      if(!key || !/^(?:chat|chat_p|chat_b|chat_y|chat_g|chat_or|chat_bb|chat_custom_[1-9]\d*)$/.test(className)) return;

      const escapedKey=key.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
      const paragraphPattern=new RegExp(`<p>\\s*${escapedKey}\\s*<\\/p>`,"g");
      output=output.replace(paragraphPattern,()=>{
        restored++;
        return `<p class="${className}">${this.escapeRawContent(item.content)}</p>`;
      });
    });

    return {html:output,restored};
  },

  convertPlainParagraphs(html, options={}){
    const square=options.square !== false;
    const round=options.round !== false;
    let converted=0;

    const output=String(html || "").replace(/<p>([\s\S]*?)<\/p>/g,(paragraph,content)=>{
      const className=this.classForContent(content,{...options,square,round});
      if(!className) return paragraph;

      converted++;
      return `<p class="${className}">${content}</p>`;
    });

    return {html:output,converted};
  },

  wrapChatRuns(html){
    const chatParagraph=/<p class="(?:chat|chat_p|chat_b|chat_y|chat_g|chat_or|chat_bb|chat_custom_[1-9]\d*)">[\s\S]*?<\/p>/;
    const runPattern=new RegExp(`(?:${chatParagraph.source}\\s*)+`,"g");
    const blankAtEnd=/<p(?: class="txt")?><br\s*\/><\/p>\s*$/;
    const blankAtStart=/^\s*<p(?: class="txt")?><br\s*\/><\/p>/;
    let wrapped=0;

    const output=String(html || "").replace(runPattern,(run,offset,source)=>{
      const before=source.slice(0,offset);
      const after=source.slice(offset+run.length);
      const prefix=blankAtEnd.test(before) ? "" : '<p><br/></p>\n';
      const suffix=blankAtStart.test(after) ? "" : '\n<p><br/></p>';
      wrapped++;
      return `${prefix}<div class="pre1">\n${run.trim()}\n</div>${suffix}`;
    });

    return {html:output,wrapped};
  },

  normalizeChatRunSpacing(html){
    return String(html || "")
      .replace(
        /<p class="txt">\s*<br\s*\/?\s*>\s*<\/p>(\s*<div class="pre1">)/g,
        '<p><br/></p>$1'
      )
      .replace(
        /(<div class="pre1">[\s\S]*?<\/div>)(\s*)<p class="txt">\s*<br\s*\/?\s*>\s*<\/p>/g,
        '$1$2<p><br/></p>'
      );
  },

  clean(html,options={}){
    const before=String(html || "");
    if(options.enabled!==true){
      return {html:before,report:{changed:false,converted:0,wrapped:0}};
    }

    // Existing game boxes are preserved verbatim so repeated processing cannot nest them.
    const parts=before.split(/(<div class="pre1">[\s\S]*?<\/div>)/g);
    let converted=0;
    let wrapped=0;

    const wrappedOutput=parts.map((part,index)=>{
      if(index%2===1) return part;
      const conversion=this.convertPlainParagraphs(part,options);
      const wrapping=this.wrapChatRuns(conversion.html);
      converted+=conversion.converted;
      wrapped+=wrapping.wrapped;
      return wrapping.html;
    }).join("");

    const output=this.normalizeChatRunSpacing(wrappedOutput);

    return {
      html:output,
      report:{changed:before!==output,converted,wrapped}
    };
  }
};
