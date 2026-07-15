// Bookie Step 6 - TOC UI and selection controls
function regexText(r){
  let s=r.toString();
  return s.slice(1,s.lastIndexOf("/"));
}

function selectPattern(i){

  // 이미 선택된 줄이면 선택 취소
  if(selectedIndexes.includes(i)){

    selectedIndexes = selectedIndexes.filter(v => v !== i);

    const el = document.querySelector(`.line[data-i="${i}"]`);

    if(el){
      el.classList.remove("selected","chapter");
    }

    updateCount();
    renderToc();

    return;
  }

  const line=lines[i].trim();
  if(!line)return;

  const r=normalizePattern(line);
  tocConfidence[i] = "manual";
  document.getElementById("chapterPattern").value=regexText(r);

  selectByRegex(r);

  document.getElementById("tocPanel").classList.remove("closed");
  document.getElementById("tocArrow").textContent="▾";
}

function selectByRegex(r){

  const current = new Set(selectedIndexes);

  for(let i=0;i<lines.length;i++){
    if(r.test(lines[i].trim())){
      current.add(i);
      if(!tocConfidence[i]) tocConfidence[i] = "manual";
    }
  }

  selectedIndexes = [...current].sort((a,b)=>a-b);

  const set=new Set(selectedIndexes);

  document.querySelectorAll(".line").forEach(el=>{
    const i=Number(el.dataset.i);
    const ok=set.has(i);

    el.classList.toggle("selected",ok);
    el.classList.toggle("chapter",ok);
  });

  updateCount();
  renderToc();
}

function looksLikeExplicitRegex(value){
  return (
    value.startsWith("^") ||
    value.endsWith("$") ||
    /\\[dDsSwWbB]/.test(value) ||
    /[\[\]{}()|]/.test(value) ||
    /(^|[^\\])\.\*/.test(value) ||
    /(^|[^\\])[+?]/.test(value)
  );
}

function tocHanjaNumbersEnabled(){
  const checkbox = (typeof document !== "undefined")
    ? document.getElementById("includeHanjaToc")
    : null;
  return !!(checkbox && checkbox.checked);
}

function bookieChapterNumSource(){
  return tocHanjaNumbersEnabled()
    ? "(?:\\d{1,5}|[〇零一二三四五六七八九十百千萬万兩两壹貳贰參叁肆伍陸陆柒捌玖拾佰仟]+)"
    : "(?:\\d{1,5})";
}

function escapeRegexText(value){
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
}

function quoteShortcutSearchSource(value){
  const query=String(value || "").trim();
  if(query==='"') return '(?:"|“)';
  if(query==="'") return "(?:'|‘)";
  if(query==='""') return '(?:"[^"\\r\\n]*"|“[^”\\r\\n]*”)';
  if(query==="''") return "(?:'[^'\\r\\n]*'|‘[^’\\r\\n]*’)";
  return "";
}

function buildGeneralChapterSearchRegex(text){
  const numberToken = tocHanjaNumbersEnabled()
    ? /\d{1,5}|[〇零一二三四五六七八九十百千萬万兩两壹貳贰參叁肆伍陸陆柒捌玖拾佰仟]+/g
    : /\d{1,5}/g;
  const numberSource = bookieChapterNumSource();
  let source = "^\\s*";
  let last = 0;
  let match;

  while((match = numberToken.exec(text))){
    const before = text.slice(last, match.index);
    source += escapeRegexText(before).replace(/\\\s+/g,"\\s*");
    source += numberSource;
    last = match.index + match[0].length;
  }

  source += escapeRegexText(text.slice(last)).replace(/\\\s+/g,"\\s*");
  source += "\\s*$";
  return new RegExp(source,"i");
}

