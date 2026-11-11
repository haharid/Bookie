// Bookie 3.4.1 - Blankline Engine v2
// Keeps the existing Stable blank-line output while splitting the logic into small reusable rules.

const BookieBlanklineEngine = {
  normalizeParagraphGapValue(value){
    const number = Number(value);
    return Number.isFinite(number) && number >= 2 ? Math.floor(number) : 2;
  },

  normalizeLineEndings(text){
    return String(text || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");
  },

  normalizeSafeWhitespace(text){
    return String(text || "")
      .replace(/\u00A0/g, " ")
      .replace(/[\u200B-\u200D\u2060\u2063\uFEFF]/g, "");
  },

  cleanSpace(text){
    return String(text || "")
      .replace(/[ \t]+$/gm, "")
      .replace(/^[ \t]+/gm, "")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/ +(?=[.!?…"'”’)]*$)/gm, "");
  },

  normalizeParagraphGap(text, paragraphGap){
    const normalGap = this.normalizeParagraphGapValue(paragraphGap);
    return String(text || "").replace(/\n{2,}/g, run=>{
      return run.length > normalGap ? "\n".repeat(normalGap + 1) : run;
    });
  },

  createReport(before, after, options = {}){
    return {
      engine: "BlanklineEngine",
      version: "2.0",
      beforeLength: before.length,
      afterLength: after.length,
      diff: after.length - before.length,
      changed: before !== after,
      paragraphGap: options.paragraphGap,
      spaceClean: options.spaceClean === true
    };
  },

  clean(text, options = {}){
    const before = String(text || "");
    const paragraphGap = this.normalizeParagraphGapValue(options.paragraphGap);
    const spaceClean = options.spaceClean === true;

    let output = before;
    output = this.normalizeLineEndings(output);
    output = this.normalizeSafeWhitespace(output);

    if(spaceClean){
      output = this.cleanSpace(output);
    }

    output = this.normalizeParagraphGap(output, paragraphGap);
    output = output.trim();

    return {
      html: output,
      report: this.createReport(before, output, {
        paragraphGap,
        spaceClean
      })
    };
  }
};
