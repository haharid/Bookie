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
