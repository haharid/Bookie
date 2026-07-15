// Bookie 3.3.1 - Configuration Foundation Upgrade
// Central default config. Defaults preserve existing output.

const BookieConfig = {
  debug: false,
  logger: true,
  plugins: true,

  engine: {
    continueOnStepError: true
  },

  cleaner: {
    footnote: true,
    blankline: true,
    dialogue: true,
    paragraph: true,
    boxWrap: true,
    fb: true,
    general: true
  },

  toc: {
    // Internal debug only. False keeps normal output and UI unchanged.
    debugProfile: false,

    // Merge bare chapter number lines with the next short subtitle line.
    // Example: "01." + "입단" -> "01. 입단".
    mergeAdjacentTitleLines: true,

    // Normalize repeated series titles.
    // Example: "01. 입단(1)", "01. 입단(2)" -> "01. 입단", "02.".
    normalizeRepeatSeries: true,

    // Keep repeated titles exactly as written. Multi-volume novels and Q&A
    // sections can legitimately contain the same visible title many times.
    canonicalDuplicateRemoval: false,

    // Flatten standalone section TOC entries into the first following chapter only.
    // Example: "1부", "1화" -> "1부 1화", then "2화" stays "2화".
    sectionFirstPrefix: true,

    // Internal inspector data for debugging TOC normalization/removal.
    // False keeps the normal UI unchanged.
    debugInspector: false
  }
};

if(typeof window !== "undefined"){
  window.BookieConfig = BookieConfig;
}
