// Optional fb paragraph conversion.
// Runs after blank-line cleanup and converts either quote-only blocks delimited
// by visible blank paragraphs or every plain quote-only paragraph.

const BookieFbEngine = {
  blankParagraphSource: '<p(?: class="txt")?>\\s*<br\\s*\\/?>\\s*<\\/p>',
  quoteParagraphSource: "<p>\\s*(?:‘(?:(?!<\\/p>)[\\s\\S])*?’|'(?:(?!<\\/p>)[\\s\\S])*?')\\s*<\\/p>",

  convertBlankDelimitedParagraphs(html){
    let convertedCount = 0;
    const blank = '<p class="txt">\\s*<br\\s*\\/?>\\s*<\\/p>';
    const quoteParagraph = `${this.quoteParagraphSource}\\s*`;
    const quoteBlockPattern = new RegExp(
      `${blank}\\s*((?:${quoteParagraph})+)${blank}`,
      "g"
    );

    const output = String(html || "").replace(quoteBlockPattern, (match, quoteBlock)=>{
      const converted = quoteBlock.replace(/<p>/g, ()=>{
        convertedCount += 1;
        return '<p class="fb">';
      });

      // The two visible blank paragraphs are block markers and are removed
      // together with the conversion, matching the existing regex workflow.
      return converted.trim();
    });

    return { html: output, convertedCount };
  },

  convertAllQuoteParagraphs(html){
    let convertedCount = 0;
    const quoteParagraphPattern = new RegExp(this.quoteParagraphSource, "g");
    const output = String(html || "").replace(quoteParagraphPattern, match=>{
      convertedCount += 1;
      return match.replace("<p>", '<p class="fb">');
    });

    return { html: output, convertedCount };
  },

  removeAdjacentBlankParagraphs(html){
    const blank=this.blankParagraphSource;
    return String(html || "")
      .replace(new RegExp(`${blank}\\s*(?=<p class="(?:fb|flashback)">)`,"g"),"")
      .replace(new RegExp(`(<p class="(?:fb|flashback)">[\\s\\S]*?<\\/p>)\\s*${blank}`,"g"),"$1");
  },

  createReport(before, after, enabled, mode, convertedCount){
    return {
      engine: "FbEngine",
      version: "1.2",
      enabled,
      mode,
      convertedCount,
      beforeLength: before.length,
      afterLength: after.length,
      changed: before !== after
    };
  },

  clean(html, options = {}){
    const before = String(html || "");
    const enabled = options.enabled === true;
    const mode = options.mode === "all" ? "all" : "between-blanks";

    if(!enabled){
      return {
        html: before,
        report: this.createReport(before, before, false, mode, 0)
      };
    }

    const quoteResult = mode === "all"
      ? this.convertAllQuoteParagraphs(before)
      : this.convertBlankDelimitedParagraphs(before);
    const output = this.removeAdjacentBlankParagraphs(quoteResult.html);
    return {
      html: output,
      report: this.createReport(before, output, true, mode, quoteResult.convertedCount)
    };
  }
};

if(typeof window !== "undefined"){
  window.BookieFbEngine = BookieFbEngine;
}
