// Bookie Step 8 - UI helpers
function log(t){
  const l=document.getElementById("log");
  if(!l) return;
  l.textContent += t + "\n";
  l.scrollTop = 999999;
}


function createRunningTiro(){
  const runner=document.createElement("div");
  runner.className="runningTiroSprite";
  runner.setAttribute("aria-hidden","true");
  return runner;
}

function setProgress(done,total,msg){
  const box=document.getElementById("progressBox");
  if(!box) return;
  box.style.display="flex";
  const pct=total ? Math.floor((done/total)*100) : 0;
  const safePct=Math.max(0,Math.min(100,pct));

  let track=box.querySelector(".tiroProgressTrack");
  let fill=box.querySelector(".tiroProgressFill");
  let percent=box.querySelector(".tiroProgressPercent");
  let statusLine=box.querySelector(".progressStatusText");

  if(!box.classList.contains("progressWorking")||!track||!fill||!percent||!statusLine){
    box.className="progressBox progressWorking";
    box.replaceChildren();

    const runner=createRunningTiro();
    const content=document.createElement("div");
    content.className="progressContent";

    track=document.createElement("div");
    track.className="tiroProgressTrack";
    track.setAttribute("role","progressbar");
    track.setAttribute("aria-valuemin","0");
    track.setAttribute("aria-valuemax","100");

    fill=document.createElement("div");
    fill.className="tiroProgressFill";

    percent=document.createElement("span");
    percent.className="tiroProgressPercent";

    track.append(fill,runner,percent);

    statusLine=document.createElement("div");
    statusLine.className="progressStatusText";

    content.append(track,statusLine);
    box.append(content);
  }

  track.setAttribute("aria-valuenow",String(safePct));
  track.setAttribute("aria-label",msg||"EPUB 생성 진행률");
  track.style.setProperty("--progress",String(safePct));
  fill.style.width=`${safePct}%`;
  percent.textContent=`${safePct}%`;
  statusLine.textContent=`${done} / ${total} ${msg||"처리 중..."}`;
}

function finishProgress(){
  const box=document.getElementById("progressBox");
  if(!box) return;
  box.style.display="flex";
  box.className="progressBox progressComplete";
  box.replaceChildren();

  const tiro=document.createElement("img");
  tiro.className="progressTiro";
  tiro.src="assets/tiro/heart.png";
  tiro.alt="하트를 안고 있는 티로";

  const content=document.createElement("div");
  content.className="progressContent";

  const title=document.createElement("div");
  title.className="progressCompleteTitle";
  title.textContent="책이 완성됐어요!";

  const completeTrack=document.createElement("div");
  completeTrack.className="tiroProgressTrack tiroProgressDone";
  completeTrack.setAttribute("role","progressbar");
  completeTrack.setAttribute("aria-valuemin","0");
  completeTrack.setAttribute("aria-valuemax","100");
  completeTrack.setAttribute("aria-valuenow","100");

  const completeFill=document.createElement("div");
  completeFill.className="tiroProgressFill";
  completeFill.style.width="100%";

  const completePercent=document.createElement("span");
  completePercent.className="tiroProgressPercent";
  completePercent.textContent="100%";

  completeTrack.append(completeFill,completePercent);
  content.append(title,completeTrack);
  box.append(tiro,content);
}

function clearProgress(){
  const box=document.getElementById("progressBox");
  if(!box) return;
  box.textContent="";
  box.style.display="none";
}

function clearLog(){
  const l=document.getElementById("log");
  if(l) l.textContent="";
}

function togglePanel(id){
  const p=document.getElementById(id);
  if(!p) return;
  p.classList.toggle("closed");
  const arrow=document.getElementById(id==="frontPanel"?"frontArrow":"tocArrow");
  if(arrow) arrow.textContent=p.classList.contains("closed")?"▸":"▾";
  if(id==="tocPanel"&&!p.classList.contains("closed")&&typeof renderToc === "function") renderToc();
}

function closePanel(id){
  const p=document.getElementById(id);
  if(p) p.classList.add("closed");
  const arrow=document.getElementById(id==="frontPanel"?"frontArrow":"tocArrow");
  if(arrow) arrow.textContent="▸";
}

function openPanel(id){
  const p=document.getElementById(id);
  if(p) p.classList.remove("closed");
  const arrow=document.getElementById(id==="frontPanel"?"frontArrow":"tocArrow");
  if(arrow) arrow.textContent="▾";
}

function updateCount(){
  const b=document.getElementById("countBadge");
  if(!b) return;
  if(!selectedIndexes.length){
    b.style.display="none";
    return;
  }
  b.style.display="inline-block";
  b.textContent="선택된 목차 "+selectedIndexes.length+"개";
}


// Bookie 4.0.1 UI — cover double-click preview
(function initCoverLightbox(){
  const preview=document.getElementById("coverPreview");
  const lightbox=document.getElementById("coverLightbox");
  const lightboxImage=document.getElementById("coverLightboxImage");
  const closeButton=document.getElementById("coverLightboxClose");
  if(!preview || !lightbox || !lightboxImage || !closeButton) return;

  function openCoverLightbox(){
    const src=preview.getAttribute("src");
    if(!src) return;
    lightboxImage.src=src;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("coverLightboxOpen");
    closeButton.focus();
  }

  function closeCoverLightbox(){
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("coverLightboxOpen");
    lightboxImage.removeAttribute("src");
  }

  preview.addEventListener("dblclick", openCoverLightbox);
  closeButton.addEventListener("click", closeCoverLightbox);
  lightbox.addEventListener("click", event=>{
    if(event.target===lightbox) closeCoverLightbox();
  });
  document.addEventListener("keydown", event=>{
    if(event.key==="Escape" && lightbox.classList.contains("open")){
      closeCoverLightbox();
    }
  });
})();

function updateGameModeControls(){
  if(typeof BookieGameModeSettings!=="undefined"){
    BookieGameModeSettings.updateControls();
  }
}

document.addEventListener("DOMContentLoaded",()=>{
  if(typeof BookieGameModeSettings!=="undefined") BookieGameModeSettings.init();
  else updateGameModeControls();
});

// Bookie 4.0.7 UI — run chapter search with Enter
(function initChapterPatternEnterSearch(){
  const input=document.getElementById("chapterPattern");
  if(!input) return;

  input.addEventListener("keydown", event=>{
    if(event.key!=="Enter" || event.isComposing) return;
    event.preventDefault();
    if(typeof applyPattern==="function") applyPattern();
  });
})();


// Bookie 4.0.22 — irregular blink/wink mix; heart pops only on wink.
(function initHeaderTiroBuddy(){
  const buddy=document.getElementById("headerTiroBuddy");
  if(!buddy)return;

  const reduceMotion=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let blinkTimer=0;
  let blinkSequenceTimer=0;
  let heartTimer=0;
  let hovering=false;
  let lastMotion="";

  const motionClasses=["is-blinking","is-winking-left","is-winking-right","is-wink-heart"];

  function clearMotionClasses(){
    buddy.classList.remove(...motionClasses);
  }

  function clearBlinkTimers(){
    window.clearTimeout(blinkTimer);
    window.clearTimeout(blinkSequenceTimer);
    window.clearTimeout(heartTimer);
  }

  function popWinkHeart(){
    buddy.classList.remove("is-wink-heart");
    void buddy.offsetWidth;
    buddy.classList.add("is-wink-heart");
    heartTimer=window.setTimeout(()=>buddy.classList.remove("is-wink-heart"),720);
  }

  function blinkOnce(after){
    if(hovering)return;
    clearMotionClasses();
    buddy.classList.add("is-blinking");
    blinkSequenceTimer=window.setTimeout(()=>{
      buddy.classList.remove("is-blinking");
      if(typeof after==="function")after();
    },105);
  }

  function winkOnce(side,after){
    if(hovering)return;
    clearMotionClasses();
    buddy.classList.add(side==="left" ? "is-winking-left" : "is-winking-right");
    popWinkHeart();
    blinkSequenceTimer=window.setTimeout(()=>{
      buddy.classList.remove("is-winking-left","is-winking-right");
      if(typeof after==="function")after();
    },145);
  }

  function chooseMotion(){
    const roll=Math.random();
    if(roll<0.52)return "single";
    if(roll<0.66 && lastMotion!=="double")return "double";
    return Math.random()<0.5 ? "wink-left" : "wink-right";
  }

  function runRandomMotion(){
    const motion=chooseMotion();
    lastMotion=motion;

    if(motion==="double"){
      blinkOnce(()=>{
        blinkSequenceTimer=window.setTimeout(()=>blinkOnce(scheduleBlink),115+Math.random()*85);
      });
      return;
    }

    if(motion==="wink-left" || motion==="wink-right"){
      winkOnce(motion.endsWith("left") ? "left" : "right",scheduleBlink);
      return;
    }

    blinkOnce(scheduleBlink);
  }

  function scheduleBlink(first=false){
    if(reduceMotion)return;
    window.clearTimeout(blinkTimer);
    const delay=first ? 650 : 1800+Math.random()*1600;
    blinkTimer=window.setTimeout(runRandomMotion,delay);
  }

  function showHello(){
    hovering=true;
    clearBlinkTimers();
    clearMotionClasses();
    buddy.classList.remove("is-waving");
    void buddy.offsetWidth;
    buddy.classList.add("is-waving");
  }

  function hideHello(){
    hovering=false;
    buddy.classList.remove("is-waving");
    clearMotionClasses();
    scheduleBlink(false);
  }

  buddy.addEventListener("mouseenter",showHello);
  buddy.addEventListener("mouseleave",hideHello);
  buddy.addEventListener("focusin",showHello);
  buddy.addEventListener("focusout",hideHello);
  scheduleBlink(true);
})();

// Bookie 4.0.31 UI — confirm reset with Enter while the Tiro popup is open.
(function initResetConfirmEnter(){
  const backdrop=document.getElementById("resetConfirmBackdrop");
  const confirmButton=document.getElementById("resetConfirmOk");
  if(!backdrop || !confirmButton) return;

  document.addEventListener("keydown", event=>{
    if(event.key!=="Enter" || event.isComposing || event.repeat) return;
    if(!backdrop.classList.contains("is-open")) return;

    event.preventDefault();
    event.stopPropagation();
    confirmButton.click();
  });
})();

