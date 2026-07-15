// Bookie Step 5 - parser and chapter detection

function isHanjaTocEnabled(){
  const checkbox = (typeof document !== "undefined")
    ? document.getElementById("includeHanjaToc")
    : null;
  return !!(checkbox && checkbox.checked);
}

function chapterNumberSource(){
  return isHanjaTocEnabled()
    ? "(?:\\d{1,5}|[〇零一二三四五六七八九十百千萬万兩两壹貳贰參叁肆伍陸陆柒捌玖拾佰仟]+)"
    : "(?:\\d{1,5})";
}

function makeFlexiblePattern(text){
  text = (text || "").trim();

  if(/^\d+\.\s+/.test(text)){
    return /^\d+\.\s+/;
  }

  if(/^\#?\d+\s*화/.test(text)){
    return /^\#?\d+\s*화/;
  }

  if(/^\d+\s*회/.test(text)){
    return /^\d+\s*회/;
  }

  if(/^제\s*\d+\s*화/.test(text)){
    return /^제\s*\d+\s*화/;
  }

  if(/^제\s*\d+\s*장/.test(text)){
    return /^제\s*\d+\s*장/;
  }

  if(/^(프롤로그|에필로그|외전)/.test(text)){
    return /^(프롤로그|에필로그|외전)/;
  }

  return null;
}

function normalizeChapterLine(text){
  return String(text || "")
    .replace(/\u00A0/g," ")
    .replace(/[\u200B-\u200D\u2060\u2063\uFEFF]/g,"")
    .replace(/[“”]/g,'"')
    .replace(/[‘’]/g,"'")
    .trim();
}

function stripChapterWrappers(line){
  line = normalizeChapterLine(line);
  const pairs = {
    "[": "]", "(": ")", "{": "}", "<": ">",
    "〈": "〉", "《": "》", "「": "」", "『": "』",
    "【": "】", "〔": "〕", "〖": "〗"
  };

  let changed = true;
  while(changed && line.length >= 2){
    changed = false;
    const first = line[0];
    const last = line[line.length - 1];
    if(pairs[first] && pairs[first] === last){
      line = line.slice(1, -1).trim();
      changed = true;
    }
  }

  return line;
}

function isBlankLineAt(i){
  if(i < 0 || i >= lines.length) return true;
  return !normalizeChapterLine(lines[i]).trim();
}

