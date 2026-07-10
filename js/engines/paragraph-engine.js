// Bookie 3.4.2 - Paragraph Engine v2
// Keeps the existing Stable paragraph HTML output while splitting the logic into small reusable rules.

const BookieParagraphEngine = {
  protectSpecialSymbolLines(raw){
    return String(raw || "").replace(
      /\n([@\]#※▶▷◆■□★☆]+)\n/g,
      "\n\n$1\n\n"
    );
  },

  markStarBreaks(raw){
    return String(raw || "").replace(
      /(^|\n)(\*\s*\*\s*\*|\*\*\*)(\n|$)/g,
      "\n[[STAR_BREAK]]\n"
    );
  },

  protectFootnoteLinks(raw){
    const protectedLinks = [];

    const html = String(raw || "").replace(
      /<a\b[^>]*(?:epub:type=["']noteref["']|href=["'](?:footnotes\.xhtml)?#fn\d+["'])[^>]*>[\s\S]*?<\/a>/g,
      function(match){
        const key = `[[FOOTNOTE_LINK_${protectedLinks.length}]]`;
        protectedLinks.push(match);
        return key;
      }
    );

    return {
      html,
      protectedLinks
    };
  },

  restoreFootnoteLinks(html, protectedLinks){
    let output = String(html || "");

    protectedLinks.forEach((link, index)=>{
      output = output.replace(`[[FOOTNOTE_LINK_${index}]]`, link);
    });

    return output;
  },

  escapeHtml(raw, escapeFn){
    if(typeof escapeFn === "function"){
      return escapeFn(raw);
    }

    if(typeof esc === "function"){
      return esc(raw);
    }

    return String(raw || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  },

  applyParagraphBreaks(html, paragraphGap){
    let output = String(html || "");

    if(paragraphGap === 3){
      output = output.replace(/\n{5,}/g, '</p><p class="txt"><br/></p><p>');
      output = output.replace(/\n{3}/g, '</p><p>');
      return output;
    }

    output = output.replace(/\n{3,}/g, '</p><p class="txt"><br/></p><p>');
    output = output.replace(/\n{2}/g, '</p><p>');

    return output;
  },

  joinSingleLineBreaks(html){
    return String(html || "").replace(/\n/g, " ");
  },

  restoreStarBreaks(html){
    return String(html || "").replace(
      /\[\[STAR_BREAK\]\]/g,
      '</p><p style="text-align: center;">* * *</p><p>'
    );
  },

  normalizeParagraphTags(html){
    return String(html || "")
      .replace(/<p><\/p>/g, "")
      .replace(/<p>\s*<p>/g, "<p>")
      .replace(/<\/p>\s*<\/p>/g, "</p>")
      .replace(/<br\/><\/p><p><br\/><\/p><p style="text-align: center;">/g, '</p><p class="txt"><br/></p><p style="text-align: center;">')
      .replace(/<p><br\/><\/p><br\/><p>/g, '<p class="txt"><br/></p><p>');
  },

  createReport(before, after, options = {}){
    return {
      engine: "ParagraphEngine",
      version: "2.0",
      beforeLength: before.length,
      afterLength: after.length,
      diff: after.length - before.length,
      changed: before !== after,
      paragraphGap: options.paragraphGap
    };
  },

  build(raw, options = {}){
    const before = String(raw || "");
    const paragraphGap = options.paragraphGap === 3 ? 3 : 2;

    let output = before;
    output = this.protectSpecialSymbolLines(output);
    output = this.markStarBreaks(output);

    const protectedResult = this.protectFootnoteLinks(output);
    output = this.escapeHtml(protectedResult.html, options.escapeFn);
    output = this.restoreFootnoteLinks(output, protectedResult.protectedLinks);

    output = this.applyParagraphBreaks(output, paragraphGap);
    output = this.joinSingleLineBreaks(output);
    output = this.restoreStarBreaks(output);
    output = this.normalizeParagraphTags(output);
    output = `<p>${output}</p>`;

    return {
      html: output,
      report: this.createReport(before, output, { paragraphGap })
    };
  }
};