// Bookie 4.0.29 UI — numbered-dot TOC support and safe per-file front TOC removal.
(function initNumberedDotTocSupport(){
  function normalizeSourceText(text){
    return String(text || "")
      .replace(/\r\n/g,"\n")
      .replace(/\r/g,"\n")
      .trim();
  }

  function numberedDotValue(line){
    const match=String(line || "").trim().match(/^(\d{1,5})\.\s*(.*)$/);
    if(!match) return null;
    if(match[2].length>60) return null;
    return Number(match[1]);
  }

  function findFrontTocRemovalEnd(text){
    const source=normalizeSourceText(text);
    if(!source) return -1;

    const sourceLines=source.split("\n");
    const tocIndex=sourceLines.findIndex((line,index)=>{
      if(index>=40) return false;
      const key=String(line || "").normalize("NFKC")
        .trim()
        .replace(/[\s|｜│:：<>{}\[\]()〈〉《》「」『』【】*_\-=─━]/g,"")
        .toLowerCase();
      return /^(?:목차|차례|contents?|tableofcontents)$/i.test(key);
    });
    if(tocIndex<1) return -1;

    const hasBookTitle=sourceLines.slice(0,tocIndex).some(line=>line.trim().length>0);
    if(!hasBookTitle) return -1;

    let expected=1;
    let tocEntryCount=0;
    let lastTocMarker=-1;

    for(let i=tocIndex+1;i<sourceLines.length;i++){
      const value=numberedDotValue(sourceLines[i]);
      if(value===null) continue;

      if(value===1 && tocEntryCount>=2 && lastTocMarker>=0){
        return i;
      }

      if(value===expected){
        tocEntryCount++;
        expected++;
        lastTocMarker=i;
        continue;
      }

      if(tocEntryCount>0) return -1;
    }

    return -1;
  }

  function removeFrontTocBlock(text){
    const source=normalizeSourceText(text);
    const removalEnd=findFrontTocRemovalEnd(source);
    if(removalEnd<0) return source;
    return source.split("\n").slice(removalEnd).join("\n").trim();
  }

  function numberedDotChapterIndexes(sourceLines){
    const candidates=[];

    for(let i=0;i<sourceLines.length;i++){
      const trimmed=String(sourceLines[i] || "").trim();
      if(!/^\d{1,5}\.$/.test(trimmed)) continue;

      const value=numberedDotValue(trimmed);
      const previousBlank=i===0 || !String(sourceLines[i-1] || "").trim();

      // `1.`처럼 번호만 한 줄에 단독으로 있는 챕터도 인식한다.
      // 일반 문장 속 번호는 제외하고, 문단 시작에 놓인 단독 번호만 후보로 삼는다.
      if(value!==null && previousBlank){
        candidates.push({index:i,value});
      }
    }

    const accepted=[];
    let run=[];
    for(const candidate of candidates){
      if(!run.length || candidate.value===run[run.length-1].value+1){
        run.push(candidate);
      }else{
        if(run.length>=3) accepted.push(...run);
        run=candidate.value===1 ? [candidate] : [];
      }
    }
    if(run.length>=3) accepted.push(...run);

    return accepted.map(item=>item.index);
  }

  window.BookieNumberedDotToc={
    findFrontTocRemovalEnd,
    removeFrontTocBlock,
    numberedDotChapterIndexes
  };

  window.addEventListener("load",()=>{
    if(typeof autoDetectChapters==="function"){
      const originalAutoDetectChapters=autoDetectChapters;
      autoDetectChapters=function(){
        originalAutoDetectChapters();

        const extra=numberedDotChapterIndexes(lines);
        if(!extra.length) return;

        const current=new Set(selectedIndexes);
        extra.forEach(index=>{
          current.add(index);
          if(!tocConfidence[index]) tocConfidence[index]="sure";
        });
        selectedIndexes=[...current].sort((a,b)=>a-b);

        if(typeof renderToc==="function") renderToc();
        if(typeof updateCount==="function") updateCount();
      };
    }
  });
})();

