// Bookie 3.2.1 - app.js
// Core text cleanup helpers and HTML conversion functions.
// Main processing entry is delegated to BookieEngine.process().

let detectedParagraphGap = 2;

function normalizeParagraphGapValue(value){
  const number = Number(value);
  return Number.isFinite(number) && number >= 2 ? Math.floor(number) : 2;
}

// ========================
// Paragraph Gap Detection
// - Detects the dominant paragraph gap before conversion.
// - Used by blank-line and paragraph HTML conversion logic.
// ========================
function detectParagraphStyle(text){
  const sample = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\u2060\u2063\uFEFF]/g, "")
    .split("\n")
    .slice(0, 500)
    .join("\n")
    .replace(/^[^\S\n]+$/gm, "")
    .replace(/^\n+|\n+$/g, "");

  const counts = new Map();

  // Count exact newline runs. The most frequently repeated run is the normal
  // paragraph pattern; longer, less frequent runs are intentional spacing.
  const runs = sample.match(/\n{2,}/g) || [];
  for(const run of runs){
    counts.set(run.length, (counts.get(run.length) || 0) + 1);
  }

  const ranked = Array.from(counts.entries())
    .sort((a, b)=>b[1] - a[1] || a[0] - b[0]);

  detectedParagraphGap = ranked.length ? ranked[0][0] : 2;
  return detectedParagraphGap;
}

// ========================
// Blankline Cleaner
// - Normalizes line endings and safe whitespace.
// - Keeps the existing Stable blank-line behavior unchanged.
// ========================
function cleanBlankLines(text){
  const spaceClean = !!(document.getElementById("checkSpaceClean") && document.getElementById("checkSpaceClean").checked);

  if(typeof BookieBlanklineEngine !== "undefined"){
    return BookieBlanklineEngine.clean(text, {
      paragraphGap: detectedParagraphGap,
      spaceClean
    }).html;
  }

  // Fallback for legacy loading order. Output must match Bookie 3.3 Stable behavior.
  text = text.replace(/\r\n/g,"\n").replace(/\r/g,"\n");
  text = text
    .replace(/\u00A0/g," ")
    .replace(/[\u200B-\u200D\u2060\u2063\uFEFF]/g,"");

  if(spaceClean){
    text = text
      .replace(/[ \t]+$/gm,"")
      .replace(/^[ \t]+/gm,"")
      .replace(/[ \t]{2,}/g," ")
      .replace(/\n[ \t]+/g,"\n")
      .replace(/[ \t]+\n/g,"\n")
      .replace(/ +(?=[.!?…"'”’)]*$)/gm,"");
  }

  const paragraphGap = normalizeParagraphGapValue(detectedParagraphGap);
  text = text.replace(/\n{2,}/g, run=>{
    return run.length > paragraphGap ? "\n".repeat(paragraphGap + 1) : run;
  });

  return text.trim();
}

// ========================
// Dialogue Cleaner
// - Optional legacy checkbox behavior.
// - Not expanded in Bookie 3.1 refactoring.
// ========================
function dialogueClean(text){
  if(!(document.getElementById("checkDialogue") && document.getElementById("checkDialogue").checked)) return text;

  const separator = "\n".repeat(normalizeParagraphGapValue(detectedParagraphGap));

  return text
    // "대사." "대사." 형태 분리
    .replace(/([”"])(\s+)([“"])/g, `$1${separator}$3`)
    // 닫는 따옴표 뒤 바로 다음 여는 따옴표
    .replace(/([”"])([“"])/g, `$1${separator}$2`)
    // 문장 끝 따옴표 뒤 대문자/한글 대사 시작이 붙는 경우 완화
    .replace(/([.!?…][”"])(\s*)([“"])/g, `$1${separator}$3`);
}

// ========================
// Footnote Processing
// - Existing Stable footnote behavior.
// - Structure improvement is reserved for Bookie 3.2 Foundation.
// ========================
function processFootnotes(text){

  if(!(document.getElementById("enableFootnotes") &&
       document.getElementById("enableFootnotes").checked)){
    return {
      body:text,
      notesHtml:""
    };
  }

  const lines = text.split("\n");

  const notes = [];
  const kept = [];

  for(const rawLine of lines){

    const line = rawLine.trim();

    // Remove standalone footnote section labels from chapter body.
    if(/^(?:<p[^>]*>\s*)?각주\s*(?:<\/p>)?$/i.test(line)){
      continue;
    }

    if(/^\d+\)\s+/.test(line)){

      footnoteCounter++;

      const noteObj = {
        no: footnoteCounter,
        text: line.replace(/^\d+\)\s*/,"").trim(),
        refHref: ""
      };

      notes.push(noteObj);
      footnoteList.push(noteObj);

      continue;
    }

    kept.push(rawLine);
  }

  let body = kept.join("\n");

  // 남은 각주 설명 줄 최종 제거
  body = body.replace(/^\s*\d+\)\s+.+$/gm, "");

  const noteCopies = [...notes];

  body = body.replace(/\d+\)/g, function(match){

    if(!noteCopies.length){
      return match;
    }

    const note = noteCopies.shift();

    return `<a href="footnotes.xhtml#fn${note.no}"
              id="ref${note.no}"
              epub:type="noteref" style="color:#4a7dff;text-decoration:none;">${note.no})</a>`;
  });

  // Bookie 3.5.1 Footnote v2:
  // Do not append hidden inline <aside> blocks under the chapter body.
  // The noteref link points to the collected end-notes page instead.
  return {
    body,
    notesHtml: ""
  };
}