function resolveChapterSearchPattern(value){
  const text = String(value || "").trim();
  if(!text) return null;

  const quoteSource=quoteShortcutSearchSource(text);
  if(quoteSource){
    const regex=new RegExp("^\\s*"+quoteSource,"u");
    return {regex,source:regexText(regex)};
  }

  // 정규식을 직접 입력한 경우에는 기존 동작을 그대로 유지한다.
  if(looksLikeExplicitRegex(text)){
    return { regex: new RegExp(text), source: text };
  }

  const generalSearch = !!document.getElementById("chapterGeneralSearch")?.checked;

  // 일반 검색에서도 숫자(아라비아/한자)는 항상 숫자 패턴으로 바꾼다.
  if(generalSearch){
    const regex = buildGeneralChapterSearchRegex(text);
    return { regex, source: regexText(regex) };
  }

  // 기본은 제목 글자를 버리고 앞/뒤의 번호 형식만 추출하는 패턴 검색이다.
  const regex = normalizePattern(text);
  return { regex, source: regexText(regex) };
}

function applyPattern(){

  const input=document.getElementById("chapterPattern");
  const v=input.value.trim();

  if(!v)return;

  try{

    const resolved = resolveChapterSearchPattern(v);
    if(!resolved) return;

    selectByRegex(resolved.regex);

    const patternSource = resolved.source;

    if(!appliedPatterns.includes(patternSource)){
      appliedPatterns.push(patternSource);
    }

    renderPatternTags();

    document.getElementById("tocPanel")
      .classList.remove("closed");

    document.getElementById("tocArrow")
      .textContent="▾";

    input.value = "";
    input.blur();

  }catch(e){
    alert("정규식 오류!");
  }
}

function removePatternTag(pattern){

  appliedPatterns = appliedPatterns.filter(v => v !== pattern);

  selectedIndexes = [];

  for(const p of appliedPatterns){
    try{
      selectByRegex(new RegExp(p));
    }catch(e){}
  }

  if(!appliedPatterns.length){
    clearSelection();
  }

  renderPatternTags();
}

function renderPatternTags(){

  const box = document.getElementById("patternTags");

  if(!appliedPatterns.length){
    box.innerHTML = "";
    return;
  }

  let html = "";

  appliedPatterns.forEach((p, idx)=>{

    html += `
      <div style="
        display:flex;
        align-items:center;
        gap:8px;
        background:#eaf5ff;
        color:#3f6fb3;
        border-radius:999px;
        padding:6px 10px;
        font-size:13px;
        font-weight:700;
        margin-bottom:8px;
        width:fit-content;
        max-width:100%;
      ">

        <span style="
          word-break:break-all;
        ">${esc(p)}</span>

        <button
          type="button"
          data-idx="${idx}"
          class="removePatternBtn"
          style="
            border:none;
            background:none;
            color:#f07b9c;
            font-size:18px;
            font-weight:900;
            cursor:pointer;
            padding:0 2px;
            line-height:1;
            flex-shrink:0;
          "
        >✕</button>

      </div>
    `;
  });

  box.innerHTML = html;

  box.querySelectorAll(".removePatternBtn").forEach(btn=>{

    btn.addEventListener("click", function(){

      const idx = Number(this.dataset.idx);

      removePatternByIndex(idx);

    });

  });
}

function removePatternByIndex(idx){

  appliedPatterns.splice(idx,1);

  selectedIndexes = [];

  document.querySelectorAll(".line").forEach(el=>{
    el.classList.remove("selected","chapter");
  });

  for(const p of appliedPatterns){

    try{
      selectByRegex(new RegExp(p));
    }catch(e){}

  }

  // 미리보기 선택 상태 전체 동기화
  const set = new Set(selectedIndexes);

  document.querySelectorAll(".line").forEach(el=>{

    const i = Number(el.dataset.i);
    const ok = set.has(i);

    el.classList.toggle("selected", ok);
    el.classList.toggle("chapter", ok);

  });

  updateCount();
  renderToc();
  renderPatternTags();
}

function clearSelection(){
  selectedIndexes=[];
  tocConfidence={};
  document.querySelectorAll(".line").forEach(el=>el.classList.remove("selected","chapter"));
  document.getElementById("tocPreview").innerHTML="";
  updateCount();
}

