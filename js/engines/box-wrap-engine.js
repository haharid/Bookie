// Wraps complete plain paragraphs selected by user BOX rules.
// This runs after automatic whitespace cleanup and paragraph HTML conversion.

const BookieBoxWrapEngine={
  blankParagraphSource:'<p(?: class="txt")?>\\s*<br\\s*\\/?>\\s*<\\/p>',

  parsePattern(value){
    let pattern=String(value || "").trim();
    if(pattern==="[]") pattern="[티롱]";
    if(pattern==="()") pattern="(티롱)";
    const tokenMatch=pattern.match(/티롱|소롱/u);
    if(!tokenMatch) return null;
    const tokenIndex=tokenMatch.index;
    const token=tokenMatch[0];
    const prefix=pattern.slice(0,tokenIndex);
    const suffix=pattern.slice(tokenIndex+token.length);
    if(!prefix && !suffix) return null;
    return {pattern,prefix,suffix,token};
  },

  decodeHtmlText(value){
    return String(value || "")
      .replace(/&#(\d+);/g,(match,number)=>String.fromCodePoint(Number(number)))
      .replace(/&#x([0-9a-f]+);/gi,(match,number)=>String.fromCodePoint(parseInt(number,16)))
      .replace(/&lt;/g,"<")
      .replace(/&gt;/g,">")
      .replace(/&quot;/g,'"')
      .replace(/&#39;/g,"'")
      .replace(/&amp;/g,"&");
  },

  visibleText(content){
    return this.decodeHtmlText(String(content || "").replace(/<[^>]+>/g,"")).trim();
  },

  legacyMatches(content,pattern){
    const parsed=this.parsePattern(pattern);
    if(!parsed) return false;
    const visible=this.visibleText(content);
    if(!visible.startsWith(parsed.prefix) || !visible.endsWith(parsed.suffix) ||
      visible.length<parsed.prefix.length+parsed.suffix.length) return false;
    if(parsed.token==="소롱" && /^[\p{P}\p{S}]+$/u.test(parsed.prefix) && /^[\p{P}\p{S}]+$/u.test(parsed.suffix)){
      const inner=visible.slice(parsed.prefix.length,visible.length-parsed.suffix.length);
      if(inner.includes(parsed.prefix) || inner.includes(parsed.suffix)) return false;
    }
    return true;
  },

  compileRegex(source){
    const value=String(source || "").trim();
    if(!value) return null;
    try{
      const regex=new RegExp(value,"u");
      return regex.test("") ? null : regex;
    }catch(error){
      return null;
    }
  },

  compileGlobalRegex(source){
    const value=String(source || "").trim();
    if(!value) return null;
    try{
      const probe=new RegExp(value,"u");
      if(probe.test("")) return null;
      return new RegExp(value,"gu");
    }catch(error){
      return null;
    }
  },

  matches(content,ruleOrPattern){
    if(ruleOrPattern && typeof ruleOrPattern==="object"){
      const regex=this.compileRegex(ruleOrPattern.regexSource);
      if(regex) return regex.test(this.visibleText(content));
      return this.legacyMatches(content,ruleOrPattern.pattern);
    }
    return this.legacyMatches(content,ruleOrPattern);
  },

  safeRules(rules){
    return (Array.isArray(rules) ? rules : []).reduce((safe,rule)=>{
      if(!/^boxt_[1-9]\d*$/.test(String(rule?.className || ""))) return safe;
      const regexSource=String(rule?.regexSource || "").trim();
      if(!this.compileRegex(regexSource) && !this.parsePattern(rule?.pattern)) return safe;
      const savedRemoveTexts=Array.isArray(rule?.removeTexts) && rule.removeTexts.length
        ? rule.removeTexts
        : [rule?.removeText];
      const removeTexts=savedRemoveTexts
        .map(value=>String(value || ""))
        .filter(Boolean);
      safe.push({
        ...rule,
        regexSource,
        removeTexts:Array.from(new Set(removeTexts)),
        requireBlankAround:rule?.requireBlankAround===true
      });
      return safe;
    },[]);
  },

  escapeHtmlText(value){
    return String(value || "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;");
  },

  removeLiteralsFromHtml(content,removeTexts){
    const targets=(Array.isArray(removeTexts) ? removeTexts : [removeTexts])
      .map(value=>String(value || ""))
      .filter(Boolean);
    if(!targets.length) return String(content || "");
    const candidates=Array.from(new Set(targets.flatMap(target=>[target,this.escapeHtmlText(target)]))).filter(Boolean);
    return String(content || "").split(/(<[^>]+>)/g).map(part=>{
      if(/^<[^>]+>$/.test(part)) return part;
      return candidates.reduce((value,candidate)=>value.split(candidate).join(""),part);
    }).join("");
  },

  hasBlankBefore(source,offset){
    const before=String(source || "").slice(0,offset);
    return new RegExp(`${this.blankParagraphSource}\\s*$`).test(before);
  },

  hasBlankAfter(source,offset){
    const after=String(source || "").slice(offset);
    return new RegExp(`^\\s*${this.blankParagraphSource}`).test(after);
  },

  paragraphRuns(source){
    const value=String(source || "");
    const tokens=[];
    const paragraph=/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi;
    let match;
    while((match=paragraph.exec(value))){
      tokens.push({
        start:match.index,
        end:paragraph.lastIndex,
        html:match[0],
        content:match[1],
        text:this.visibleText(match[1])
      });
    }

    const runs=[];
    let current=[];
    tokens.forEach(token=>{
      const previous=current.at(-1);
      if(previous && /\S/.test(value.slice(previous.end,token.start))){
        runs.push(current);
        current=[];
      }
      current.push(token);
    });
    if(current.length) runs.push(current);
    return runs;
  },

  runText(tokens){
    let text="";
    const positions=[];
    tokens.forEach((token,index)=>{
      if(index>0) text+="\n";
      const start=text.length;
      text+=token.text;
      positions.push({start,end:text.length});
    });
    return {text,positions};
  },

  tokenRangeForMatch(positions,startOffset,endOffset){
    let first=positions.findIndex(position=>position.end>startOffset);
    if(first<0) first=positions.findIndex(position=>position.start>=startOffset);
    let last=-1;
    for(let index=positions.length-1;index>=0;index--){
      if(positions[index].start<endOffset){
        last=index;
        break;
      }
    }
    if(first<0 || last<first) return null;
    return {first,last};
  },

  candidatesForRun(tokens,rules){
    const joined=this.runText(tokens);
    const candidates=[];
    rules.forEach((rule,ruleIndex)=>{
      const regex=this.compileGlobalRegex(rule.regexSource);
      if(regex){
        let match;
        while((match=regex.exec(joined.text))){
          const range=this.tokenRangeForMatch(joined.positions,match.index,match.index+match[0].length);
          if(range){
            candidates.push({...range,rule,ruleIndex,matchStart:match.index,matchEnd:match.index+match[0].length});
          }
          if(match[0]==="") regex.lastIndex++;
        }
        return;
      }

      tokens.forEach((token,tokenIndex)=>{
        if(!this.legacyMatches(token.content,rule.pattern)) return;
        candidates.push({
          first:tokenIndex,
          last:tokenIndex,
          rule,
          ruleIndex,
          matchStart:joined.positions[tokenIndex].start,
          matchEnd:joined.positions[tokenIndex].end
        });
      });
    });

    candidates.sort((left,right)=>
      left.matchStart-right.matchStart || left.ruleIndex-right.ruleIndex || left.matchEnd-right.matchEnd
    );
    const occupied=new Set();
    return candidates.filter(candidate=>{
      for(let index=candidate.first;index<=candidate.last;index++){
        if(occupied.has(index)) return false;
      }
      for(let index=candidate.first;index<=candidate.last;index++) occupied.add(index);
      return true;
    });
  },

  wrapPlainParagraphs(html,rules){
    const safeRules=this.safeRules(rules);
    let wrapped=0;
    let skippedBlank=0;
    const byClass={};
    const protectedBox=/<div class="(?:box\d+|boxt_[1-9]\d*)">[\s\S]*?<\/div>/;
    const parts=String(html || "").split(new RegExp(`(${protectedBox.source})`,"g"));

    const output=parts.map((part,index)=>{
      if(index%2===1) return part;
      const replacements=[];
      this.paragraphRuns(part).forEach(tokens=>{
        this.candidatesForRun(tokens,safeRules).forEach(candidate=>{
          const first=tokens[candidate.first];
          const last=tokens[candidate.last];
          const beforeBlank=this.hasBlankBefore(part,first.start);
          const afterBlank=this.hasBlankAfter(part,last.end);
          if(candidate.rule.requireBlankAround && !(beforeBlank && afterBlank)){
            skippedBlank++;
            return;
          }
          replacements.push({
            start:first.start,
            end:last.end,
            beforeBlank,
            afterBlank,
            rule:candidate.rule
          });
        });
      });

      let nextPart=part;
      replacements.sort((left,right)=>right.start-left.start).forEach(replacement=>{
        const block=part.slice(replacement.start,replacement.end);
        const nextBlock=this.removeLiteralsFromHtml(block,replacement.rule.removeTexts);
        const prefix=replacement.beforeBlank ? "" : '<p><br/></p>\n';
        const suffix=replacement.afterBlank ? "" : '\n<p><br/></p>';
        const box=`${prefix}<div class="${replacement.rule.className}">\n${nextBlock}\n</div>${suffix}`;
        nextPart=nextPart.slice(0,replacement.start)+box+nextPart.slice(replacement.end);
        wrapped++;
        byClass[replacement.rule.className]=(byClass[replacement.rule.className] || 0)+1;
      });
      return nextPart;
    }).join("");

    return {html:this.normalizeSpacing(output),wrapped,skippedBlank,byClass};
  },

  normalizeSpacing(html){
    const blank=this.blankParagraphSource;
    const boxClass='boxt_[1-9]\\d*';
    return String(html || "")
      .replace(
        new RegExp(`<p class="txt">\\s*<br\\s*\\/?\\s*>\\s*<\\/p>(\\s*<div class="${boxClass}">)`,"g"),
        '<p><br/></p>$1'
      )
      .replace(
        new RegExp(`(<div class="${boxClass}">[\\s\\S]*?<\\/div>)(\\s*)<p class="txt">\\s*<br\\s*\\/?\\s*>\\s*<\\/p>`,"g"),
        '$1$2<p><br/></p>'
      )
      .replace(
        new RegExp(`(<\\/div>)\\s*(?:${blank}\\s*){2,}(?=<div class="${boxClass}">)`,"g"),
        '$1\n<p><br/></p>\n'
      );
  },

  clean(html,options={}){
    const before=String(html || "");
    const rules=this.safeRules(options.rules);
    const enabled=options.enabled===true && rules.length>0;
    if(!enabled){
      return {html:before,report:{changed:false,enabled:false,wrapped:0,skippedBlank:0,byClass:{},ruleCount:rules.length}};
    }

    const result=this.wrapPlainParagraphs(before,rules);
    return {
      html:result.html,
      report:{
        changed:before!==result.html,
        enabled:true,
        wrapped:result.wrapped,
        skippedBlank:result.skippedBlank,
        byClass:result.byClass,
        ruleCount:rules.length
      }
    };
  }
};

if(typeof window!=="undefined") window.BookieBoxWrapEngine=BookieBoxWrapEngine;
