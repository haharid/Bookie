// Bookie 3.3.4 - Debug Access / Step Report Context Upgrade
// Adds runtime statistics to BookieContext while keeping EPUB output unchanged.

function createBookieContext(sourceText, options = {}){
  const baseConfig = typeof BookieConfig !== "undefined" ? BookieConfig : {};

  return {
    sourceText,
    html: sourceText,
    options,
    config: Object.assign({}, baseConfig, options.config || {}),
    logs: [],
    stats: {
      totalTime: 0,
      steps: [],
      errors: [],
      dependencies: []
    },
    report: null,
    debug: {
      createdAt: new Date().toISOString(),
      lastReportText: ""
    },
    meta: {},
    plugins: {}
  };
}