function removeTocIndex(lineIndex){
  selectedIndexes = selectedIndexes.filter(v => v !== lineIndex);
  delete tocConfidence[lineIndex];

  document.querySelectorAll(".line").forEach(el=>{
    const i=Number(el.dataset.i);
    if(i === lineIndex){
      el.classList.remove("selected","chapter");
    }
  });

  updateCount();
  renderToc();
}


function moveTocItem(index, dir){
  const newIndex = index + dir;

  if(newIndex < 0 || newIndex >= selectedIndexes.length){
    return;
  }

  const temp = selectedIndexes[index];
  selectedIndexes[index] = selectedIndexes[newIndex];
  selectedIndexes[newIndex] = temp;

  renderToc();
}

function updateTocText(lineIndex, value){
  lines[lineIndex] = value;
}

function tocBadgeHtml(lineIndex){
  const c = tocConfidence[lineIndex] || "manual";
  const text = c === "sure" ? "확실" : (c === "maybe" ? "의심" : "수동");
  const color = c === "sure" ? "#3f9b6b" : (c === "maybe" ? "#f0a33a" : "#7eb6ff");
  return `<span style="display:inline-block;min-width:32px;text-align:center;padding:3px 6px;border-radius:999px;background:#fff;border:1px solid ${color};color:${color};font-size:11px;font-weight:800;">${text}</span>`;
}

function renderToc(){
  if(typeof normalizeTocSelection === "function") normalizeTocSelection();
  const box=document.getElementById("tocPreview");

  if(!lines.length){
    box.innerHTML="TXT를 먼저 넣어주세요!";
    return;
  }

  if(!selectedIndexes.length){
    box.innerHTML="앞부분에서 챕터 줄을 선택해주세요!";
    return;
  }

  const html=[];
  const titleMap = getTocTitles();
  const sureCount = selectedIndexes.filter(idx => tocConfidence[idx] === "sure").length;
  const maybeCount = selectedIndexes.filter(idx => tocConfidence[idx] === "maybe").length;
  const manualCount = selectedIndexes.length - sureCount - maybeCount;
  const limit=Math.min(selectedIndexes.length,500);

  for(let i=0;i<limit;i++){

    const idx=selectedIndexes[i];

    html.push(`
      <div class="tocItem"
           draggable="true"
           data-order="${i}"
           ondragstart="dragStart(event)"
           ondragover="dragOver(event)"
           ondrop="dropItem(event)">

        <span style="
          min-width:24px;
          text-align:center;
          color:#7eb6ff;
          font-weight:700;
          user-select:none;
        ">
          ${i+1}
        </span>

        ${tocBadgeHtml(idx)}

        <input
          class="tocEdit"
          value="${typeof escAttr === "function" ? escAttr(titleMap[idx] || lines[idx].trim()) : esc(titleMap[idx] || lines[idx].trim())}"
          onchange="updateTocText(${idx}, this.value)"
        >

        <button class="moveBtn"
          onclick="moveTocItem(${i}, -1)">↑</button>

        <button class="moveBtn"
          onclick="moveTocItem(${i}, 1)">↓</button>

        <button class="removeToc"
          onclick="removeTocIndex(${idx})">제외</button>
      </div>
    `);
  }

  box.innerHTML=html.join("");
}

let dragIndex = null;

function dragStart(e){
  dragIndex = Number(
    e.currentTarget.dataset.order
  );
}

function dragOver(e){
  e.preventDefault();
}

function dropItem(e){
  e.preventDefault();

  const targetIndex = Number(
    e.currentTarget.dataset.order
  );

  if(dragIndex === null) return;
  if(dragIndex === targetIndex) return;

  const moved = selectedIndexes.splice(dragIndex,1)[0];

  selectedIndexes.splice(targetIndex,0,moved);

  dragIndex = null;

  renderToc();
}
