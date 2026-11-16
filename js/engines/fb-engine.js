// Optional fb paragraph conversion.
// Runs after blank-line cleanup and converts either quote-only blocks delimited
// by visible blank paragraphs or every plain quote-only / leading-dash paragraph.

const BookieFbEngine = {
  blankParagraphSource: '<p(?: class="txt")?>\\s*<br\\s*\\/?>\\s*<\\/p>',
  quoteParagraphSource: "<p>\\s*(?:‘(?:(?!<\\/p>)[\\s\\S])*?’|'(?:(?!<\\/p>)[\\s\\S])*?')\\s*<\\/p>",
  dashParagraphSource: '<p>\\s*[-–](?:(?!<\\/p>)[\\s\\S])*?<\\/p>',

  convertBlankDelimitedParagraphs(html, paragraphSource = this.quoteParagraphSource){
    let convertedCount = 0;
    const blank = this.blankParagraphSource;
    const quoteParagraph = `(?:${paragraphSource})\\s*`;
    const quoteBlockPattern = new RegExp(
      `${blank}\\s*((?:${quoteParagraph})+)(?=${blank})`,
      "g"
    );

    const output = String(html || "").replace(quoteBlockPattern, (match, quoteBlock)=>{
      const converted = quoteBlock.replace(/<p>/g, ()=>{
        convertedCount += 1;
        return '<p class="fb">';
      });

      // Keep the trailing blank available as the next block's opening marker.
      // Adjacent markers are removed only after all selected conversions.
      return converted.trim();
    });

    return { html: output, convertedCount };
  },

  convertAllQuoteParagraphs(html, paragraphSource = this.quoteParagraphSource){
    let convertedCount = 0;
    const quoteParagraphPattern = new RegExp(paragraphSource, "g");
    const output = String(html || "").replace(quoteParagraphPattern, match=>{
      convertedCount += 1;
      return match.replace("<p>", '<p class="fb">');
    });

    return { html: output, convertedCount };
  },

  normalizeLeadingDashParagraphs(html){
    // Normalize ordinary and recall paragraphs; preserve other feature outputs.
    return String(html || "").replace(
      /(<p\b(?:[^>"']|"[^"]*"|'[^']*')*>)\s*-\s*(<\/p>)?/g,
      (match, opening, closing)=>{
        const classMatch=opening.match(/\sclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
        const classes=String(classMatch?.[1] || classMatch?.[2] || classMatch?.[3] || "").split(/\s+/).filter(Boolean);
        const ordinaryTag=/^<p\s*>$/.test(opening);
        const recallTag=classes.some(name=>["fb","flashback","txt"].includes(name));
        if(!ordinaryTag && !recallTag) return match;
        return closing ? `${opening}–${closing}` : `${opening}– `;
      }
    );
  },

  removeAdjacentBlankParagraphs(html){
    const blank=this.blankParagraphSource;
    const previousFb=/^<p class="(?:fb|flashback)">(?:(?!<\/p>)[\s\S])*?<\/p>\s*$/;
    const nextFb=/^<p class="(?:fb|flashback)">/;
    return String(html || "").replace(new RegExp(`(?:${blank}\\s*)+`,"g"),
      (run,offset,source)=>{
        const previousStart=source.lastIndexOf("<p",offset-1);
        const before=previousStart<0 ? "" : source.slice(previousStart,offset);
        const after=source.slice(offset+run.length,offset+run.length+32);
        return previousFb.test(before) || nextFb.test(after) ? "" : run;
      });
  },

  createReport(before, after, enabled, mode, convertedCount){
    return {
      engine: "FbEngine",
      version: "1.4",
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
    const quoteEnabled = options.quoteEnabled !== false;
    const dashEnabled = options.dashEnabled === true;
    const dashMode = options.dashMode === "all" ? "all" : "between-blanks";

    if(!enabled){
      return {
        html: before,
        report: this.createReport(before, before, false, mode, 0)
      };
    }

    // The main TXT pipeline normalizes hyphens before this step. Accept both
    // forms here too, including existing fb paragraphs and direct HTML callers.
    let output = dashEnabled ? this.normalizeLeadingDashParagraphs(before) : before;
    let convertedCount = 0;
    const sources = [];
    if(quoteEnabled) sources.push(this.quoteParagraphSource);
    if(dashEnabled) sources.push(this.dashParagraphSource);
    const hasBlankMode = (quoteEnabled && mode === "between-blanks") ||
      (dashEnabled && dashMode === "between-blanks");

    // Recognize the whole selected block before stripping any blank markers,
    // so quote and dash modes can be used together without losing boundaries.
    if(hasBlankMode && sources.length){
      const result = this.convertBlankDelimitedParagraphs(output, sources.join("|"));
      output = result.html;
      convertedCount += result.convertedCount;
    }
    const allSources = [];
    if(quoteEnabled && mode === "all") allSources.push(this.quoteParagraphSource);
    if(dashEnabled && dashMode === "all") allSources.push(this.dashParagraphSource);
    if(allSources.length){
      const result = this.convertAllQuoteParagraphs(output, allSources.join("|"));
      output = result.html;
      convertedCount += result.convertedCount;
    }
    output = this.removeAdjacentBlankParagraphs(output);
    return {
      html: output,
      report: {
        ...this.createReport(before, output, true, mode, convertedCount),
        quoteEnabled,
        dashEnabled,
        dashMode
      }
    };
  }
};

if(typeof window !== "undefined"){
  window.BookieFbEngine = BookieFbEngine;
}