// Bookie 4.0.32 UI — per-book front preview tabs and line delete buttons.
(function initEditableFrontPreview(){
  const deletedLinesByFile=new Map();
  const editedLinesByFile=new Map();
  let activePreviewFileKey="";
  let previewFiles=[];
  let initialAutoDetectedFileSetKey="";
  const patternAddedRefKeysBySource=new Map();
  const directSelectionRefKeys=new Set();

  // 여러 권을 합칠 때도 목차 제목은 원문 그대로 유지한다.
  // parser.js의 반복 시리즈 보정은 (1), (2)를 전체 목차 순번으로 바꿀 수 있으므로
  // UI 단계에서 명시적으로 비활성화한다.
  function preserveOriginalTocTitles(){
    if(window.BookieConfig && window.BookieConfig.toc){
      window.BookieConfig.toc.normalizeRepeatSeries=false;
      window.BookieConfig.toc.canonicalDuplicateRemoval=false;
    }
  }

  function fileKey(file){
    return [file.name,file.size,file.lastModified].join("::");
  }

  function fileSetKey(files){
    return [...files].map(fileKey).join("||");
  }

  function resetFrontPreviewScroll(){
    const host=document.getElementById("frontPreview");
    if(!host) return;
    host.scrollTop=0;
    host.scrollLeft=0;
  }

  function decodeTextBytes(bytes,encoding,options={}){
    return new TextDecoder(encoding,{fatal:!!options.fatal}).decode(bytes);
  }

  function detectBomEncoding(bytes){
    if(bytes.length>=3 && bytes[0]===0xEF && bytes[1]===0xBB && bytes[2]===0xBF){
      return {encoding:"utf-8",offset:3,label:"UTF-8 BOM"};
    }
    if(bytes.length>=2 && bytes[0]===0xFF && bytes[1]===0xFE){
      return {encoding:"utf-16le",offset:2,label:"UTF-16LE"};
    }
    if(bytes.length>=2 && bytes[0]===0xFE && bytes[1]===0xFF){
      return {encoding:"utf-16be",offset:2,label:"UTF-16BE"};
    }
    return null;
  }

  function detectUtf16WithoutBom(bytes){
    const sampleLength=Math.min(bytes.length-(bytes.length%2),8192);
    if(sampleLength<8) return "";

    let evenZeros=0;
    let oddZeros=0;
    const pairs=sampleLength/2;
    for(let index=0;index<sampleLength;index+=2){
      if(bytes[index]===0) evenZeros++;
      if(bytes[index+1]===0) oddZeros++;
    }

    const minimum=Math.max(2,Math.floor(pairs*0.05));
    if(oddZeros>=minimum && oddZeros>evenZeros*3) return "utf-16le";
    if(evenZeros>=minimum && evenZeros>oddZeros*3) return "utf-16be";
    return "";
  }

  async function readTextFileWithEncoding(file){
    if(!file || typeof file.arrayBuffer!=="function" || typeof TextDecoder==="undefined"){
      return {text:await file.text(),encoding:"UTF-8"};
    }

    const bytes=new Uint8Array(await file.arrayBuffer());
    const bom=detectBomEncoding(bytes);
    if(bom){
      return {
        text:decodeTextBytes(bytes.subarray(bom.offset),bom.encoding),
        encoding:bom.label
      };
    }

    const utf16=detectUtf16WithoutBom(bytes);
    if(utf16){
      try{
        return {
          text:decodeTextBytes(bytes,utf16,{fatal:true}),
          encoding:utf16==="utf-16le" ? "UTF-16LE" : "UTF-16BE"
        };
      }catch(error){}
    }

    try{
      return {text:decodeTextBytes(bytes,"utf-8",{fatal:true}),encoding:"UTF-8"};
    }catch(error){}

    // 브라우저의 euc-kr 디코더는 WHATWG 기준으로 CP949 확장 영역도 함께 처리한다.
    try{
      return {text:decodeTextBytes(bytes,"euc-kr",{fatal:true}),encoding:"CP949/EUC-KR"};
    }catch(error){}

    if(window.BookieCp949Decoder && typeof window.BookieCp949Decoder.decode==="function"){
      try{
        return {text:window.BookieCp949Decoder.decode(bytes),encoding:"CP949"};
      }catch(error){}
    }

    return {text:decodeTextBytes(bytes,"utf-8"),encoding:"UTF-8(대체 문자 포함)"};
  }

  const txtFileInputForFullReset=document.getElementById("txtFile");
  if(txtFileInputForFullReset){
    // 기존 TXT 작업이 있는 상태에서 새 파일을 고르면 새 파일만 유지하고
    // 표지·설정·선택·검색·미리보기 등 나머지 작업 상태는 전체 초기화한다.
    txtFileInputForFullReset.addEventListener("change",event=>{
      const incomingFiles=event.target?.files ? [...event.target.files] : [];
      if(!incomingFiles.length) return;

      const hasExistingTxtWork=previewFiles.length>0 || !!initialAutoDetectedFileSetKey ||
        (typeof fileText!=="undefined" && !!fileText) ||
        (typeof lines!=="undefined" && lines.length>0);
      if(!hasExistingTxtWork || typeof resetWorkState!=="function") return;

      resetWorkState({
        keepSelectedFiles:true,
        restoreDefaults:true,
        fullResetForNewFiles:true
      });
    },true);
  }

  function normalizeText(text){
    return String(text || "")
      .replace(/^\uFEFF/,"")
      .replace(/\r\n/g,"\n")
      .replace(/\r/g,"\n")
      // TXT의 탭은 모두 제거하고 각 줄 맨 앞의 공백만 없앤다.
      .replace(/\t/g,"")
      .replace(/^[^\S\r\n]+/gm,"")
      // 일부 EPUB 리더에서 글리프가 깨지는 장식용 괄호를 일반 괄호로 통일한다.
      // 각주 1❩/2❩와 문장 속 ❨웃음❩ 모두 기존 각주·본문 규칙으로 처리된다.
      .replace(/❨/g,"(")
      .replace(/❩/g,")")
      // 줄 맨 앞의 '1)설명'만 '1) 설명'으로 정리해 기존 각주 인식과 연결한다.
      .replace(/^(\d+\))(?=\S)/gm,"$1 ")
      .trim();
  }

  function isVolumeContinuationLine(line){
    const value=String(line || "")
      .normalize("NFKC")
      .replace(/[\u00AD\u034F\u061C\u180E\u200B-\u200F\u2060-\u206F\uFEFF]/g,"")
      .trim();
    if(!value || value.length>180) return false;

    return /^(?:[-–—─━※*•]\s*)?(?:[<\[(（【〈《「『]\s*)?(?:.*?\s+)?(?:다음\s*권|\d{1,4}\s*권)(?:\s*完[.!。]?\s*(?:다음\s*권|\d{1,4}\s*권))?\s*(?:에서|에|으로)?\s*(?:계속|이어짐|이어집니다)\s*[.!?。！？…]?\s*(?:[>\])）】〉》」』])?$/iu.test(value);
  }

  function removeTrailingVolumeLine(text){
    const normalized=normalizeText(text);
    if(!normalized) return normalized;

    const sourceLines=normalized.split("\n");
    const scanStart=Math.max(0,sourceLines.length-300);
    let changed=false;
    for(let i=scanStart;i<sourceLines.length;i++){
      if(!isVolumeContinuationLine(sourceLines[i])) continue;
      sourceLines[i]="";
      changed=true;
    }
    if(!changed) return normalized;
    return sourceLines.join("\n").replace(/\n{3,}/g,"\n\n").trim();
  }

  function normalizedTocLine(line){
    return String(line || "")
      .replace(/^\uFEFF/,"")
      .trim()
      .replace(/\s+/g," ");
  }

  function tocHeaderKey(line){
    return normalizedTocLine(line)
      .normalize("NFKC")
      .replace(/[\s|｜│:：<>{}\[\]()〈〉《》「」『』【】*_\-=─━]/g,"")
      .toLowerCase();
  }

  function isTocHeaderLine(line){
    return /^(?:목차|차례|contents?|tableofcontents)$/i.test(tocHeaderKey(line));
  }

  function isFootnoteSectionLine(line){
    return /^(?:각주|주석)$/i.test(tocHeaderKey(line));
  }

  function isChapterLikeLine(line){
    const value=normalizedTocLine(line).replace(/^#\s*/,"");
    return /^(?:프롤로그|에필로그|서문|후일담|외전|prologue|epilogue)$/i.test(value) ||
      /^(?:제\s*)?(?:\d{1,5}|[〇零一二三四五六七八九十百千萬万兩两]+)\s*(?:화|편|회|장|부|권|話|篇|回|章|部|卷|[.．、:：])(?:\s*.*)?$/i.test(value);
  }

  function frontTocComparisonKey(line){
    return normalizedTocLine(line)
      .replace(/^#\s*/,"")
      .replace(/[．、：]/g,match=>match==="：" ? ":" : ".")
      .replace(/\s*([.:])\s*/g,"$1")
      .toLowerCase();
  }

  function frontTocChapterSignature(line){
    const value=normalizedTocLine(line).replace(/^#\s*/,"");
    const number=value.match(/\d{1,5}|[〇零一二三四五六七八九十百千萬万兩两壹貳贰參叁肆伍陸陆柒捌玖拾佰仟]+/);
    if(!number) return "";

    const prefix=value.slice(0,number.index).replace(/\s+/g,"").toLowerCase();
    const rest=value.slice(number.index+number[0].length);
    const marker=rest.match(/^\s*(화|편|회|장|부|권|話|篇|回|章|部|卷|[.．、:：])/i);
    if(!marker && !prefix) return "number:"+number[0];
    const normalizedMarker=marker ? marker[1].replace(/[．、]/,".").replace("：",":").toLowerCase() : "";
    return [prefix,number[0],normalizedMarker].join("|");
  }

  function isLikelyFrontTocRestart(sourceLines,index,firstEntry){
    const candidate=String(sourceLines[index] || "");
    const sameText=frontTocComparisonKey(candidate)===frontTocComparisonKey(firstEntry);
    const firstSignature=frontTocChapterSignature(firstEntry);
    const sameChapterSignature=!!firstSignature && frontTocChapterSignature(candidate)===firstSignature;
    if(!sameText && !sameChapterSignature) return false;

    const previousBlank=index===0 || !normalizedTocLine(sourceLines[index-1]);
    const nextBlank=index+1>=sourceLines.length || !normalizedTocLine(sourceLines[index+1]);
    return previousBlank || nextBlank || sameText;
  }

  function removeFrontRepeatedTocBlock(text){
    const normalized=normalizeText(text);
    if(!normalized) return normalized;

    const sourceLines=normalized.split("\n");
    const headerScanLimit=Math.min(50,sourceLines.length);
    let tocIndex=-1;

    for(let i=0;i<headerScanLimit;i++){
      if(isTocHeaderLine(sourceLines[i])){
        tocIndex=i;
        break;
      }
    }
    if(tocIndex<0){
      // '목차' 제목 없이 '1권 + 연속 번호 목록'만 놓인 형식도 처리한다.
      for(let i=0;i<headerScanLimit;i++){
        if(!/^\d{1,4}\s*권$/i.test(normalizedTocLine(sourceLines[i]))) continue;
        const entries=[];
        let separatedRestart=-1;
        let sawGap=false;
        for(let j=i+1;j<Math.min(sourceLines.length,i+100);j++){
          const value=normalizedTocLine(sourceLines[j]);
          if(!value){
            if(entries.length>=3) sawGap=true;
            continue;
          }
          if(sawGap && entries.length>=3 &&
             isLikelyFrontTocRestart(sourceLines,j,sourceLines[entries[0]])){
            separatedRestart=j;
            break;
          }
          if(!isChapterLikeLine(value)) break;
          entries.push(j);
          sawGap=false;
        }
        if(entries.length<3) continue;
        const firstEntry=sourceLines[entries[0]];
        const repeated=separatedRestart>=0 ? separatedRestart :
          sourceLines.findIndex((line,index)=>index>entries[entries.length-1] &&
            isLikelyFrontTocRestart(sourceLines,index,firstEntry));
        if(repeated<0) continue;
        return sourceLines
          .slice(0,i)
          .concat(sourceLines.slice(entries[entries.length-1]+1))
          .join("\n")
          .replace(/\n{3,}/g,"\n\n")
          .trim();
      }
      return normalized;
    }

    let firstEntryIndex=-1;
    let firstEntry="";
    for(let i=tocIndex+1;i<sourceLines.length;i++){
      const value=normalizedTocLine(sourceLines[i]);
      if(!value) continue;
      if(/^.{1,100}\s+\d{1,4}\s*권$/i.test(value)){
        const next=sourceLines.slice(i+1).find(line=>normalizedTocLine(line));
        if(next && isChapterLikeLine(next)) continue;
      }
      firstEntryIndex=i;
      firstEntry=value;
      break;
    }
    if(firstEntryIndex<0 || !firstEntry) return normalized;

    let nonBlankEntries=0;
    const distinctEntries=new Set();
    let repeatedStartIndex=-1;
    for(let i=firstEntryIndex;i<sourceLines.length;i++){
      const value=normalizedTocLine(sourceLines[i]);
      if(!value) continue;

      if(i>firstEntryIndex && nonBlankEntries>=3 && distinctEntries.size>=2 &&
         isLikelyFrontTocRestart(sourceLines,i,firstEntry)){
        repeatedStartIndex=i;
        break;
      }
      nonBlankEntries++;
      distinctEntries.add(frontTocComparisonKey(value));
    }
    if(repeatedStartIndex<0) return normalized;

    // 목차와 실제 첫 챕터 사이의 일러두기·각주·주석은 보존한다.
    let protectedIndex=-1;
    for(let i=firstEntryIndex;i<repeatedStartIndex;i++){
      const value=normalizedTocLine(sourceLines[i]);
      if(/^일러두기$/i.test(value) || isFootnoteSectionLine(value) ||
         /본\s*도서에\s*등장하는\s*인물|실제\s*현실과\s*관련\s*없는\s*허구/i.test(value)){
        protectedIndex=i;
        break;
      }
    }
    const keepFrom=protectedIndex>=0 ? protectedIndex : repeatedStartIndex;

    // '목차' 또는 '차례' 줄부터 목록 끝까지만 제거한다.
    return sourceLines
      .slice(0,tocIndex)
      .concat(sourceLines.slice(keepFrom))
      .join("\n")
      .replace(/\n{3,}/g,"\n\n")
      .trim();
  }

  const COPYRIGHT_LABELS=[
    "판권","전자책발행일","전자책출간일","전자책발행","초판발행","발행일","제작일",
    "지은이","저자","저자명","발행인","펴낸이","발행처","펴낸곳","제작","제작및유통",
    "편집","편집팀","편집인","기획","기획·편집","번역","윤문","표지","표지디자인",
    "연대표지그림","일러스트","타이포디자인","타이틀","공유금지","출판등록","등록번호",
    "등록일자","등록일","주소","전화","fax","이메일","email","e-mail","전자우편",
    "홈페이지","블로그","원고투고","투고","투고메일","투고처","문의","문의메일","투고/문의",
    "고객지원센터","contact","정가","전자책정가","가격","isbn","전자책isbn","uci"
  ];

  function escapeRegex(value){
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  }

  const COPYRIGHT_LABEL_PATTERNS=COPYRIGHT_LABELS.map(label=>{
    const chars=[...label.replace(/\s+/g,"")]
      .map(char=>escapeRegex(char))
      .join("[\\s\\u00A0\\u2000-\\u200B\\u202F\\u205F\\u3000]*");
    return {
      label:label.toLowerCase(),
      regex:new RegExp(`^[※*•·\\-–—]?[\\s\\u00A0\\u3000]*${chars}(?:[\\s\\u00A0\\u3000]*[:：|｜│︙][\\s\\u00A0\\u3000]*|[\\s\\u00A0\\u3000]+)(?=\\S)`,"iu")
    };
  });

  function copyrightMetadataLabel(line){
    // 세로 말줄임표(︙)와 원문 구분자를 보존한 채 항목명을 판별한다.
    const value=String(line || "");
    for(const item of COPYRIGHT_LABEL_PATTERNS){
      if(item.regex.test(value)) return item.label;
    }
    if(/^\s*\d{4}년\s*\d{1,2}월\s*\d{1,2}일\s*초판\s*발행\s*$/iu.test(value)) return "초판발행";
    return "";
  }

  function isIsbnLine(line){
    return /\bI[\s\u00A0\u3000]*S[\s\u00A0\u3000]*B[\s\u00A0\u3000]*N(?:-?1[03])?\b/i.test(String(line || ""));
  }

  function isCopyrightAnchorLine(line){
    const raw=String(line || "");
    const value=raw.normalize("NFKC");
    return isIsbnLine(value) || /^\s*(?:※\s*)?UCI\s*[:：|｜│︙]/iu.test(raw) ||
      /©|ⓒ/.test(raw) || /\bcopyright\b|all\s+rights\s+(?:are\s+)?reserved/i.test(value) ||
      (/저작권/i.test(value) && /(?:보호|무단|복제|전재|배포|공유|스캔|재가공)/i.test(value)) ||
      (/판[\s\u00A0\u3000]*권/i.test(value) && /97[89](?:[-\s]?\d){8,}/.test(value));
  }

  function looksLikeCopyrightContinuation(line){
    const value=String(line || "").trim();
    if(!value) return true;
    return !!copyrightMetadataLabel(value) || isCopyrightAnchorLine(value) ||
      /(?:계약에\s*따라|독점\s*계약|보호\s*받는\s*저작물|법적\s*(?:제재|책임|처벌)|이용하지\s*못|서면\s*(?:동의|허락)|무단\s*(?:복제|전재|유포|배포|공유|스캔)|재가공|출판권자|저작권자|rights\s+under\s+license|produced\s+in\s+korea|no\s+part\s+of\s+this\s+book|전자책\s*가격)/i.test(value) ||
      /^(?:https?:\/\/|www\.)\S+$/i.test(value) ||
      /^[─━=*_∞•·]+$/u.test(value);
  }

  function isCopyrightSignalLine(line){
    const label=copyrightMetadataLabel(line);
    const anchor=isCopyrightAnchorLine(line);
    const rights=/(?:저작권|무단\s*(?:복제|전재|유포|배포|공유|스캔)|서면\s*(?:동의|허락)|all\s+rights\s+(?:are\s+)?reserved)/i.test(String(line || ""));
    return {label,anchor,rights,matched:!!label || anchor || rights};
  }

  function isCopyrightTitleCandidate(line){
    const value=String(line || "").trim();
    if(!value || value.length>120 || /^\d+\)\s*/.test(value) || isVolumeContinuationLine(value)) return false;
    if(isTocHeaderLine(value) || isFootnoteSectionLine(value) || isChapterLikeLine(value)) return false;
    return !/[.!?。！？…][”"']?$/.test(value);
  }

  function isCopyrightHardBoundary(line){
    const value=normalizedTocLine(line);
    return isTocHeaderLine(value) || isFootnoteSectionLine(value) || /^일러두기$/i.test(value) ||
      isChapterLikeLine(value) || /^\d{1,4}\s*권$/i.test(value);
  }

  function findCopyrightRangeInWindow(lines,windowStart,windowEnd){
    const signals=[];
    for(let i=windowStart;i<windowEnd;i++){
      const signal=isCopyrightSignalLine(lines[i]);
      if(signal.matched) signals.push({index:i,...signal});
    }
    if(!signals.length) return null;

    const groups=[];
    let group=[];
    signals.forEach(signal=>{
      if(!group.length || signal.index-group[group.length-1].index<=16){
        group.push(signal);
      }else{
        groups.push(group);
        group=[signal];
      }
    });
    if(group.length) groups.push(group);

    const validGroups=groups.filter(items=>{
      const labels=new Set(items.map(item=>item.label).filter(Boolean));
      const anchors=items.filter(item=>item.anchor).length;
      const rights=items.filter(item=>item.rights).length;
      return (anchors>=1 && (labels.size>=2 || anchors>=2 || (labels.size>=1 && rights>=1))) || labels.size>=4;
    });
    if(!validGroups.length) return null;

    const selected=windowStart===0 ? validGroups[0] : validGroups[validGroups.length-1];
    let start=selected[0].index;
    const standaloneCopyright=/^copyright$/i.test(String(lines[start] || "").trim());

    if(!standaloneCopyright){
      let previous=start-1;
      while(previous>=windowStart && !String(lines[previous] || "").trim()) previous--;
      const decorative=[];
      while(previous>=windowStart && /^[─━=*_∞•·]+$/u.test(String(lines[previous] || "").trim())){
        decorative.push(previous);
        previous--;
        while(previous>=windowStart && !String(lines[previous] || "").trim()) previous--;
      }
      if(previous>=windowStart && isCopyrightTitleCandidate(lines[previous])){
        start=previous;
        let cover=previous-1;
        while(cover>=windowStart && !String(lines[cover] || "").trim()) cover--;
        if(cover>=windowStart && /^cover$/i.test(String(lines[cover] || "").trim())) start=cover;
      }else if(decorative.length){
        start=Math.min(...decorative);
      }
    }

    let end=selected[selected.length-1].index+1;
    for(let i=end;i<windowEnd;i++){
      const value=String(lines[i] || "").trim();
      if(!value){
        end=i+1;
        continue;
      }
      if(isCopyrightHardBoundary(value)) break;
      if(looksLikeCopyrightContinuation(value)){
        end=i+1;
        continue;
      }
      break;
    }

    while(start>windowStart && !String(lines[start-1] || "").trim()) start--;
    while(end<windowEnd && !String(lines[end] || "").trim()) end++;
    return {start,end};
  }

  function removeMergeCopyrightBlocks(text){
    const normalized=normalizeText(text);
    if(!normalized) return normalized;

    let sourceLines=normalized.split("\n");
    const ranges=[];
    const frontEnd=Math.min(200,sourceLines.length);
    const backStart=Math.max(0,sourceLines.length-200);
    const front=findCopyrightRangeInWindow(sourceLines,0,frontEnd);
    const back=findCopyrightRangeInWindow(sourceLines,backStart,sourceLines.length);
    if(front) ranges.push(front);
    if(back && (!front || back.start>=front.end || back.end<=front.start)) ranges.push(back);
    if(!ranges.length) return normalized;

    ranges.sort((a,b)=>b.start-a.start).forEach(range=>{
      sourceLines.splice(range.start,range.end-range.start);
    });
    return sourceLines.join("\n").replace(/\n{3,}/g,"\n\n").trim();
  }

  function automaticallyCleanFront(text){
    // 파일 개수와 관계없이 확인된 판권 블록을 제거한다.
    const withoutCopyright=removeMergeCopyrightBlocks(text);
    // 목차·차례·Table of Contents와 반복되는 첫 항목을 확인한다.
    // 목차 형식 자체는 제한하지 않아 기존의 #1, 1화, 1., 1장, 일반 제목형을 모두 처리한다.
    const withoutFrontToc=removeFrontRepeatedTocBlock(withoutCopyright);
    // 파일의 마지막 줄에 숫자+'권' 또는 '다음권'이 있을 때는 그 줄 전체를 제거한다.
    return removeTrailingVolumeLine(withoutFrontToc);
  }

  window.BookieFrontTocAutoDelete={
    removeFrontRepeatedTocBlock,
    automaticallyCleanFront,
    normalizeText,
    removeTrailingVolumeLine,
    isVolumeContinuationLine,
    isTocHeaderLine,
    copyrightMetadataLabel,
    isCopyrightAnchorLine
  };

  function deletedSetFor(file){
    const key=fileKey(file);
    if(!deletedLinesByFile.has(key)) deletedLinesByFile.set(key,new Set());
    return deletedLinesByFile.get(key);
  }

  function editedMapFor(file){
    const key=fileKey(file);
    if(!editedLinesByFile.has(key)) editedLinesByFile.set(key,new Map());
    return editedLinesByFile.get(key);
  }

  function quoteShortcutSearchSource(value){
    const query=String(value || "").trim();
    if(query==='"') return '(?:"|“)';
    if(query==="'") return "(?:'|‘)";
    if(query==='""') return '(?:"[^"\\r\\n]*"|“[^”\\r\\n]*”)';
    if(query==="''") return "(?:'[^'\\r\\n]*'|‘[^’\\r\\n]*’)";
    return "";
  }

  function isSingleQuoteShortcut(value){
    const query=String(value || "").trim();
    return query==='"' || query==="'";
  }

  function searchQueryRegex(query,global=false){
    const source=quoteShortcutSearchSource(query);
    const anchored=isSingleQuoteShortcut(query) ? `^[ \\t]*${source}` : source;
    return source ? new RegExp(anchored,global ? "gmu" : "mu") : null;
  }

  function matchesSearchQuery(line,query){
    const regex=searchQueryRegex(query);
    return regex ? regex.test(String(line || "")) : String(line || "").includes(String(query || ""));
  }

  function removeLiteralText(line,query){
    const keyword=String(query || "");
    const text=String(line || "");
    if(!keyword) return text;
    const regex=searchQueryRegex(keyword,true);
    if(!regex) return text.split(keyword).join("");
    if(isSingleQuoteShortcut(keyword)){
      const quotePattern=keyword.trim()==='"' ? /["“]/u : /['‘]/u;
      return text.replace(regex,value=>value.replace(quotePattern,""));
    }
    return text.replace(regex,value=>value.slice(1,-1));
  }

  async function processedFile(file){
    const decoded=await readTextFileWithEncoding(file);
    const cleaned=automaticallyCleanFront(decoded.text);
    const originalSourceLines=cleaned ? cleaned.split("\n") : [];
    const edited=editedMapFor(file);
    const sourceLines=originalSourceLines.map((line,sourceIndex)=>
      edited.has(sourceIndex) ? edited.get(sourceIndex) : line
    );
    const deleted=deletedSetFor(file);
    const keptEntries=sourceLines
      .map((line,sourceIndex)=>({line,sourceIndex}))
      .filter(entry=>!deleted.has(entry.sourceIndex));

    // fileText에 합칠 때 trim()으로 사라지는 파일 앞뒤 빈 줄을
    // 미리보기의 전역 줄 번호 계산에서도 똑같이 제외한다.
    let start=0;
    let end=keptEntries.length;
    while(start<end && !String(keptEntries[start].line).trim()) start++;
    while(end>start && !String(keptEntries[end-1].line).trim()) end--;

    const finalEntries=keptEntries.slice(start,end);
    const keptLines=finalEntries.map(entry=>entry.line);
    const localLineBySourceIndex=new Map();
    finalEntries.forEach((entry,localIndex)=>localLineBySourceIndex.set(entry.sourceIndex,localIndex));

    return {
      file,
      key:fileKey(file),
      sourceLines,
      deleted,
      keptLines,
      finalEntries,
      localLineBySourceIndex,
      encoding:decoded.encoding,
      text:keptLines.join("\n")
    };
  }

  async function processedFiles(files){
    const list=[...files];
    return Promise.all(list.map(processedFile));
  }

  function tocRefKey(fileKeyValue,sourceIndex){
    return JSON.stringify([fileKeyValue,sourceIndex]);
  }

  function tocRefFromCombinedIndex(combinedIndex){
    if(!Number.isInteger(combinedIndex)) return null;
    for(const item of previewFiles){
      const localIndex=combinedIndex-(item.combinedOffset || 0);
      if(localIndex<0 || localIndex>=item.finalEntries.length) continue;
      const entry=item.finalEntries[localIndex];
      return {
        key:item.key,
        sourceIndex:entry.sourceIndex,
        refKey:tocRefKey(item.key,entry.sourceIndex),
        confidence:tocConfidence[combinedIndex] || "manual",
        text:String(lines[combinedIndex] ?? entry.line)
      };
    }
    return null;
  }

  function combinedFileEndForLineIndex(combinedIndex){
    if(!Number.isInteger(combinedIndex)) return null;
    for(const item of previewFiles){
      const start=item.combinedOffset || 0;
      const end=start+item.finalEntries.length;
      if(combinedIndex>=start && combinedIndex<end) return end;
    }
    return null;
  }

  function captureSelectedTocRefs(){
    return selectedIndexes.map(tocRefFromCombinedIndex).filter(Boolean);
  }

  function mergeTocRefs(...groups){
    const merged=new Map();
    groups.flat().filter(Boolean).forEach(ref=>merged.set(ref.refKey || tocRefKey(ref.key,ref.sourceIndex),ref));
    return [...merged.values()];
  }

  function restoreSelectedTocRefs(refs){
    const restoredIndexes=[];
    const restoredConfidence={};

    mergeTocRefs(refs || []).forEach(ref=>{
      const item=previewFiles.find(entry=>entry.key===ref.key);
      if(!item) return;
      const localIndex=item.localLineBySourceIndex.get(ref.sourceIndex);
      if(!Number.isInteger(localIndex)) return;
      const combinedIndex=(item.combinedOffset || 0)+localIndex;
      restoredIndexes.push(combinedIndex);
      restoredConfidence[combinedIndex]=ref.confidence || "manual";
      if(ref.text!==undefined) lines[combinedIndex]=String(ref.text);
    });

    selectedIndexes=[...new Set(restoredIndexes)].sort((a,b)=>a-b);
    tocConfidence=restoredConfidence;
    refreshSelectedLineClasses();
    if(typeof renderToc==="function") renderToc();
    if(typeof renderPatternTags==="function") renderPatternTags();
    if(typeof updateCount==="function") updateCount();
  }

  function makeTab(item,index){
    const button=document.createElement("button");
    button.type="button";
    button.className="frontBookTab"+(item.key===activePreviewFileKey ? " active" : "");
    button.dataset.frontBookKey=item.key;
    button.title=item.file.name;
    button.setAttribute("role","tab");
    button.setAttribute("aria-selected",item.key===activePreviewFileKey ? "true" : "false");
    button.textContent=`${index+1}. ${titleFromFile(item.file.name)}`;
    return button;
  }

  function refreshSelectedLineClasses(){
    const selected=new Set(selectedIndexes);
    document.querySelectorAll(".line[data-i]").forEach(row=>{
      const index=Number(row.dataset.i);
      const isSelected=selected.has(index);
      row.classList.toggle("selected",isSelected);
      row.classList.toggle("chapter",isSelected);
    });
  }

  function toggleFrontLineSelection(combinedLine){
    if(!Number.isInteger(combinedLine) || combinedLine<0 || combinedLine>=lines.length) return;
    const value=String(lines[combinedLine] || "").trim();
    if(!value) return;

    if(selectedIndexes.includes(combinedLine)){
      selectedIndexes=selectedIndexes.filter(index=>index!==combinedLine);
      delete tocConfidence[combinedLine];
      const ref=tocRefFromCombinedIndex(combinedLine);
      if(ref) directSelectionRefKeys.delete(ref.refKey);
    }else{
      selectedIndexes=[...selectedIndexes,combinedLine].sort((a,b)=>a-b);
      tocConfidence[combinedLine]="manual";
      const ref=tocRefFromCombinedIndex(combinedLine);
      if(ref) directSelectionRefKeys.add(ref.refKey);
    }

    refreshSelectedLineClasses();
    if(typeof updateCount==="function") updateCount();
    if(typeof renderToc==="function") renderToc();

    const panel=document.getElementById("tocPanel");
    const arrow=document.getElementById("tocArrow");
    if(panel) panel.classList.remove("closed");
    if(arrow) arrow.textContent="▾";
  }

  function toggleIdenticalFrontLineSelection(combinedLine){
    if(!Number.isInteger(combinedLine) || combinedLine<0 || combinedLine>=lines.length) return 0;
    const seed=String(lines[combinedLine] || "").trim();
    if(!seed) return 0;

    const matches=[];
    for(let index=0;index<lines.length;index++){
      if(String(lines[index] || "").trim()===seed) matches.push(index);
    }
    if(!matches.length) return 0;

    const selected=new Set(selectedIndexes);
    const shouldSelect=!matches.every(index=>selected.has(index));
    matches.forEach(index=>{
      const ref=tocRefFromCombinedIndex(index);
      if(shouldSelect){
        selected.add(index);
        tocConfidence[index]="manual";
        if(ref) directSelectionRefKeys.add(ref.refKey);
      }else{
        selected.delete(index);
        delete tocConfidence[index];
        if(ref) directSelectionRefKeys.delete(ref.refKey);
      }
    });
    selectedIndexes=[...selected].sort((a,b)=>a-b);

    refreshSelectedLineClasses();
    if(typeof updateCount==="function") updateCount();
    if(typeof renderToc==="function") renderToc();
    openTocAfterSelection();
    return matches.length;
  }

  function selectChapterLinesByPrefix(query){
    const keyword=String(query || "").trim();
    if(!keyword) return 0;
    const quoteSource=quoteShortcutSearchSource(keyword);
    const quoteRegex=quoteSource ? new RegExp("^\\s*"+quoteSource,"u") : null;

    const selected=new Set(selectedIndexes);
    let added=0;

    // fileText/lines는 파일 순서대로 합쳐져 있으므로 이 순회 순서가
    // 곧 1권→2권→3권, 각 권 안에서는 원래 줄 순서가 된다.
    for(let index=0;index<lines.length;index++){
      const line=String(lines[index] || "").trimStart();
      if(quoteRegex ? !quoteRegex.test(line) : !line.startsWith(keyword)) continue;
      if(!selected.has(index)) added++;
      selected.add(index);
      tocConfidence[index]="manual";
    }

    selectedIndexes=[...selected].sort((a,b)=>a-b);
    refreshSelectedLineClasses();
    if(typeof updateCount==="function") updateCount();
    if(typeof renderToc==="function") renderToc();
    return added;
  }

  function escapeAutoPatternText(value){
    return String(value || "")
      .split(/\s+/)
      .map(part=>part.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"))
      .join("\\s*");
  }

  function autoChapterNumberSource(){
    const includeHanja=!!document.getElementById("includeHanjaToc")?.checked;
    return includeHanja
      ? "(?:\\d{1,5}|[〇零一二三四五六七八九十百千萬万兩两壹貳贰參叁肆伍陸陆柒捌玖拾佰仟]+)"
      : "(?:\\d{1,5})";
  }

  function buildAutoChapterRegex(seed){
    const raw=(typeof stripChapterWrappers==="function")
      ? stripChapterWrappers(String(seed || ""))
      : String(seed || "");
    const text=raw.trim();
    if(!text) return null;

    // 입력 줄의 첫 번호만 가변값으로 바꾼다.
    // 번호 뒤에서는 목차 단위(장/화/회 등) 또는 구두점만 유지하고,
    // 그 뒤 제목·괄호·특수문자 등은 무엇이든 허용한다.
    const includeHanja=!!document.getElementById("includeHanjaToc")?.checked;
    const numberToken=includeHanja
      ? /\d{1,5}|[〇零一二三四五六七八九十百千萬万兩两壹貳贰參叁肆伍陸陆柒捌玖拾佰仟]+/
      : /\d{1,5}/;
    const match=numberToken.exec(text);
    if(!match) return null;

    const prefix=text.slice(0,match.index);
    const rest=text.slice(match.index+match[0].length);
    const markerMatch=rest.match(/^\s*(화|편|회|장|부|권|話|篇|回|章|部|卷|[.．、:])/i);
    const marker=markerMatch ? markerMatch[1] : "";

    let source="^\\s*"+escapeAutoPatternText(prefix)+autoChapterNumberSource();
    if(marker){
      source+="\\s*"+escapeAutoPatternText(marker)+".*$";
    }else if(!prefix && !rest.trim()){
      // 001 같은 숫자 단독 목차는 다른 '숫자+단위' 줄까지 잡지 않는다.
      source+="\\s*$";
    }else if(/^\s+/.test(rest)){
      // 숫자 뒤에 단위 대신 공백이 있었다면 그 구분도 형식으로 유지한다.
      source+="\\s+.*$";
    }else{
      source+=".*$";
    }
    return new RegExp(source,"i");
  }

  function isStrongExplicitChapterRegex(value){
    const text=String(value || "");
    return text.startsWith("^") || text.endsWith("$") ||
      /\\[dDsSwWbB]/.test(text) || /(^|[^\\])\.\*/.test(text) ||
      text.startsWith("(?");
  }

  function rememberAppliedPattern(regex,addedIndexes=[]){
    if(!regex || typeof appliedPatterns==="undefined") return;
    const patternSource=(typeof regexText==="function") ? regexText(regex) : regex.source;
    if(!patternAddedRefKeysBySource.has(patternSource)) patternAddedRefKeysBySource.set(patternSource,new Set());
    const addedRefs=patternAddedRefKeysBySource.get(patternSource);
    addedIndexes.map(tocRefFromCombinedIndex).filter(Boolean).forEach(ref=>addedRefs.add(ref.refKey));
    if(!appliedPatterns.includes(patternSource)){
      appliedPatterns.push(patternSource);
      if(typeof renderPatternTags==="function") renderPatternTags();
    }
  }

  function removePatternTagForBookie(pattern){
    const remainingPatterns=appliedPatterns.filter(value=>value!==pattern);
    const candidates=patternAddedRefKeysBySource.get(pattern) || new Set();
    const protectedByRemainingPatterns=new Set();
    const remainingMatchesByPattern=new Map();

    remainingPatterns.forEach(source=>{
      try{
        const regex=new RegExp(source);
        const matches=new Set();
        lines.forEach((line,index)=>{
          if(regex.test(String(line || "").trim())){
            matches.add(index);
            protectedByRemainingPatterns.add(index);
          }
        });
        remainingMatchesByPattern.set(source,matches);
      }catch(error){}
    });

    selectedIndexes=selectedIndexes.filter(index=>{
      const ref=tocRefFromCombinedIndex(index);
      if(!ref || !candidates.has(ref.refKey)) return true;
      if(protectedByRemainingPatterns.has(index)){
        // 겹치는 줄은 남은 정규식 쪽으로 소유권을 넘겨 다음 ×에서도 정확히 처리한다.
        remainingMatchesByPattern.forEach((matches,source)=>{
          if(!matches.has(index)) return;
          if(!patternAddedRefKeysBySource.has(source)) patternAddedRefKeysBySource.set(source,new Set());
          patternAddedRefKeysBySource.get(source).add(ref.refKey);
        });
        return true;
      }
      return directSelectionRefKeys.has(ref.refKey);
    });

    const selectedSet=new Set(selectedIndexes);
    Object.keys(tocConfidence).forEach(key=>{
      if(!selectedSet.has(Number(key))) delete tocConfidence[key];
    });
    appliedPatterns=remainingPatterns;
    patternAddedRefKeysBySource.delete(pattern);
    refreshSelectedLineClasses();
    if(typeof renderToc==="function") renderToc();
    if(typeof renderPatternTags==="function") renderPatternTags();
    if(typeof updateCount==="function") updateCount();
  }

  function openTocAfterSelection(){
    const panel=document.getElementById("tocPanel");
    const arrow=document.getElementById("tocArrow");
    if(panel) panel.classList.remove("closed");
    if(arrow) arrow.textContent="▾";
  }

  function rerunAutoTocDetection(){
    if(typeof lines==="undefined" || !lines.length){
      alert("TXT를 먼저 넣어주세요!");
      return;
    }
    if(typeof autoDetectChapters!=="function") return;

    const before=new Set(selectedIndexes);
    const checkbox=document.getElementById("autoDetectToc");
    const previousChecked=checkbox ? checkbox.checked : true;

    // 이 버튼은 자동 탐지 설정과 별개인 사용자의 명시적 재실행이다.
    if(checkbox) checkbox.checked=true;
    try{
      autoDetectChapters();
    }finally{
      if(checkbox) checkbox.checked=previousChecked;
    }

    refreshSelectedLineClasses();
    if(typeof renderToc==="function") renderToc();
    if(typeof updateCount==="function") updateCount();

    const added=selectedIndexes.filter(index=>!before.has(index)).length;
    if(selectedIndexes.length) openTocAfterSelection();
    if(typeof log==="function") log(`자동 목차 다시 찾기: ${added}개 추가 / 총 ${selectedIndexes.length}개`);
  }

  async function openFrontPreviewOnly(){
    const input=document.getElementById("txtFile");
    const files=input ? [...input.files] : [];
    if(!files.length){
      alert("TXT를 먼저 넣어주세요!");
      return;
    }

    // 아직 한 번도 준비되지 않은 파일만 최초 로딩한다.
    // 이미 준비된 뒤에는 선택/목차 상태를 초기화하지 않고 패널만 연다.
    if(!previewFiles.length){
      await editableLoadPreview({keepFrontPanelOpen:true});
      return;
    }
    renderActiveFrontPreview();
    openPanel("frontPanel");
  }

  function selectAutoChapterPattern(index){
    if(!Number.isInteger(index) || index<0 || index>=lines.length) return;

    const seed=String(lines[index] || "").trim();
    const regex=buildAutoChapterRegex(seed);
    // 숫자가 없는 Q/프롤로그/에필로그/외전/일반 제목은 같은 전체 줄을
    // 하나의 선택 규칙으로 취급해 모든 동일 항목을 함께 선택·해제한다.
    if(!regex){
      toggleIdenticalFrontLineSelection(index);
      return;
    }

    // 사용자가 직접 패턴으로 적용한 줄을 다시 클릭했을 때만 선택 해제한다.
    // 자동 인식(sure/maybe)으로 이미 선택된 줄의 첫 클릭은 패턴 적용으로 처리해야
    // 다른 권의 같은 형식 목차까지 함께 추가된다.
    if(selectedIndexes.includes(index) && tocConfidence[index]==="manual"){
      selectedIndexes=selectedIndexes.filter(value=>value!==index);
      delete tocConfidence[index];
      refreshSelectedLineClasses();
      if(typeof updateCount==="function") updateCount();
      if(typeof renderToc==="function") renderToc();
      return;
    }

    tocConfidence[index]="manual";
    const input=document.getElementById("chapterPattern");
    if(input) input.value=(typeof regexText==="function") ? regexText(regex) : regex.source;
    const selectedBeforePattern=new Set(selectedIndexes);
    if(typeof selectByRegex==="function") selectByRegex(regex);
    const addedByPattern=selectedIndexes.filter(value=>!selectedBeforePattern.has(value));
    // 한자 번호 옵션 등으로 자동 패턴 결과가 0개여도 클릭한 줄 자체는 반드시 선택한다.
    if(!selectedIndexes.includes(index)) toggleFrontLineSelection(index);
    rememberAppliedPattern(regex,addedByPattern);
    openTocAfterSelection();
  }

  function applyChapterSearchByMode(){
    const input=document.getElementById("chapterPattern");
    const query=String(input ? input.value : "").trim();
    if(!query) return;

    const generalSearch=!!document.getElementById("chapterGeneralSearch")?.checked;
    let regex=null;

    try{
      const quoteSource=quoteShortcutSearchSource(query);
      if(quoteSource){
        regex=new RegExp("^\\s*"+quoteSource,"u");
      }else if(generalSearch){
        // 일반 검색 ON: 입력한 문자열로 시작하는 줄만 찾는다.
        // 예: 1장 -> 1장 / 1장. / 1장 내용 (2장/3장은 제외)
        const escaped=(typeof escapeRegexText==="function")
          ? escapeRegexText(query)
          : query.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
        regex=new RegExp("^\\s*"+escaped,"i");
      }else if(isStrongExplicitChapterRegex(query)){
        // ^, $, \\d, .*처럼 의도가 분명한 입력만 직접 정규식으로 처리한다.
        // 제목 안의 (1), [특별편] 같은 문자는 일반 제목 내용으로 유지한다.
        regex=new RegExp(query);
      }else{
        // 일반 검색 OFF: 입력 줄에서 첫 번호의 형식을 자동 분석한다.
        regex=buildAutoChapterRegex(query);
        // @, 프롤로그처럼 번호가 없는 입력은 문자 그대로 시작하는 줄을 찾는다.
        // 특수문자도 정규식 기호로 오해하지 않도록 안전하게 이스케이프한다.
        if(!regex){
          const escaped=(typeof escapeRegexText==="function")
            ? escapeRegexText(query)
            : query.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
          regex=new RegExp("^\\s*"+escaped,"i");
        }
      }
    }catch(error){
      alert("정규식 오류!");
      return;
    }

    if(!regex) return;
    const selectedBeforePattern=new Set(selectedIndexes);
    if(typeof selectByRegex==="function") selectByRegex(regex);
    const addedByPattern=selectedIndexes.filter(value=>!selectedBeforePattern.has(value));
    rememberAppliedPattern(regex,addedByPattern);
    openTocAfterSelection();

    input.value="";
    input.blur();
  }

  function renderActiveFrontPreview(){
    const host=document.getElementById("frontPreview");
    if(!host) return;
    host.replaceChildren();

    if(!previewFiles.length){
      activePreviewFileKey="";
      return;
    }
    if(!previewFiles.some(item=>item.key===activePreviewFileKey)){
      activePreviewFileKey=previewFiles[0].key;
    }

    const tabs=document.createElement("div");
    tabs.className="frontBookTabs";
    tabs.setAttribute("role","tablist");
    previewFiles.forEach((item,index)=>tabs.appendChild(makeTab(item,index)));
    host.appendChild(tabs);

    const active=previewFiles.find(item=>item.key===activePreviewFileKey) || previewFiles[0];
    const list=document.createElement("div");
    list.className="frontLineList";

    let visibleCount=0;
    for(let sourceIndex=0;sourceIndex<active.sourceLines.length && visibleCount<120;sourceIndex++){
      if(active.deleted.has(sourceIndex)) continue;
      const text=active.sourceLines[sourceIndex];
      if(!text.trim()) continue;

      const row=document.createElement("div");
      row.className="line editableFrontLine";
      row.dataset.sourceLine=String(sourceIndex);
      const localLineIndex=active.localLineBySourceIndex.get(sourceIndex);
      if(Number.isInteger(localLineIndex)){
        const combinedLine=(active.combinedOffset || 0)+localLineIndex;
        row.dataset.combinedLine=String(combinedLine);
        row.dataset.i=String(combinedLine);
        const isSelected=selectedIndexes.includes(combinedLine);
        row.classList.toggle("selected",isSelected);
        row.classList.toggle("chapter",isSelected);
      }

      const number=document.createElement("div");
      number.className="lineNo";
      number.textContent=`L${visibleCount+1}`;

      const content=document.createElement("div");
      content.className="lineText";
      content.textContent=text;

      const remove=document.createElement("button");
      remove.type="button";
      remove.className="frontLineRemove";
      remove.dataset.deleteFrontLine=String(sourceIndex);
      remove.setAttribute("aria-label",`${sourceIndex+1}번째 줄 삭제`);
      remove.title="이 줄을 내용에서 삭제";
      remove.textContent="×";

      row.append(number,content,remove);
      list.appendChild(row);
      visibleCount++;
    }

    if(!visibleCount){
      const empty=document.createElement("div");
      empty.className="frontPreviewEmpty";
      empty.textContent="표시할 앞부분 내용이 없어요.";
      list.appendChild(empty);
    }
    host.appendChild(list);
  }

  async function editableLoadPreview(options={}){
    const input=document.getElementById("txtFile");
    const files=input ? [...input.files] : [];
    if(!files.length){
      alert("TXT 넣어주세요!");
      return;
    }
    const currentFileSetKey=fileSetKey(files);
    const shouldRunInitialAutoDetection=currentFileSetKey!==initialAutoDetectedFileSetKey;

    const logBox=document.getElementById("log");
    if(logBox) logBox.textContent="";
    log(files.length+"개 TXT 읽는 중...");

    previewFiles=await processedFiles(files);
    previewFiles.forEach(item=>{
      if(item.encoding && item.encoding!=="UTF-8") log(`${item.file.name}: ${item.encoding} 자동 인식`);
    });
    let combinedOffset=0;
    let hasPreviousText=false;
    previewFiles.forEach(item=>{
      if(!item.text){
        item.combinedOffset=combinedOffset;
        return;
      }
      // 파일 사이의 "\n\n"은 split("\n") 결과에서 빈 줄 1개를 만든다.
      // 줄 인덱스에는 그 빈 줄 1개만 더해야 다음 권의 선택 위치가 정확하다.
      if(hasPreviousText) combinedOffset+=1;
      item.combinedOffset=combinedOffset;
      combinedOffset+=item.keptLines.length;
      hasPreviousText=true;
    });
    fileText=previewFiles.map(item=>item.text).filter(Boolean).join("\n\n");
    if(typeof BookieParagraphBreakSettings!=="undefined"){
      BookieParagraphBreakSettings.refreshCandidates(fileText);
    }

    const titleInput=document.getElementById("bookTitle");
    if(titleInput) titleInput.value=titleFromFiles(files);

    detectParagraphStyle(fileText);
    lines=fileText.split("\n");
    buildLineStarts(fileText);
    selectedIndexes=[];
    tocConfidence={};

    const pattern=document.getElementById("chapterPattern");
    const tags=document.getElementById("patternTags");
    if(pattern) pattern.value="";
    if(tags) tags.replaceChildren();

    renderActiveFrontPreview();
    if(shouldRunInitialAutoDetection) resetFrontPreviewScroll();
    const tocPreview=document.getElementById("tocPreview");
    if(tocPreview) tocPreview.replaceChildren();
    if(options.keepFrontPanelOpen) openPanel("frontPanel");
    else closePanel("frontPanel");
    closePanel("tocPanel");

    // 같은 파일에서 '앞부분 확인'을 다시 눌렀을 때는 자동 탐지를 반복하지 않는다.
    // 새 파일 구성이 처음 준비될 때만 기존의 최초 자동 탐지를 실행한다.
    if(shouldRunInitialAutoDetection){
      autoDetectChapters();
      initialAutoDetectedFileSetKey=currentFileSetKey;
      refreshSelectedLineClasses();
    }
    if(Array.isArray(options.restoreTocRefs)) restoreSelectedTocRefs(options.restoreTocRefs);
    else updateCount();
    log("앞부분 준비 완료");
  }

  async function editableReadAllTxtFiles(files){
    const items=await processedFiles(files);
    return items.map(item=>item.text).filter(Boolean).join("\n\n");
  }

  let deleteSearchQuery="";
  let deleteSearchMatches=[];
  let deleteSearchSelectedKey="";

  function escapeDeleteSearchHtml(value){
    return String(value || "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/\"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }

  function highlightDeleteSearchText(value,query){
    const text=String(value || "");
    const keyword=String(query || "");
    if(!keyword) return escapeDeleteSearchHtml(text);
    const quoteRegex=searchQueryRegex(keyword,true);
    if(quoteRegex){
      let html="";
      let start=0;
      let match;
      while((match=quoteRegex.exec(text))){
        html+=escapeDeleteSearchHtml(text.slice(start,match.index));
        html+=`<strong class="deleteSearchHit">${escapeDeleteSearchHtml(match[0])}</strong>`;
        start=match.index+match[0].length;
      }
      return html+escapeDeleteSearchHtml(text.slice(start));
    }
    let html="";
    let start=0;
    let index;
    while((index=text.indexOf(keyword,start))>=0){
      html+=escapeDeleteSearchHtml(text.slice(start,index));
      html+=`<strong class="deleteSearchHit">${escapeDeleteSearchHtml(keyword)}</strong>`;
      start=index+keyword.length;
    }
    return html+escapeDeleteSearchHtml(text.slice(start));
  }

  function deleteSearchMatchKey(fileKeyValue,sourceIndex){
    return `${String(fileKeyValue || "")}::${Number(sourceIndex)}`;
  }

  function collectDeleteSearchMatches(query){
    const keyword=String(query || "");
    if(!keyword) return [];
    const matches=[];
    previewFiles.forEach(item=>{
      item.sourceLines.forEach((line,sourceIndex)=>{
        if(item.deleted.has(sourceIndex)) return;
        if(matchesSearchQuery(line,keyword)){
          matches.push({
            key:item.key,
            file:item.file,
            sourceIndex,
            text:String(line)
          });
        }
      });
    });
    return matches;
  }

  function renderDeleteSearchResults(){
    const results=document.getElementById("deleteSearchResults");
    const summary=document.getElementById("deleteSearchSummary");
    const deleteText=document.getElementById("deleteSearchTextButton");
    const deleteLines=document.getElementById("deleteSearchLinesButton");
    if(!results || !summary || !deleteText || !deleteLines) return;

    results.replaceChildren();
    deleteText.disabled=!deleteSearchMatches.length;
    deleteLines.disabled=!deleteSearchMatches.length;

    if(!deleteSearchQuery){
      summary.textContent="";
      results.hidden=true;
      return;
    }

    const fileCount=new Set(deleteSearchMatches.map(match=>match.key)).size;
    summary.textContent=deleteSearchMatches.length
      ? `“${deleteSearchQuery}” · ${fileCount}개 파일 · ${deleteSearchMatches.length}줄`
      : `“${deleteSearchQuery}” 검색 결과가 없어요.`;
    results.hidden=false;

    if(!deleteSearchMatches.length){
      const empty=document.createElement("div");
      empty.className="deleteSearchEmpty";
      empty.textContent="일치하는 줄이 없어요.";
      results.appendChild(empty);
      return;
    }

    const grouped=new Map();
    deleteSearchMatches.forEach(match=>{
      if(!grouped.has(match.key)) grouped.set(match.key,[]);
      grouped.get(match.key).push(match);
    });

    previewFiles.forEach((item,index)=>{
      const matches=grouped.get(item.key);
      if(!matches || !matches.length) return;

      const group=document.createElement("section");
      group.className="deleteSearchBookGroup";
      const title=document.createElement("div");
      title.className="deleteSearchBookTitle";
      title.textContent=`${index+1}. ${titleFromFile(item.file.name)}`;
      title.title=item.file.name;
      group.appendChild(title);

      matches.forEach(match=>{
        const row=document.createElement("div");
        const selectionKey=deleteSearchMatchKey(match.key,match.sourceIndex);
        const isSelected=selectionKey===deleteSearchSelectedKey;
        row.className="deleteSearchRow"+(isSelected ? " selected" : "");
        row.dataset.searchLineText=match.text;
        row.dataset.deleteSearchSelection=selectionKey;
        row.setAttribute("aria-selected",String(isSelected));
        row.title="이 줄 선택";
        const number=document.createElement("div");
        number.className="deleteSearchLineNo";
        number.textContent=`L${match.sourceIndex+1}`;
        const text=document.createElement("div");
        text.className="deleteSearchLineText";
        text.innerHTML=highlightDeleteSearchText(match.text,deleteSearchQuery);
        const remove=document.createElement("button");
        remove.type="button";
        remove.className="deleteSearchRemove";
        remove.dataset.deleteSearchFileKey=match.key;
        remove.dataset.deleteSearchLine=String(match.sourceIndex);
        remove.title="이 줄만 삭제";
        remove.setAttribute("aria-label",`${match.sourceIndex+1}번째 줄 삭제`);
        remove.textContent="×";
        row.append(number,text,remove);
        group.appendChild(row);
      });
      results.appendChild(group);
    });
  }

  async function runDeleteLineSearch(){
    const input=document.getElementById("deleteLineSearch");
    const query=String(input ? input.value : "").trim();
    if(!previewFiles.length){
      const fileInput=document.getElementById("txtFile");
      if(fileInput && fileInput.files && fileInput.files.length){
        await editableLoadPreview({keepFrontPanelOpen:true});
      }
    }
    deleteSearchQuery=query;
    deleteSearchSelectedKey="";
    if(input) input.value=query;
    deleteSearchMatches=collectDeleteSearchMatches(deleteSearchQuery);
    renderDeleteSearchResults();
  }

  async function refreshAfterDeleteSearch(preservedTocRefs=captureSelectedTocRefs()){
    const query=deleteSearchQuery;
    await editableLoadPreview({keepFrontPanelOpen:true,restoreTocRefs:preservedTocRefs});
    deleteSearchQuery=query;
    const input=document.getElementById("deleteLineSearch");
    if(input) input.value=query;
    deleteSearchMatches=collectDeleteSearchMatches(query);
    if(!deleteSearchMatches.some(match=>deleteSearchMatchKey(match.key,match.sourceIndex)===deleteSearchSelectedKey)){
      deleteSearchSelectedKey="";
    }
    renderDeleteSearchResults();
  }

  async function deleteSearchLine(fileKeyValue,sourceIndex){
    const item=previewFiles.find(entry=>entry.key===fileKeyValue);
    if(!item || !Number.isInteger(sourceIndex) || sourceIndex<0 || sourceIndex>=item.sourceLines.length) return;
    const selectedRefsBefore=captureSelectedTocRefs();
    if(deleteSearchSelectedKey===deleteSearchMatchKey(fileKeyValue,sourceIndex)) deleteSearchSelectedKey="";
    deletedSetFor(item.file).add(sourceIndex);
    await refreshAfterDeleteSearch(selectedRefsBefore);
  }

  async function deleteAllSearchText(){
    if(!deleteSearchQuery || !deleteSearchMatches.length) return;
    const selectedRefsBefore=captureSelectedTocRefs();
    deleteSearchSelectedKey="";
    deleteSearchMatches.forEach(match=>{
      const item=previewFiles.find(entry=>entry.key===match.key);
      if(!item || item.deleted.has(match.sourceIndex)) return;
      const current=String(item.sourceLines[match.sourceIndex] || "");
      const next=removeLiteralText(current,deleteSearchQuery);
      if(next!==current) editedMapFor(item.file).set(match.sourceIndex,next);
    });
    await refreshAfterDeleteSearch(selectedRefsBefore);
  }

  async function deleteAllSearchLines(){
    if(!deleteSearchMatches.length) return;
    const selectedRefsBefore=captureSelectedTocRefs();
    deleteSearchSelectedKey="";
    const entries=[];
    deleteSearchMatches.forEach(match=>{
      const item=previewFiles.find(entry=>entry.key===match.key);
      if(item && !item.deleted.has(match.sourceIndex)){
        entries.push({key:item.key,sourceIndex:match.sourceIndex});
        deletedSetFor(item.file).add(match.sourceIndex);
      }
    });
    await refreshAfterDeleteSearch(selectedRefsBefore);
  }

  async function deleteActiveLine(sourceIndex){
    const active=previewFiles.find(item=>item.key===activePreviewFileKey);
    if(!active || !Number.isInteger(sourceIndex) || sourceIndex<0 || sourceIndex>=active.sourceLines.length) return;
    const selectedRefsBefore=captureSelectedTocRefs();
    deletedSetFor(active.file).add(sourceIndex);
    await editableLoadPreview({keepFrontPanelOpen:true,restoreTocRefs:selectedRefsBefore});
    if(deleteSearchQuery){
      deleteSearchMatches=collectDeleteSearchMatches(deleteSearchQuery);
      renderDeleteSearchResults();
    }
  }

  let originalApplyPatternForBookie=null;

  window.addEventListener("load",()=>{
    preserveOriginalTocTitles();
    loadPreview=editableLoadPreview;
    readAllTxtFiles=editableReadAllTxtFiles;
    originalApplyPatternForBookie=(typeof applyPattern==="function") ? applyPattern : null;
    applyPattern=applyChapterSearchByMode;
    selectPattern=selectAutoChapterPattern;
    removePatternTag=removePatternTagForBookie;
    if(typeof removeTocIndex==="function"){
      const originalRemoveTocIndex=removeTocIndex;
      removeTocIndex=function(lineIndex){
        const ref=tocRefFromCombinedIndex(Number(lineIndex));
        if(ref) directSelectionRefKeys.delete(ref.refKey);
        return originalRemoveTocIndex(lineIndex);
      };
    }
    if(typeof clearSelection==="function"){
      const originalClearSelection=clearSelection;
      clearSelection=function(){
        directSelectionRefKeys.clear();
        patternAddedRefKeysBySource.clear();
        return originalClearSelection();
      };
    }

    const host=document.getElementById("frontPreview");
    if(host){
      host.addEventListener("click",event=>{
        const tab=event.target.closest("[data-front-book-key]");
        if(tab){
          activePreviewFileKey=tab.dataset.frontBookKey || "";
          renderActiveFrontPreview();
          resetFrontPreviewScroll();
          return;
        }

        const remove=event.target.closest("[data-delete-front-line]");
        if(remove){
          event.preventDefault();
          event.stopPropagation();
          deleteActiveLine(Number(remove.dataset.deleteFrontLine));
          return;
        }

        const row=event.target.closest("[data-combined-line]");
        if(row){
          const combinedLine=Number(row.dataset.combinedLine);
          if(Number.isInteger(combinedLine) && typeof selectPattern==="function"){
            selectPattern(combinedLine);
            refreshSelectedLineClasses();
          }
        }
      });
    }

    const deleteSearchInput=document.getElementById("deleteLineSearch");
    const deleteSearchButton=document.getElementById("deleteLineSearchButton");
    const deleteSearchTextButton=document.getElementById("deleteSearchTextButton");
    const deleteSearchLinesButton=document.getElementById("deleteSearchLinesButton");
    const deleteSearchResults=document.getElementById("deleteSearchResults");
    const openFrontPreviewButton=document.getElementById("openFrontPreviewButton");
    const rerunAutoTocButton=document.getElementById("rerunAutoTocButton");

    if(deleteSearchInput){
      deleteSearchInput.addEventListener("keydown",event=>{
        if(event.key!=="Enter" || event.isComposing || event.repeat) return;
        event.preventDefault();
        runDeleteLineSearch();
      });
      deleteSearchInput.addEventListener("input",()=>{
        if(String(deleteSearchInput.value || "").trim()===deleteSearchQuery) return;
        if(deleteSearchTextButton) deleteSearchTextButton.disabled=true;
        if(deleteSearchLinesButton) deleteSearchLinesButton.disabled=true;
      });
    }
    if(deleteSearchButton) deleteSearchButton.addEventListener("click",runDeleteLineSearch);
    if(deleteSearchTextButton) deleteSearchTextButton.addEventListener("click",deleteAllSearchText);
    if(deleteSearchLinesButton) deleteSearchLinesButton.addEventListener("click",deleteAllSearchLines);
    if(deleteSearchResults){
      deleteSearchResults.addEventListener("click",event=>{
        const remove=event.target.closest("[data-delete-search-line]");
        if(remove){
          event.preventDefault();
          event.stopPropagation();
          deleteSearchLine(remove.dataset.deleteSearchFileKey || "",Number(remove.dataset.deleteSearchLine));
          return;
        }

        const row=event.target.closest("[data-search-line-text]");
        if(!row || !deleteSearchInput) return;
        const selectionKey=row.dataset.deleteSearchSelection || "";
        deleteSearchSelectedKey=deleteSearchSelectedKey===selectionKey ? "" : selectionKey;
        deleteSearchInput.value=row.dataset.searchLineText || "";
        renderDeleteSearchResults();
        if(String(deleteSearchInput.value || "").trim()!==deleteSearchQuery){
          if(deleteSearchTextButton) deleteSearchTextButton.disabled=true;
          if(deleteSearchLinesButton) deleteSearchLinesButton.disabled=true;
        }
      });
    }
    if(openFrontPreviewButton) openFrontPreviewButton.addEventListener("click",openFrontPreviewOnly);
    if(rerunAutoTocButton) rerunAutoTocButton.addEventListener("click",rerunAutoTocDetection);

    if(typeof resetWorkState==="function"){
      const originalResetWorkState=resetWorkState;
      resetWorkState=function(options={}){
        const keepingFiles=!!options.keepSelectedFiles;
        const fullResetForNewFiles=!!options.fullResetForNewFiles;
        patternAddedRefKeysBySource.clear();
        directSelectionRefKeys.clear();
            if(!keepingFiles || fullResetForNewFiles){
          deletedLinesByFile.clear();
          editedLinesByFile.clear();
          previewFiles=[];
          activePreviewFileKey="";
          initialAutoDetectedFileSetKey="";
          resetFrontPreviewScroll();
          deleteSearchQuery="";
          deleteSearchMatches=[];
          deleteSearchSelectedKey="";
          const input=document.getElementById("deleteLineSearch");
          if(input) input.value="";
          renderDeleteSearchResults();
        }
        return originalResetWorkState(options);
      };
    }
  });

  window.BookieEditableFrontPreview={
    fileKey,
    deletedLinesByFile,
    editedLinesByFile,
    removeLiteralText,
    highlightDeleteSearchText,
    quoteShortcutSearchSource,
    matchesSearchQuery,
    processedFile,
    processedFiles,
    removeMergeCopyrightBlocks,
    findCopyrightRangeInWindow,
    preserveOriginalTocTitles,
    buildAutoChapterRegex,
    toggleIdenticalFrontLineSelection,
    selectAutoChapterPattern,
    combinedFileEndForLineIndex,
    renderActiveFrontPreview,
    getPreviewFiles(){
      return previewFiles.map((item,index)=>({
        key:item.key,
        fileName:item.file?.name || `파일 ${index+1}`,
        fileIndex:index,
        text:String(item.text || ""),
        keptLines:[...(item.keptLines || [])]
      }));
    }
  };
})();
