// Optional game-chat conversion for already-built paragraph HTML.
// Recognizes configured channel markers only at the beginning of plain <p> blocks.

const BookieGameChatEngine = {
  classByLabel: {
    "전체": "chat",
    "일반": "chat",
    "귓속말": "chat_p",
    "파티": "chat_b",
    "팀": "chat_b",
    "지역": "chat_y",
    "길드": "chat_g",
    "외치기": "chat_or",
    "연합": "chat_bb",
    "공격대": "chat_bb"
  },

  classForLabel(label){
    const value=String(label || "");
    if(/^system$/i.test(value)) return "chat";
    return this.classByLabel[value] || "";
  },

  convertPlainParagraphs(html, options={}){
    const square=options.square !== false;
    const round=options.round !== false;
    let converted=0;

    const output=String(html || "").replace(/<p>([\s\S]*?)<\/p>/g,(paragraph,content)=>{
      const marker=String(content).match(/^(\s*)(?:\[([^\]]+)\]|\(([^)]+)\))/);
      if(!marker) return paragraph;

      const usesSquare=typeof marker[2]!=="undefined";
      if((usesSquare && !square) || (!usesSquare && !round)) return paragraph;

      const label=usesSquare ? marker[2] : marker[3];
      const className=this.classForLabel(label);
      if(!className) return paragraph;

      converted++;
      return `<p class="${className}">${content}</p>`;
    });

    return {html:output,converted};
  },

  wrapChatRuns(html){
    const chatParagraph=/<p class="(?:chat|chat_p|chat_b|chat_y|chat_g|chat_or|chat_bb)">[\s\S]*?<\/p>/;
    const runPattern=new RegExp(`(?:${chatParagraph.source}\\s*)+`,"g");
    const blankAtEnd=/<p(?: class="txt")?><br\s*\/><\/p>\s*$/;
    const blankAtStart=/^\s*<p(?: class="txt")?><br\s*\/><\/p>/;
    let wrapped=0;

    const output=String(html || "").replace(runPattern,(run,offset,source)=>{
      const before=source.slice(0,offset);
      const after=source.slice(offset+run.length);
      const prefix=blankAtEnd.test(before) ? "" : '<p class="txt"><br/></p>\n';
      const suffix=blankAtStart.test(after) ? "" : '\n<p class="txt"><br/></p>';
      wrapped++;
      return `${prefix}<div class="pre1">\n${run.trim()}\n</div>${suffix}`;
    });

    return {html:output,wrapped};
  },

  clean(html,options={}){
    const before=String(html || "");
    if(options.enabled!==true || (options.square===false && options.round===false)){
      return {html:before,report:{changed:false,converted:0,wrapped:0}};
    }

    // Existing game boxes are preserved verbatim so repeated processing cannot nest them.
    const parts=before.split(/(<div class="pre1">[\s\S]*?<\/div>)/g);
    let converted=0;
    let wrapped=0;

    const output=parts.map((part,index)=>{
      if(index%2===1) return part;
      const conversion=this.convertPlainParagraphs(part,options);
      const wrapping=this.wrapChatRuns(conversion.html);
      converted+=conversion.converted;
      wrapped+=wrapping.wrapped;
      return wrapping.html;
    }).join("");

    return {
      html:output,
      report:{changed:before!==output,converted,wrapped}
    };
  }
};