// ========================
// Paragraph Cleaner
// - Converts cleaned text line breaks into EPUB paragraph HTML.
// - Keeps the existing Stable paragraph behavior unchanged.
// ========================
function buildParagraphHtml(raw){

  if(typeof BookieParagraphEngine !== "undefined"){
    return BookieParagraphEngine.build(raw, {
      paragraphGap: detectedParagraphGap,
      escapeFn: esc
    }).html;
  }

  // Fallback for legacy loading order. Output must match Bookie 3.4.1 Stable behavior.

  // 특수문자 단독 줄은 독립 문단 유지
  raw = raw.replace(
    /\n([@\]#※▶▷◆■□★☆]+)\n/g,
    '\n\n$1\n\n'
  );

  // *** 전용 토큰
  raw = raw.replace(
    /(^|\n)(\*\s*\*\s*\*|\*\*\*)(\n|$)/g,
    '\n[[STAR_BREAK]]\n'
  );

  // 각주 링크 임시 보호
  const protectedLinks = [];

  raw = raw.replace(
    /<a\b[^>]*(?:epub:type=["']noteref["']|href=["'](?:footnotes\.xhtml)?#fn\d+["'])[^>]*>[\s\S]*?<\/a>/g,
    function(m){
      const key = `[[FOOTNOTE_LINK_${protectedLinks.length}]]`;
      protectedLinks.push(m);
      return key;
    }
  );

  let t = esc(raw);

  // 보호했던 각주 링크 복원
  protectedLinks.forEach((link, i)=>{
    t = t.replace(`[[FOOTNOTE_LINK_${i}]]`, link);
  });

  const paragraphGap = normalizeParagraphGapValue(detectedParagraphGap);
  t = t.replace(/\n{2,}/g, run=>{
    return run.length > paragraphGap
      ? '</p><p class="txt"><br/></p><p>'
      : '</p><p>';
  });

  // 일반 줄바꿈 1개는 그냥 이어쓰기
  t = t.replace(/\n/g," ");

  // *** 치환
  t = t.replace(
    /\[\[STAR_BREAK\]\]/g,
    '</p><p style="text-align: center;">* * *</p><p>'
  );

  // 문단 꼬임 정리
  t = t
    .replace(/<p><\/p>/g,'')
    .replace(/<p>\s*<p>/g,'<p>')
    .replace(/<\/p>\s*<\/p>/g,'</p>')
    // *** 앞뒤 br 제거
    .replace(/<br\/><\/p><p><br\/><\/p><p style="text-align: center;">/g,'</p><p class="txt"><br/></p><p style="text-align: center;">')
    .replace(/<p><br\/><\/p><br\/><p>/g,'<p class="txt"><br/></p><p>');

  return `<p>${t}</p>`;
}

// ========================
// Text Part Entry
// - Delegates the main processing order to BookieEngine.
// - Keeps Stable output unchanged.
// ========================
function textPartToHtml(text){
  return BookieEngine.process(text);
}
