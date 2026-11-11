// Bookie 3.8.3 - TOC Section Registry
// Central registry for standalone section titles and repeated section prefixes.
(function(root){
  "use strict";

  const rules = [];

  function cleanTitle(title){
    return String(title || "")
      .trim()
      .replace(/^#\s*/, "")
      .trim();
  }

  function normalizeLabel(text, mode){
    const value = cleanTitle(text);
    if(mode === "space") return value.replace(/\s+/g, " ").trim();
    return value.replace(/\s+/g, "").trim();
  }

  function compileRule(rule){
    if(!rule || !rule.id || !rule.source) return null;
    return {
      id: String(rule.id),
      source: String(rule.source),
      flags: rule.flags || "i",
      normalize: rule.normalize === "space" ? "space" : "compact"
    };
  }

  function register(rule){
    const compiled = compileRule(rule);
    if(!compiled) return false;

    const index = rules.findIndex(item => item.id === compiled.id);
    if(index >= 0) rules[index] = compiled;
    else rules.push(compiled);
    return true;
  }

  function unregister(id){
    const index = rules.findIndex(item => item.id === String(id));
    if(index < 0) return false;
    rules.splice(index, 1);
    return true;
  }

  function list(){
    return rules.map(rule => Object.assign({}, rule));
  }

  function matchStandalone(title){
    const text = cleanTitle(title);
    if(!text) return null;

    for(const rule of rules){
      const re = new RegExp("^(?:" + rule.source + ")$", rule.flags);
      const match = text.match(re);
      if(!match) continue;
      return {
        id: rule.id,
        label: normalizeLabel(match[0], rule.normalize),
        raw: match[0]
      };
    }
    return null;
  }

  function matchPrefixed(title, isChapterLike){
    const text = cleanTitle(title);
    if(!text) return null;

    for(const rule of rules){
      const re = new RegExp("^(" + rule.source + ")\\s+(.+)$", rule.flags);
      const match = text.match(re);
      if(!match) continue;

      const rest = match[2].trim();
      if(typeof isChapterLike === "function" && !isChapterLike(rest)) continue;

      return {
        id: rule.id,
        section: normalizeLabel(match[1], rule.normalize),
        rest,
        raw: match[1]
      };
    }
    return null;
  }

  function normalize(section){
    const standalone = matchStandalone(section);
    if(standalone) return standalone.label;
    return normalizeLabel(section, /^(part|act)\b/i.test(cleanTitle(section)) ? "space" : "compact");
  }

  // Stable defaults. Add or replace a section with register({...}).
  register({ id: "korean-numbered-part", source: "제\\s*\\d{1,3}\\s*부", normalize: "compact" });
  register({ id: "korean-part", source: "\\d{1,3}\\s*부", normalize: "compact" });
  register({ id: "special-extra", source: "특별외전", normalize: "compact" });
  register({ id: "extra", source: "외전", normalize: "compact" });
  register({ id: "side-extra", source: "번외", normalize: "compact" });
  register({ id: "after-story", source: "후일담", normalize: "compact" });
  register({ id: "part", source: "part\\s*\\d{1,3}", normalize: "space" });
  register({ id: "act", source: "act\\s*\\d{1,3}", normalize: "space" });

  const api = {
    register,
    unregister,
    list,
    matchStandalone,
    matchPrefixed,
    normalize,
    cleanTitle
  };

  root.BookieTocSectionRegistry = api;
  if(typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
