// Bookie 3.4.4 - General Cleanup Engine v2
// Foundation engine for final cleanup rules.
// Important: this version preserves existing Stable output by default.

const BookieGeneralCleanupEngine = {
  normalizeInput(text){
    return String(text || "");
  },

  runCharacterCleanup(text){
    // Remove artifact-only lines that should never become visible body text.
    // Ordinary text containing the same characters is preserved.
    return String(text || "").replace(
      /<p(?: class="txt")?>\s*(?:@+|\]+|[‘’'"“”\u2063]+)\s*<\/p>/g,
      ""
    );
  },

  runBracketCleanup(text){
    // Reserved for future bracket cleanup rules.
    // No-op in 3.4.4 to preserve output.
    return text;
  },

  runDividerCleanup(text){
    // Reserved for future divider cleanup rules.
    // No-op in 3.4.4 to preserve output.
    return text;
  },

  runPageCleanup(text){
    // Reserved for future page-marker cleanup rules.
    // No-op in 3.4.4 to preserve output.
    return text;
  },

  runFinalCleanup(text){
    const blank='<p(?: class="txt")?>\\s*<br\\s*\\/?>\\s*<\\/p>';
    return String(text || "")
      // More than one visible spacer is always reduced to one.
      .replace(new RegExp(`(?:${blank}\\s*){2,}`,"g"),'<p><br/></p>')
      // Flashback blocks own their spacing; adjacent blank paragraphs are removed.
      .replace(new RegExp(`${blank}\\s*(?=<p class="(?:fb|flashback)">)`,"g"),"")
      .replace(new RegExp(`(<p class="(?:fb|flashback)">[\\s\\S]*?<\\/p>)\\s*${blank}`,"g"),"$1")
      .replace(/<p>\s*<\/p>/g,"");
  },

  createReport(before, after){
    return {
      engine: "GeneralCleanupEngine",
      version: "2.0",
      beforeLength: before.length,
      afterLength: after.length,
      diff: after.length - before.length,
      changed: before !== after,
      mode: "safe-final-cleanup"
    };
  },

  clean(text, options = {}){
    const before = this.normalizeInput(text);

    let output = before;
    output = this.runCharacterCleanup(output, options);
    output = this.runBracketCleanup(output, options);
    output = this.runDividerCleanup(output, options);
    output = this.runPageCleanup(output, options);
    output = this.runFinalCleanup(output, options);

    return {
      html: output,
      report: this.createReport(before, output)
    };
  }
};

if(typeof window !== "undefined"){
  window.BookieGeneralCleanupEngine = BookieGeneralCleanupEngine;
}
