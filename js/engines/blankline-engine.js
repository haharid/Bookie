// Bookie 3.4.1 - Blankline Engine v2
// Keeps the existing Stable blank-line output while splitting the logic into small reusable rules.

const BookieBlanklineEngine = {
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
    if(paragraphGap === 3){
      return String(text || "").replace(/\n{5,}/g, "\n\n\n\n");
    }

    return String(text || "").replace(/\n{4,}/g, "\n\n\n");
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
    const paragraphGap = options.paragraphGap === 3 ? 3 : 2;
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
