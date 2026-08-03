// Bookie 3.6.0 - Dialogue Engine v3.1
// Splits continuous dialogue quote blocks and quote-to-bracket lines while keeping normal paragraphs untouched.

const BookieDialogueEngine = {
  quotePairs: [
    { open: "“", close: "”" },
    { open: '"', close: '"' }
  ],

  escapeRegExp(value){
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },

  normalizeParagraphGapValue(value){
    const number = Number(value);
    return Number.isFinite(number) && number >= 2 ? Math.floor(number) : 2;
  },

  getQuoteBlockPattern(){
    const parts = this.quotePairs.map(pair=>{
      const open = this.escapeRegExp(pair.open);
      const close = this.escapeRegExp(pair.close);
      return `${open}[^${close}\\n]+${close}`;
    });

    return `(?:${parts.join("|")})`;
  },

  isContinuousDialogueLine(line){
    const value = String(line || "").trim();
    if(!value) return false;

    const block = this.getQuoteBlockPattern();
    const fullPattern = new RegExp(`^${block}(?:\\s*${block})+$`);
    return fullPattern.test(value);
  },

  isQuoteToBracketLine(line){
    const value = String(line || "").trim();
    if(!value) return false;

    const block = this.getQuoteBlockPattern();
    const fullPattern = new RegExp(`^${block}(?:\\s*${block})*\\[.+$`);
    return fullPattern.test(value);
  },

  splitContinuousDialogueLine(line, options = {}){
    const block = this.getQuoteBlockPattern();
    const matcher = new RegExp(block, "g");
    const indentMatch = String(line || "").match(/^\s*/);
    const indent = indentMatch ? indentMatch[0] : "";
    const trimmed = String(line || "").trim();
    const separator = "\n".repeat(this.normalizeParagraphGapValue(options.paragraphGap));

    if(this.isContinuousDialogueLine(line)){
      const parts = trimmed.match(matcher) || [];
      return parts.map(part=>indent + part.trim()).join(separator);
    }

    if(this.isQuoteToBracketLine(line)){
      const splitPattern = new RegExp(`^(${block}(?:\\s*${block})*)(\\[.+)$`);
      const matched = trimmed.match(splitPattern);
      const quotedHead = matched ? matched[1] : "";
      const bracketTail = matched ? matched[2].trim() : "";
      const parts = quotedHead.match(matcher) || [];
      if(parts.length && bracketTail.startsWith("[")){
        return parts.map(part=>indent + part.trim()).concat(indent + bracketTail).join(separator);
      }
    }

    return line;
  },

  splitContinuousDialogue(text, options = {}){
    return String(text || "")
      .split("\n")
      .map(line=>this.splitContinuousDialogueLine(line, options))
      .join("\n");
  },

  createReport(before, after, options = {}){
    return {
      engine: "DialogueEngine",
      version: "3.1",
      enabled: options.enabled === true,
      beforeLength: before.length,
      afterLength: after.length,
      diff: after.length - before.length,
      changed: before !== after
    };
  },

  clean(text, options = {}){
    const before = String(text || "");
    const enabled = options.enabled === true;

    if(!enabled){
      return {
        html: before,
        report: this.createReport(before, before, { enabled })
      };
    }

    const output = this.splitContinuousDialogue(before, {
      paragraphGap: this.normalizeParagraphGapValue(options.paragraphGap)
    });

    return {
      html: output,
      report: this.createReport(before, output, { enabled })
    };
  }
};
