// Optional fb paragraph conversion.
// Runs after blank-line cleanup and only converts quote-only blocks delimited by
// the visible blank paragraphs left by the existing paragraph engine.

const BookieFbEngine = {
  blankParagraphSource: '<p(?: class="txt")?>\\s*<br\\s*\\/?>\\s*<\\/p>',

  convertParagraphs(html){
    let convertedCount = 0;
    const blank = '<p class="txt">\\s*<br\\s*\\/?>\\s*<\\/p>';
    const quoteParagraph = "<p>\\s*(?:‘(?:(?!<\\/p>)[\\s\\S])*?’|'(?:(?!<\\/p>)[\\s\\S])*?')\\s*<\\/p>\\s*";
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

  removeAdjacentBlankParagraphs(html){
    const blank=this.blankParagraphSource;
    return String(html || "")
      .replace(new RegExp(`${blank}\\s*(?=<p class="(?:fb|flashback)">)`,"g"),"")
      .replace(new RegExp(`(<p class="(?:fb|flashback)">[\\s\\S]*?<\\/p>)\\s*${blank}`,"g"),"$1");
  },

  createReport(before, after, enabled, convertedCount){
    return {
      engine: "FbEngine",
      version: "1.1",
      enabled,
      convertedCount,
      beforeLength: before.length,
      afterLength: after.length,
      changed: before !== after
    };
  },

  clean(html, options = {}){
    const before = String(html || "");
    const enabled = options.enabled === true;

    if(!enabled){
      return {
        html: before,
        report: this.createReport(before, before, false, 0)
      };
    }

    const quoteResult = this.convertParagraphs(before);
    const output = this.removeAdjacentBlankParagraphs(quoteResult.html);
    return {
      html: output,
      report: this.createReport(before, output, true, quoteResult.convertedCount)
    };
  }
};

if(typeof window !== "undefined"){
  window.BookieFbEngine = BookieFbEngine;
}
