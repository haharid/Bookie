// Bookie 3.4.2 - Paragraph Engine v2
// Keeps the existing Stable paragraph HTML output while splitting the logic into small reusable rules.

const BookieParagraphEngine = {
  normalizeParagraphGapValue(value){
    const number = Number(value);
    return Number.isFinite(number) && number >= 2 ? Math.floor(number) : 2;
  },

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

  normalizeStraightQuotePairs(raw){
    return String(raw || "")
      .replace(/"([^"\n]*)"/g, "“$1”")
      .replace(/'([^'\n]*)'/g, "‘$1’");
  },

  normalizeLeadingHyphens(raw){
    return String(raw || "")
      .split("\n")
      .map(line=>{
        const matched = line.match(/^[ \t]*-(.*)$/);
        if(!matched) return line;

        const content = matched[1].replace(/^[ \t]+/, "");
        return content ? `– ${content}` : "–";
      })
      .join("\n");
  },

  normalizeTextRules(raw){
    let output = String(raw || "");
    output = this.normalizeStraightQuotePairs(output);
    output = this.normalizeLeadingHyphens(output);
    return output;
  },

  protectReplyLines(raw){
    const replies = [];
    const html = String(raw || "")
      .split("\n")
      .map(line=>{
        const matched = line.match(/^[ \t]*((?:[ㄴ↳└⌞][ \t]*)+)(.*)$/u);
        if(!matched) return line;

        const markerCount = (matched[1].match(/[ㄴ↳└⌞]/gu) || []).length;
        const content = matched[2].trim();
        const key = `[[BOOKIE_REPLY_LINE_${replies.length}]]`;

        replies.push({
          key,
          arrows: "⤷".repeat(markerCount),
          content
        });

        return key;
      })
      .join("\n");

    return { html, replies };
  },

  restoreFootnoteLinks(html, protectedLinks){
    let output = String(html || "");

    protectedLinks.forEach((link, index)=>{
      output = output.replace(`[[FOOTNOTE_LINK_${index}]]`, link);
    });

    return output;
  },

  restoreReplyLines(html, replies, escapeFn){
    let output = String(html || "");

    replies.forEach(reply=>{
      const escapedKey = reply.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const safeContent = reply.content
        ? ` ${this.escapeHtml(reply.content, escapeFn)}`
        : "";
      const replacement = `</p><p class="re_border"></p><p>${reply.arrows}${safeContent}</p><p>`;

      output = output.replace(new RegExp(`[ \\t]*${escapedKey}[ \\t]*`, "g"), replacement);
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
    const normalGap = this.normalizeParagraphGapValue(paragraphGap);
    return String(html || "").replace(/\n{2,}/g, run=>{
      return run.length > normalGap
        ? '</p><p class="txt"><br/></p><p>'
        : '</p><p>';
    });
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
    const paragraphGap = this.normalizeParagraphGapValue(options.paragraphGap);

    let output = before;
    output = this.protectSpecialSymbolLines(output);
    output = this.markStarBreaks(output);

    const protectedResult = this.protectFootnoteLinks(output);
    output = this.normalizeTextRules(protectedResult.html);

    const replyResult = this.protectReplyLines(output);
    output = this.escapeHtml(replyResult.html, options.escapeFn);

    output = this.applyParagraphBreaks(output, paragraphGap);
    output = this.joinSingleLineBreaks(output);
    output = this.restoreStarBreaks(output);
    output = this.normalizeParagraphTags(output);
    output = `<p>${output}</p>`;
    output = this.restoreReplyLines(output, replyResult.replies, options.escapeFn);
    output = this.restoreFootnoteLinks(output, protectedResult.protectedLinks);
    output = this.normalizeParagraphTags(output);

    return {
      html: output,
      report: this.createReport(before, output, { paragraphGap })
    };
  }
};