function createTocProfile(i){
  const original = normalizeChapterLine(lines[i]);
  const num = chapterNumberSource();
  const line = stripChapterWrappers(original);
  const profile = {
    index: i,
    original,
    line,
    score: 0,
    reasons: [],
    rejects: []
  };

  function add(points, reason){
    profile.score += points;
    profile.reasons.push({ points, reason });
  }

  function reject(reason){
    profile.rejects.push(reason);
  }

  if(!line){
    reject("blank");
    return profile;
  }

  if(line.length > 80){
    reject("too-long");
    return profile;
  }

  if(line.length > 35 && /[.!?。？！…]["')\]」』”’]*$/.test(line)){
    reject("sentence-like-long-line");
    return profile;
  }

  if(/["“”].+["“”]/.test(line) && line.length > 20){
    reject("dialogue-like-line");
    return profile;
  }

  if(new RegExp("^#\\s*"+num+"\\s*(?:[.．、:]|화|회|편|장|부|권|話|篇|回|章|部|卷)?\\s*\\S*","i").test(line)) add(8, "hash-number");
  if(new RegExp("^#\\s*(?:제|第)\\s*"+num+"\\s*(?:화|장|회|부|권|話|章|回|部|卷)\\s*\\S*","i").test(line)) add(8, "hash-je-number");
  if(/^#\s*(프롤로그|prologue|에필로그|epilogue|외전|번외|서장|종장|막간|인터루드|interlude|후기|작가의 말|if)/i.test(line)) add(8, "hash-special-title");
  if(new RegExp("^"+num+"\\s*[=\\-─━_＊*]{2,}").test(line)) add(8, "number-divider");
  if(new RegExp("^"+num+"\\s*[.．、:]\\s*\\S+").test(line)) add(7, "number-dot-title");
  if(new RegExp("^"+num+"\\s*(화|편|회|장|부|권|話|篇|回|章|部|卷)\\s*\\S*","i").test(line)) add(8, "number-unit-title");
  if(new RegExp("^(?:제|第)\\s*"+num+"\\s*(화|장|회|부|권|話|章|回|部|卷)\\s*\\S*","i").test(line)) add(8, "je-number-unit-title");
  if(new RegExp("^(chapter|ch|episode|ep|part|vol\\.?|volume)\\s*[.#:-]?\\s*"+num,"i").test(line)) add(8, "english-chapter-title");
  if(/^(프롤로그|prologue|에필로그|epilogue|외전|번외|서장|종장|막간|인터루드|interlude|후기|작가의 말|if)/i.test(line)) add(8, "special-title");
  if(new RegExp("^"+num+"$").test(line)) add((isBlankLineAt(i-1) || isBlankLineAt(i+1)) ? 7 : 4, "number-only");
  if(isBareChapterNumberLine(line) && i + 1 < lines.length && isMergeableSubtitleLine(lines[i + 1])) add(8, "bare-number-with-subtitle");

  if(original !== line) add(1, "wrapper-stripped");
  if(isBlankLineAt(i-1)) add(1, "blank-before");
  if(isBlankLineAt(i+1)) add(1, "blank-after");
  if(line.length <= 25) add(1, "short-line");
  if(/^(댓글|조회수|구독자|좋아요|싫어요|작성자|닉네임|공지)\b/.test(line)) add(-5, "ui-noise-word");

  return profile;
}

function chapterDetectScore(i){
  return createTocProfile(i).score;
}

function collectTocCandidates(){
  const candidates = [];

  for(let i=0;i<lines.length;i++){
    const profile = createTocProfile(i);
    if(profile.score > 0 || profile.rejects.length){
      candidates.push(profile);
    }
  }

  return candidates;
}

function logTocProfileSummary(candidates){
  if(typeof log !== "function") return;
  const config = (typeof window !== "undefined" && window.BookieConfig) ? window.BookieConfig : null;
  if(!(config && config.toc && config.toc.debugProfile)) return;

  const picked = candidates
    .filter(item => item.score >= 7)
    .slice(0, 30)
    .map(item => {
      const reasons = item.reasons.map(r => `${r.points > 0 ? "+" : ""}${r.points} ${r.reason}`).join(", ");
      return `#${item.index} score ${item.score} / ${item.line} / ${reasons}`;
    });

  log("TOC Profile candidates: " + candidates.length);
  if(picked.length){
    log("TOC Profile picked preview:\n" + picked.join("\n"));
  }
}

function autoDetectChapters(){
  if(!(document.getElementById("autoDetectToc") &&
       document.getElementById("autoDetectToc").checked)){
    return;
  }

  const current = new Set(selectedIndexes);
  let sureCount = 0;
  let maybeCount = 0;

  const candidates = collectTocCandidates();
  logTocProfileSummary(candidates);

  for(const candidate of candidates){
    const i = candidate.index;
    const score = candidate.score;
    if(score >= 7){
      current.add(i);
      tocConfidence[i] = score >= 9 ? "sure" : "maybe";
      if(score >= 9) sureCount++;
      else maybeCount++;
    }
  }

  selectedIndexes = [...current].sort((a,b)=>a-b);

  if(selectedIndexes.length){
    renderToc();
    updateCount();
    document.getElementById("tocPanel").classList.add("closed");
    document.getElementById("tocArrow").textContent="▸";
    log("목차 자동 탐지: " + selectedIndexes.length + "개 / 확실 " + sureCount + "개 / 의심 " + maybeCount + "개");
  }
}

function normalizePattern(line){
  line = stripChapterWrappers(line).trim();

  const num = chapterNumberSource();
  const unit = "(?:화|편|회|장|부|권|話|篇|回|章|部|卷)";
  const numeralToken = /\d{1,5}|[〇零一二三四五六七八九十百千萬万兩两壹貳贰參叁肆伍陸陆柒捌玖拾佰仟]+/;
  const escape = value => String(value || "").replace(/[.*+?^${}()|[\]\\]/g,"\\$&");

  let m;

  // # + 숫자 + 단위/구두점
  if((m=line.match(new RegExp("^#\\s*("+num+")\\s*([.．、:]|화|회|편|장|부|권|話|篇|回|章|部|卷)","i")))){
    const token=m[2];
    if(/[.．、:]/.test(token)) return new RegExp("^#\\s*"+num+"\\s*[.．、:]\\s*.*$","i");
    return new RegExp("^#\\s*"+num+"\\s*"+escape(token)+"\\s*.*$","i");
  }

  // #제1장 / #第一章
  if((m=line.match(new RegExp("^#\\s*(?:제|第)\\s*("+num+")\\s*(화|장|회|부|권|話|章|回|部|卷)","i")))){
    return new RegExp("^#\\s*(?:제|第)\\s*"+num+"\\s*"+escape(m[2])+"\\s*.*$","i");
  }

  if(/^#\s*(프롤로그|prologue|에필로그|epilogue|외전|번외|서장|종장|막간|인터루드|interlude|후기|작가의 말|if)/i.test(line)) return /^#\s*(프롤로그|prologue|에필로그|epilogue|외전|번외|서장|종장|막간|인터루드|interlude|후기|작가의 말|if).*$/i;

  // 숫자 + 구분선 / 구두점 / 단독 숫자
  if(new RegExp("^"+num+"\\s*[=\\-─━_＊*]{2,}","i").test(line)) return new RegExp("^"+num+"\\s*[=\\-─━_＊*]{2,}\\s*.*$","i");
  if(new RegExp("^"+num+"\\s*[.．、:]\\s*\\S*","i").test(line)) return new RegExp("^"+num+"\\s*[.．、:]\\s*.*$","i");
  if(new RegExp("^"+num+"$","i").test(line)) return new RegExp("^"+num+"$","i");

  // 1화 / 一화 / 12장 제목
  if((m=line.match(new RegExp("^("+num+")\\s*(화|편|회|장|부|권|話|篇|回|章|部|卷)","i")))){
    return new RegExp("^"+num+"\\s*"+escape(m[2])+"\\s*.*$","i");
  }

  // 제1화 / 第一章
  if((m=line.match(new RegExp("^(?:제|第)\\s*("+num+")\\s*(화|장|회|부|권|話|章|回|部|卷)","i")))){
    return new RegExp("^(?:제|第)\\s*"+num+"\\s*"+escape(m[2])+"\\s*.*$","i");
  }

  // Chapter 8 / Episode 三: 입력한 영문 접두어 자체를 유지한다.
  if((m=line.match(new RegExp("^(chapter|ch|episode|ep|part|vol\\.?|volume)\\s*[.#:-]?\\s*("+num+")","i")))){
    const englishPrefix = escape(m[1]);
    return new RegExp("^"+englishPrefix+"\\s*[.#:-]?\\s*"+num+"\\s*.*$","i");
  }

  // 글자가 먼저 나오고 뒤에 번호가 오는 형식.
  // 예: "외전 15 바보", "시즌 二 시작", "멍청이 1화".
  const tokenMatch = numeralToken.exec(line);
  if(tokenMatch && tokenMatch.index > 0){
    const prefix = line.slice(0, tokenMatch.index).trim();
    const after = line.slice(tokenMatch.index + tokenMatch[0].length);
    const unitMatch = after.match(/^\s*(화|편|회|장|부|권|[.．、:])/i);
    const prefixSource = escape(prefix).replace(/\\\s+/g,"\\s*");

    if(unitMatch){
      const token = unitMatch[1];
      const unitSource = /[.．、:]/.test(token) ? "[.．、:]" : escape(token);
      return new RegExp("^"+prefixSource+"\\s*"+num+"\\s*"+unitSource+"\\s*.*$","i");
    }

    return new RegExp("^"+prefixSource+"\\s*"+num+"\\s*.*$","i");
  }

  if(/^(프롤로그|prologue|에필로그|epilogue|외전|번외|서장|종장|막간|인터루드|interlude|후기|작가의 말|if)/i.test(line)) return /^(프롤로그|prologue|에필로그|epilogue|외전|번외|서장|종장|막간|인터루드|interlude|후기|작가의 말|if).*$/i;

  // 숫자 뒤에 제목만 있는 형식.
  if(new RegExp("^"+num+"\\s+\\S+","i").test(line)) return new RegExp("^"+num+"\\s+.*$","i");

  return new RegExp("^"+escape(line));
}

function isTocTitleMergeEnabled(){
  const config = (typeof window !== "undefined" && window.BookieConfig) ? window.BookieConfig : null;
  return !(config && config.toc && config.toc.mergeAdjacentTitleLines === false);
}

function isBareChapterNumberLine(line){
  line = stripChapterWrappers(line || "").trim();
  const num = chapterNumberSource();
  return (
    new RegExp("^#?\\s*"+num+"\\s*[.．、:]?$").test(line) ||
    new RegExp("^(?:제|第)\\s*"+num+"\\s*(화|장|회|부|권|話|章|回|部|卷)\\s*[.．、:]?$","i").test(line)
  );
}

function isMergeableSubtitleLine(line){
  line = stripChapterWrappers(line || "").trim();

  if(!line) return false;
  if(line.length > 35) return false;
  if(/[.!?。？！…]["')\]」』”’]*$/.test(line)) return false;
  if(/^[\d\s.．、:#\-─━_＊*]+$/.test(line)) return false;
  if(/^(댓글|조회수|구독자|좋아요|싫어요|작성자|닉네임|공지)\b/.test(line)) return false;

  return true;
}

function joinTocTitleParts(base, subtitle){
  base = stripChapterWrappers(base || "").trim();
  subtitle = stripChapterWrappers(subtitle || "").trim();

  if(!base) return subtitle;
  if(!subtitle) return base;
  if(/[.．、:]$/.test(base)) return `${base} ${subtitle}`;
  return `${base} ${subtitle}`;
}

function baseTocTitleFromLine(line){
  return stripChapterWrappers(line || "").trim();
}

function getTocBaseTitleAt(idx){
  const base = baseTocTitleFromLine(lines[idx]);

  if(!isTocTitleMergeEnabled()) return base;
  if(!isBareChapterNumberLine(base)) return base;
  if(idx + 1 >= lines.length) return base;
  if(selectedIndexes.includes(idx + 1)) return base;

  const next = baseTocTitleFromLine(lines[idx + 1]);
  if(!isMergeableSubtitleLine(next)) return base;

  const nextProfile = createTocProfile(idx + 1);
  if(nextProfile.score >= 7) return base;

  return joinTocTitleParts(base, next);
}

function isTocRepeatSeriesEnabled(){
  const config = (typeof window !== "undefined" && window.BookieConfig) ? window.BookieConfig : null;
  return !(config && config.toc && config.toc.normalizeRepeatSeries === false);
}

function tocCircledNumberValue(ch){
  const table = {
    "①": 1, "②": 2, "③": 3, "④": 4, "⑤": 5,
    "⑥": 6, "⑦": 7, "⑧": 8, "⑨": 9, "⑩": 10,
    "⑪": 11, "⑫": 12, "⑬": 13, "⑭": 14, "⑮": 15,
    "⑯": 16, "⑰": 17, "⑱": 18, "⑲": 19, "⑳": 20
  };
  return table[ch] || null;
}

function normalizeTocSeriesKey(text){
  return String(text || "")
    .replace(/\u00A0/g," ")
    .replace(/[\u200B-\u200D\u2060\u2063\uFEFF]/g,"")
    .replace(/[“”]/g,'"')
    .replace(/[‘’]/g,"'")
    .replace(/[\s.．、:：\-—–_]+/g,"")
    .toLowerCase();
}

function parseTocNumberedStem(stem){
  let text = stripChapterWrappers(stem || "").trim();
  if(!text) return null;

  let marker = "";
  const hash = text.match(/^#\s*/);
  if(hash){
    marker = "#";
    text = text.slice(hash[0].length).trim();
  }

  function make(style, numberText, unitOrSep, baseTitle){
    const title = String(baseTitle || "").trim();
    if(!title) return null;
    return {
      marker,
      style,
      numberText,
      startNumber: Number(numberText),
      width: numberText.length,
      unitOrSep: unitOrSep || ".",
      baseTitle: title,
      key: normalizeTocSeriesKey(title)
    };
  }

  let m = text.match(/^(?:제|第)\s*(\d{1,5})\s*(화|장|회|부|권|話|章|回|部|卷)\s*(.+)$/i);
  if(m) return make("je-unit", m[1], m[2], m[3]);

  m = text.match(/^(\d{1,5})\s*(화|회|편|장|부|권)\s*(.+)$/i);
  if(m) return make("unit", m[1], m[2], m[3]);

  m = text.match(/^(\d{1,5})(\s*[.．、:：])\s*(.+)$/);
  if(m) return make("separator", m[1], m[2].trim() || ".", m[3]);

  // Conservative support for titles such as "01 입단(1)".
  m = text.match(/^(\d{1,5})\s+([^\d].+)$/);
  if(m) return make("space", m[1], ".", m[2]);

  m = text.match(/^(chapter|ch|episode|ep|part|vol\.?|volume)\s*[.#:-]?\s*(\d{1,5})\s+(.+)$/i);
  if(m){
    const meta = make("english", m[2], m[1], m[3]);
    if(meta) meta.englishWord = m[1];
    return meta;
  }

  return null;
}

function parseTocRepeatSeriesTitle(title){
  const raw = stripChapterWrappers(title || "").trim();
  if(!raw) return null;

  function finish(stem, partText, totalText, type){
    const prefix = parseTocNumberedStem(stem);
    const part = Number(partText);
    const total = totalText ? Number(totalText) : null;
    if(!prefix || !part) return null;
    return Object.assign({}, prefix, {
      raw,
      part,
      total,
      type
    });
  }

  // #41화 오늘 (1), 01. 입단 [1/4], 제1장 시작（1）
  let m = raw.match(/^(.+?)\s*[\(\[（［]\s*(\d{1,3})(?:\s*\/\s*(\d{1,3}))?\s*[\)\]）］]\s*$/);
  if(m) return finish(m[1], m[2], m[3], m[3] ? "fraction" : "paren-number");

  // #41화 오늘①, 01. 입단 ②
  m = raw.match(/^(.+?)\s*([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳])\s*$/);
  if(m){
    const part = tocCircledNumberValue(m[2]);
    return finish(m[1], String(part || ""), null, "circled-number");
  }

  // 01. 입단 1 / 01. 입단 - 1 / #41화 오늘 - 1
  // Keep this conservative: the suffix must be a small numeric part at the end.
  m = raw.match(/^(.+?)(?:\s+|\s*[-–—_]\s*)(\d{1,3})\s*$/);
  if(m){
    const part = Number(m[2]);
    if(part >= 1 && part <= 20){
      return finish(m[1], m[2], null, "space-number");
    }
  }

  return null;
}

function formatTocSeriesNumber(n, parsed){
  const safeWidth = Math.max(1, Math.min(Number(parsed.width) || 1, 5));
  const num = String(n).padStart(safeWidth, "0");
  const marker = parsed.marker || "";

  if(parsed.style === "je-unit") return `${marker}제${num}${parsed.unitOrSep}`;
  if(parsed.style === "unit") return `${marker}${num}${parsed.unitOrSep}`;
  if(parsed.style === "separator") return `${marker}${num}${parsed.unitOrSep || "."}`;
  if(parsed.style === "english") return `${parsed.englishWord || parsed.unitOrSep || "Chapter"} ${num}`;
  return `${marker}${num}${parsed.unitOrSep || "."}`;
}

function isNextTocSeriesItem(first, prev, next){
  if(!next.parsed) return false;
  if(next.parsed.key !== first.parsed.key) return false;
  if(first.parsed.total && next.parsed.total && first.parsed.total !== next.parsed.total) return false;

  // Normal case: (1), (2), (3) / ①, ②, ③.
  if(next.parsed.part === prev.parsed.part + 1) return true;

  // Some TXT sources repeat the same visible suffix while the chapter number changes:
  // #44화 하루 (1), #45화 하루 (1). Treat consecutive same-title suffixes as one series.
  if(next.parsed.part === prev.parsed.part) return true;

  return false;
}

function applyTocRepeatSeriesTitles(map, baseByIndex, indexes){
  if(!isTocRepeatSeriesEnabled()) return map;

  const tocIndexes = indexes || selectedIndexes;
  const items = tocIndexes.map((idx, order) => ({
    idx,
    order,
    title: baseByIndex[idx],
    parsed: parseTocRepeatSeriesTitle(baseByIndex[idx])
  }));

  const groups = [];
  let i = 0;

  while(i < items.length){
    const first = items[i];

    if(!first.parsed){
      i++;
      continue;
    }

    const group = [first];
    let j = i + 1;

    while(j < items.length){
      const next = items[j];
      const prev = group[group.length - 1];
      if(!isNextTocSeriesItem(first, prev, next)) break;
      group.push(next);
      j++;
    }

    if(group.length >= 2 && group[0].parsed.part === 1){
      groups.push(group);
    }

    i = Math.max(j, i + 1);
  }

  if(!groups.length) return map;

  const result = Object.assign({}, map);
  const firstParsed = groups[0][0].parsed;
  const globalStart = Number(firstParsed.startNumber) || 1;

  groups.forEach(group => {
    group.forEach((item, offset) => {
      const number = formatTocSeriesNumber(globalStart + item.order, firstParsed);
      result[item.idx] = offset === 0 ? `${number} ${item.parsed.baseTitle}` : number;
    });
  });

  return result;
}


function isTocSectionFirstPrefixEnabled(){
  const config = (typeof window !== "undefined" && window.BookieConfig) ? window.BookieConfig : null;
  return !(config && config.toc && config.toc.sectionFirstPrefix === false);
}

function escapeTocRegex(text){
  return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeTocRuleTitle(title){
  // TOC rules must work on every title style Bookie already accepts.
  // Treat leading chapter markers such as "#외전" and "#2부" as visual
  // markers for detection while preserving normal chapter titles elsewhere.
  return stripChapterWrappers(title || "").trim().replace(/^#\s*/, "").trim();
}

function getTocSectionRegistry(){
  if(typeof window !== "undefined" && window.BookieTocSectionRegistry){
    return window.BookieTocSectionRegistry;
  }
  if(typeof globalThis !== "undefined" && globalThis.BookieTocSectionRegistry){
    return globalThis.BookieTocSectionRegistry;
  }
  return null;
}

function normalizeTocSectionLabel(section){
  const registry = getTocSectionRegistry();
  if(registry && typeof registry.normalize === "function"){
    return registry.normalize(section);
  }

  const text = normalizeTocRuleTitle(section);
  if(/^(part|act)\s*\d{1,3}$/i.test(text)) return text.replace(/\s+/g, " ").trim();
  return text.replace(/\s+/g, "").trim();
}

function parseTocStandaloneSection(title){
  const registry = getTocSectionRegistry();
  if(registry && typeof registry.matchStandalone === "function"){
    const match = registry.matchStandalone(title);
    return match ? match.label : null;
  }

  // Compatibility fallback for isolated parser tests that do not load registry.
  const text = normalizeTocRuleTitle(title);
  if(!text) return null;
  if(/^제\s*\d{1,3}\s*부$/i.test(text)) return normalizeTocSectionLabel(text);
  if(/^\d{1,3}\s*부$/i.test(text)) return normalizeTocSectionLabel(text);
  if(/^(외전|특별외전|번외|후일담)$/i.test(text)) return normalizeTocSectionLabel(text);
  if(/^(part|act)\s*\d{1,3}$/i.test(text)) return normalizeTocSectionLabel(text);
  return null;
}

function parseTocChapterLikeTitle(title){
  const text = normalizeTocRuleTitle(title);
  if(!text) return null;

  // Chapter-like lines only. Keep this conservative so ordinary titles such as
  // "작가의 말" are not absorbed into a section.
  if(/^#\s*(?:제\s*)?\d{1,5}\s*(?:화|회|편|장)\s*.*$/i.test(text)) return text;
  if(/^(?:제\s*)?\d{1,5}\s*(?:화|회|편|장)\s*.*$/i.test(text)) return text;
  if(/^\d{1,5}\s+\S+.*$/.test(text)) return text;
  if(/^\d{1,5}\s*[.．、:：]\s*\S+.*$/.test(text)) return text;
  if(/^(chapter|ch|episode|ep)\s*[.#:-]?\s*\d{1,5}\s*.*$/i.test(text)) return text;

  return null;
}

function parseTocPrefixedSectionChapter(title){
  const registry = getTocSectionRegistry();
  if(registry && typeof registry.matchPrefixed === "function"){
    const match = registry.matchPrefixed(title, value => !!parseTocChapterLikeTitle(value));
    return match ? { section: match.section, rest: match.rest } : null;
  }

  // Compatibility fallback for isolated parser tests that do not load registry.
  const text = normalizeTocRuleTitle(title);
  if(!text) return null;
  const sectionPatterns = [
    "제\\s*\\d{1,3}\\s*부", "\\d{1,3}\\s*부", "특별외전", "외전",
    "번외", "후일담", "part\\s*\\d{1,3}", "act\\s*\\d{1,3}"
  ];
  for(const source of sectionPatterns){
    const re = new RegExp("^(" + source + ")\\s+(.+)$", "i");
    const match = text.match(re);
    if(match && parseTocChapterLikeTitle(match[2].trim())){
      return { section: normalizeTocSectionLabel(match[1]), rest: match[2].trim() };
    }
  }
  return null;
}

function tocTitleStartsWithSection(title, section){
  const text = normalizeTocRuleTitle(title);
  const sec = normalizeTocSectionLabel(section);
  if(!text || !sec) return false;
  return new RegExp("^" + escapeTocRegex(sec) + "(?:\\s|$)", "i").test(text);
}


function getTocSectionContextMap(map, indexes){
  const tocIndexes = indexes || selectedIndexes;
  const context = {};
  let activeSection = null;

  tocIndexes.forEach(idx => {
    const current = map[idx];
    if(!current) return;

    const standalone = parseTocStandaloneSection(current);
    if(standalone){
      activeSection = standalone;
      context[idx] = activeSection;
      return;
    }

    const prefixed = parseTocPrefixedSectionChapter(current);
    if(prefixed){
      activeSection = prefixed.section;
      context[idx] = activeSection;
      return;
    }

    if(activeSection && parseTocChapterLikeTitle(current)){
      context[idx] = activeSection;
      return;
    }

    activeSection = null;
  });

  return context;
}

function applyTocSectionFirstPrefixTitles(map, indexes){
  if(!isTocSectionFirstPrefixEnabled()){
    return { map, remove: new Set(), inspector: [] };
  }

  const tocIndexes = indexes || selectedIndexes;
  const result = Object.assign({}, map);
  const remove = new Set();
  const inspector = [];
  let pendingSection = null;
  let pendingSectionIdx = null;
  let activeSection = null;

  tocIndexes.forEach(idx => {
    const current = result[idx];
    if(!current) return;

    const standalone = parseTocStandaloneSection(current);
    if(standalone){
      pendingSection = standalone;
      pendingSectionIdx = idx;
      activeSection = null;
      return;
    }

    const prefixed = parseTocPrefixedSectionChapter(current);
    if(prefixed){
      if(activeSection && normalizeTocSeriesKey(activeSection) === normalizeTocSeriesKey(prefixed.section)){
        result[idx] = prefixed.rest;
        inspector.push({ removed: idx, kept: idx, canonical: prefixed.section, removedTitle: current, keptTitle: result[idx], reason: "section-repeat-prefix" });
      }else{
        result[idx] = current;
        activeSection = prefixed.section;
      }
      pendingSection = null;
      pendingSectionIdx = null;
      return;
    }

    if(pendingSection && parseTocChapterLikeTitle(current)){
      if(!tocTitleStartsWithSection(current, pendingSection)){
        result[idx] = `${pendingSection} ${current}`;
        inspector.push({ removed: null, kept: idx, canonical: pendingSection, removedTitle: current, keptTitle: result[idx], reason: "section-first-prefix" });
      }
      remove.add(pendingSectionIdx);
      inspector.push({ removed: pendingSectionIdx, kept: idx, canonical: pendingSection, removedTitle: result[pendingSectionIdx], keptTitle: result[idx], reason: "section-standalone" });
      activeSection = pendingSection;
      pendingSection = null;
      pendingSectionIdx = null;
      return;
    }

    // A non-chapter title must not consume a pending section. This preserves
    // cases such as "외전" followed by "작가의 말".
    pendingSection = null;
    pendingSectionIdx = null;
    activeSection = null;
  });

  remove.forEach(idx => delete result[idx]);
  return { map: result, remove, inspector };
}

function isTocCanonicalDuplicateRemovalEnabled(){
  const config = (typeof window !== "undefined" && window.BookieConfig) ? window.BookieConfig : null;
  return !(config && config.toc && config.toc.canonicalDuplicateRemoval === false);
}

function isTocInspectorDebugEnabled(){
  const config = (typeof window !== "undefined" && window.BookieConfig) ? window.BookieConfig : null;
  return !!(config && config.toc && config.toc.debugInspector);
}

function normalizeTocNumberToken(num){
  const n = String(num || "").replace(/^0+(?=\d)/, "");
  return n || "0";
}

function canonicalizeTocTitle(title){
  let text = stripChapterWrappers(title || "").trim();
  if(!text) return "";

  text = text
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\u2060\u2063\uFEFF]/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/^#\s*/, "")
    .replace(/[（]/g, "(")
    .replace(/[）]/g, ")")
    .replace(/[［]/g, "[")
    .replace(/[］]/g, "]")
    .replace(/[．。]/g, ".")
    .replace(/[：]/g, ":")
    .replace(/[、]/g, ".")
    .toLowerCase();

  text = text.replace(/\d+/g, normalizeTocNumberToken);
  text = text.replace(/[\s.#:：.\-—–_＊*]+/g, "");
  return text;
}

function getTocRepeatedTitleMap(indexes){
  const tocIndexes = indexes || selectedIndexes;
  const map = {};

  tocIndexes.forEach(idx => {
    map[idx] = getTocBaseTitleAt(idx);
  });

  return applyTocRepeatSeriesTitles(map, map, tocIndexes);
}

function getTocRawTitleMap(indexes){
  const tocIndexes = indexes || selectedIndexes;
  const repeated = getTocRepeatedTitleMap(tocIndexes);
  const sectioned = applyTocSectionFirstPrefixTitles(repeated, tocIndexes).map;

  if(typeof window !== "undefined" && window.BookieTocTitleOverrides){
    tocIndexes.forEach(idx => {
      if(Object.prototype.hasOwnProperty.call(window.BookieTocTitleOverrides, idx)){
        sectioned[idx] = window.BookieTocTitleOverrides[idx];
      }
    });
  }

  return sectioned;
}

function getTocLegacyTitleMap(indexes){
  const tocIndexes = indexes || selectedIndexes;
  const baseByIndex = {};

  tocIndexes.forEach(idx=>{
    const base = getTocBaseTitleAt(idx);
    baseByIndex[idx] = base;
  });

  let map = {};

  tocIndexes.forEach(idx=>{
    map[idx] = baseByIndex[idx];
  });

  const repeated = applyTocRepeatSeriesTitles(map, baseByIndex, tocIndexes);
  return applyTocSectionFirstPrefixTitles(repeated, tocIndexes).map;
}

function getTocRepresentativeScore(idx){
  const profile = createTocProfile(idx);
  let score = profile.score || 0;
  const confidence = tocConfidence[idx];
  if(confidence === "sure") score += 3;
  if(confidence === "maybe") score += 1;
  if(confidence === "manual") score += 2;
  return score;
}

function getTocTitleQuality(title){
  const text = stripChapterWrappers(title || "").trim();
  if(!text) return -100;

  let score = 0;
  if(/^#\s*/.test(text)) score += 1;
  if(/^#?\s*\d{1,5}\s*(?:화|회|편|장|부|권)\s+\S+/.test(text)) score += 8;
  if(/^#?\s*\d{1,5}\s*[.．、:：]\s*\S+/.test(text)) score += 8;
  if(/^제\s*\d{1,5}\s*(?:화|장|회|부|권)\s+\S+/.test(text)) score += 8;
  if(/^(chapter|ch|episode|ep|part|vol\.?|volume)\s*[.#:-]?\s*\d{1,5}\s+\S+/i.test(text)) score += 8;
  if(/^(프롤로그|prologue|에필로그|epilogue|외전|번외|서장|종장|막간|인터루드|interlude|후기|작가의 말|if)\s*\S*/i.test(text)) score += 6;

  if(/^#?\s*\d{1,5}\s*(?:[.．、:：]|화|회|편|장|부|권)?\s*$/.test(text)) score -= 10;
  if(/^제\s*\d{1,5}\s*(?:화|장|회|부|권)\s*$/.test(text)) score -= 8;
  if(/\s{2,}/.test(text)) score -= 1;
  if(text.length > 60) score -= 5;

  // Prefer readable punctuation/spacing when canonical keys are the same:
  // "01. 입단" beats "01 입단" and "01.입단".
  if(/^#?\s*\d{1,5}\s*[.．、:：]\s+\S+/.test(text)) score += 4;
  if(/^#?\s*\d{1,5}\s*(화|회|편|장|부|권)\s+\S+/.test(text)) score += 4;
  if(/^제\s*\d{1,5}\s*(화|장|회|부|권|話|章|回|部|卷)\s+\S+/.test(text)) score += 4;
  if(text.length >= 4 && text.length <= 35) score += 2;

  return score;
}

function getTocRepresentativeRank(item){
  return (Number(item.score) || 0) * 10 + getTocTitleQuality(item.title) - (Number(item.order) || 0) * 0.001;
}

function makeTocInspectorEntry(item, keep, key, reason){
  return {
    removed: item.idx,
    kept: keep.idx,
    canonical: key,
    removedTitle: item.title,
    keptTitle: keep.title,
    removedScore: item.score,
    keptScore: keep.score,
    removedQuality: getTocTitleQuality(item.title),
    keptQuality: getTocTitleQuality(keep.title),
    reason
  };
}

function getTocInspectorSummary(limit){
  if(typeof window === "undefined" || !window.BookieTocInspector) return "";
  const max = Math.max(1, Number(limit) || 50);
  return window.BookieTocInspector.slice(0, max).map(item => {
    return `✗ ${item.removedTitle} → ✓ ${item.keptTitle} (${item.reason})`;
  }).join("\n");
}

function normalizeTocSelection(){
  if(!selectedIndexes || selectedIndexes.length < 2) return false;

  let ordered = selectedIndexes.slice();
  let titleMap = getTocRepeatedTitleMap(ordered);
  const sectionContext = getTocSectionContextMap(titleMap, ordered);
  const sectionApplied = applyTocSectionFirstPrefixTitles(titleMap, ordered);
  let sectionInspector = sectionApplied.inspector || [];
  if(typeof window !== "undefined"){
    window.BookieTocTitleOverrides = sectionApplied.map || {};
  }
  let sectionChanged = false;

  if(sectionApplied.remove && sectionApplied.remove.size){
    selectedIndexes = ordered.filter(idx => !sectionApplied.remove.has(idx));
    sectionApplied.remove.forEach(idx => delete tocConfidence[idx]);
    ordered = selectedIndexes.slice();
    titleMap = getTocRawTitleMap(ordered);
    sectionChanged = true;
  }

  if(!isTocCanonicalDuplicateRemovalEnabled()){
    if(typeof window !== "undefined" && sectionInspector.length){
      window.BookieTocInspector = sectionInspector;
      window.BookieTocInspectorSummary = getTocInspectorSummary;
    }
    return sectionChanged;
  }

  const groups = {};

  ordered.forEach((idx, order) => {
    let key = canonicalizeTocTitle(titleMap[idx] || lines[idx] || "");
    if(!key) return;
    if(sectionContext[idx]) key += "::section:" + normalizeTocSeriesKey(sectionContext[idx]);
    if(!groups[key]) groups[key] = [];
    groups[key].push({ idx, order, title: titleMap[idx], score: getTocRepresentativeScore(idx) });
  });

  const remove = new Set();
  const inspector = sectionInspector.slice();

  Object.keys(groups).forEach(key => {
    const group = groups[key];
    if(group.length < 2) return;

    let keep = group[0];
    const exactSameTitle = group.every(item => String(item.title || "") === String(group[0].title || ""));

    if(!exactSameTitle){
      let keepRank = getTocRepresentativeRank(keep);
      for(const item of group){
        const rank = getTocRepresentativeRank(item);
        if(rank > keepRank){
          keep = item;
          keepRank = rank;
        }
      }
    }

    group.forEach(item => {
      if(item.idx !== keep.idx){
        remove.add(item.idx);
        inspector.push(makeTocInspectorEntry(item, keep, key, "canonical-duplicate"));
      }
    });
  });

  if(!remove.size){
    if(sectionChanged && typeof window !== "undefined"){
      window.BookieTocInspector = inspector;
      window.BookieTocInspectorSummary = getTocInspectorSummary;
    }
    return sectionChanged;
  }

  selectedIndexes = ordered.filter(idx => !remove.has(idx));
  remove.forEach(idx => delete tocConfidence[idx]);

  if(typeof window !== "undefined"){
    window.BookieTocInspector = inspector;
    window.BookieTocInspectorSummary = getTocInspectorSummary;
  }

  if(typeof log === "function"){
    log("TOC 중복 제거: " + remove.size + "개");
    if(isTocInspectorDebugEnabled() && inspector.length){
      log("TOC Inspector:\n" + getTocInspectorSummary(30));
    }
  }

  return true;
}

function getTocTitles(){
  if(!isTocCanonicalDuplicateRemovalEnabled()){
    return getTocLegacyTitleMap(selectedIndexes);
  }
  return getTocRawTitleMap(selectedIndexes);
}

if(typeof window !== "undefined"){
  window.BookieTocInspectorSummary = getTocInspectorSummary;
}
