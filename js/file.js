// Bookie Step 4 - file loading and preview
let activeCoverObjectUrl = "";

function titleFromFile(name){return name.replace(/\.txt$/i,"");}

function titleFromFiles(files){
  if(files.length === 1) return titleFromFile(files[0].name);
  return titleFromFile(files[0].name) + "_합본";
}

function sortedTxtFiles(files){
  return [...files].sort((a,b)=>a.name.localeCompare(b.name, "ko", {numeric:true}));
}

function selectedTxtFileNames(files){
  return [...files].map(file=>file.name);
}

function escapeFileName(name){
  return String(name)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/\"/g,"&quot;")
    .replace(/'/g,"&#39;");
}

function setTxtInputFiles(files){
  const input=document.getElementById("txtFile");
  if(!input) return;
  const dt=new DataTransfer();
  files.forEach(file=>dt.items.add(file));
  input.files=dt.files;
}

function updateSelectedTxtFileNames(files){
  const el=document.getElementById("fileCountText");
  if(!el) return;

  const names=selectedTxtFileNames(files);
  if(!names.length){
    el.innerHTML="TXT 여러 개 선택 가능 · 파일명 순서대로 합쳐져요";
    el.removeAttribute("title");
    return;
  }

  el.innerHTML=names.map((name,index)=>
    `<div class="selectedFileRow" data-file-index="${index}">`+
      `<span class="selectedFileDrag" aria-hidden="true">⋮⋮</span>`+
      `<span class="selectedFileName">${escapeFileName(name)}</span>`+
      `<button type="button" class="selectedFileRemove" data-remove-file="${index}" aria-label="${escapeFileName(name)} 삭제">×</button>`+
    `</div>`
  ).join("");
  el.title=names.join("\n");
}

function refreshTxtFiles(files){
  setTxtInputFiles(files);
  resetWorkState({keepSelectedFiles:true, keepCover:true, keepMetadata:true, keepFont:true});
  updateSelectedTxtFileNames(files);
  if(files.length) loadPreview();
  else if(typeof BookieFontSettings!=="undefined") BookieFontSettings.refreshPreview("");
}

function removeSelectedTxtFile(index){
  const files=[...document.getElementById("txtFile").files];
  if(index<0 || index>=files.length) return;
  files.splice(index,1);
  refreshTxtFiles(files);
}

function moveSelectedTxtFile(fromIndex,toIndex){
  const files=[...document.getElementById("txtFile").files];
  if(fromIndex<0 || toIndex<0 || fromIndex>=files.length || toIndex>=files.length || fromIndex===toIndex) return;
  const [moved]=files.splice(fromIndex,1);
  files.splice(toIndex,0,moved);
  refreshTxtFiles(files);
}

async function readAllTxtFiles(files){
  const ordered = [...files];
  const texts = [];

  for(const f of ordered){
    let t = await f.text();
    t = t.replace(/\r\n/g,"\n").replace(/\r/g,"\n").trim();
    if(t) texts.push(t);
  }

  return texts.join("\n\n");
}

function isImageFile(file){
  if(!file) return false;
  if(file.type && file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|bmp|svg|avif)$/i.test(file.name || "");
}

function setCoverInputFile(file){
  const input=document.getElementById("coverFile");
  if(!input || !file) return;
  const dt=new DataTransfer();
  dt.items.add(file);
  input.files=dt.files;
}

function releaseCoverObjectUrl(){
  if(activeCoverObjectUrl){
    URL.revokeObjectURL(activeCoverObjectUrl);
    activeCoverObjectUrl="";
  }
}

function updateCoverPreview(file){
  if(!file) return;
  const img=document.getElementById("coverPreview");
  const name=document.getElementById("coverFileName");
  if(img){
    releaseCoverObjectUrl();
    activeCoverObjectUrl=URL.createObjectURL(file);
    img.src=activeCoverObjectUrl;
    img.style.display="block";
  }
  if(name){
    name.textContent=`📄 ${file.name}`;
    name.title=file.name;
  }
}

function applyCoverFile(file){
  if(!isImageFile(file)){
    alert("표지는 이미지 파일만 넣어주세요!");
    return false;
  }
  setCoverInputFile(file);
  updateCoverPreview(file);
  return true;
}

document.getElementById("coverFile").addEventListener("change",e=>{
  const file=e.target.files[0];
  if(!file) return;
  if(!isImageFile(file)){
    e.target.value="";
    alert("표지는 이미지 파일만 넣어주세요!");
    return;
  }
  updateCoverPreview(file);
});

function resetWorkState(options={}){
  const keepSelectedFiles = !!options.keepSelectedFiles;
  const keepCover = !!options.keepCover;
  const keepMetadata = !!options.keepMetadata;
  const keepFont = !!options.keepFont;
  const restoreDefaults = !!options.restoreDefaults;

  fileText="";
  lines=[];
  lineStarts=[];
  selectedIndexes=[];
  tocConfidence={};
  appliedPatterns=[];
  footnoteCounter=0;
  footnoteList=[];
  dragIndex=null;
  selectedFileDragIndex=null;
  detectedParagraphGap=2;

  ["frontPreview","tocPreview","patternTags","log"].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.replaceChildren();
  });

  if(typeof clearProgress === "function") clearProgress();
  else {
    const progress=document.getElementById("progressBox");
    if(progress){
      progress.replaceChildren();
      progress.style.display="none";
      progress.className="progressBox";
    }
  }

  ["chapterPattern"].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.value="";
  });
  if(!keepMetadata){
    ["bookTitle","authorName"].forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.value="";
    });
  }

  if(!keepCover){
    releaseCoverObjectUrl();

    const coverInput=document.getElementById("coverFile");
    if(coverInput) coverInput.value="";

    const coverPreview=document.getElementById("coverPreview");
    if(coverPreview){
      coverPreview.removeAttribute("src");
      coverPreview.style.display="none";
    }

    const coverFileName=document.getElementById("coverFileName");
    if(coverFileName){
      coverFileName.textContent="JPG · PNG · WEBP 등 이미지 파일";
      coverFileName.removeAttribute("title");
    }
  }

  if(!keepFont && typeof BookieFontSettings!=="undefined"){
    BookieFontSettings.reset();
  }

  const lightbox=document.getElementById("coverLightbox");
  const lightboxImage=document.getElementById("coverLightboxImage");
  if(lightbox){
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden","true");
  }
  if(lightboxImage) lightboxImage.removeAttribute("src");
  document.body.classList.remove("coverLightboxOpen");

  const frontPanel=document.getElementById("frontPanel");
  const tocPanel=document.getElementById("tocPanel");
  if(frontPanel) frontPanel.classList.add("closed");
  if(tocPanel) tocPanel.classList.add("closed");

  const frontArrow=document.getElementById("frontArrow");
  const tocArrow=document.getElementById("tocArrow");
  if(frontArrow) frontArrow.textContent="▸";
  if(tocArrow) tocArrow.textContent="▸";

  const fileCount=document.getElementById("fileCountText");
  if(fileCount){
    fileCount.innerHTML="TXT 여러 개 선택 가능 · 파일명 순서대로 합쳐져요";
    fileCount.removeAttribute("title");
  }

  const txt=document.getElementById("txtFile");
  if(txt && !keepSelectedFiles) txt.value="";

  if(restoreDefaults){
    const defaults={
      checkDialogue:false,
      enableFb:false,
      checkSpaceClean:true,
      autoDetectToc:true,
      enableFootnotes:false,
      enableGameMode:false,
      gameBracketSquare:true,
      gameBracketRound:true,
      chapterGeneralSearch:false,
      includeHanjaToc:false
    };
    Object.entries(defaults).forEach(([id,checked])=>{
      const el=document.getElementById(id);
      if(el) el.checked=checked;
    });

    const splitMode=document.getElementById("chapterSplitMode");
    if(splitMode) splitMode.value="1";
    CHAPTERS_PER_FILE=1;

    if(typeof BookieGameModeSettings!=="undefined"){
      BookieGameModeSettings.reset();
    }
  }

  if(typeof updateGameModeControls==="function") updateGameModeControls();
  if(typeof BookieBoxWrapSettings!=="undefined") BookieBoxWrapSettings.reset();
  if(typeof BookieParagraphBreakSettings!=="undefined") BookieParagraphBreakSettings.reset();

  updateCount();
}

let resetConfirmLastFocus = null;

function closeResetConfirm(){
  const backdrop=document.getElementById("resetConfirmBackdrop");
  if(!backdrop) return;
  backdrop.classList.remove("is-open");
  backdrop.setAttribute("aria-hidden","true");
  document.body.classList.remove("has-bookie-modal");
  if(resetConfirmLastFocus && typeof resetConfirmLastFocus.focus === "function") {
    resetConfirmLastFocus.focus();
  }
  resetConfirmLastFocus=null;
}

function openResetConfirm(){
  const backdrop=document.getElementById("resetConfirmBackdrop");
  const cancelButton=document.getElementById("resetConfirmCancel");
  if(!backdrop) {
    resetWorkState({restoreDefaults:true});
    return;
  }
  resetConfirmLastFocus=document.activeElement;
  backdrop.classList.add("is-open");
  backdrop.setAttribute("aria-hidden","false");
  document.body.classList.add("has-bookie-modal");
  requestAnimationFrame(()=>cancelButton?.focus());
}

function resetBookie(){
  const hasWork = !!(
    document.getElementById("txtFile")?.files?.length ||
    document.getElementById("coverFile")?.files?.length ||
    fileText || lines.length || selectedIndexes.length ||
    document.getElementById("bookTitle")?.value ||
    document.getElementById("authorName")?.value ||
    document.getElementById("chapterPattern")?.value ||
    document.getElementById("log")?.textContent ||
    document.getElementById("progressBox")?.textContent ||
    (typeof BookieFontSettings!=="undefined" && BookieFontSettings.hasState()) ||
    (typeof BookieGameModeSettings!=="undefined" && BookieGameModeSettings.hasState()) ||
    (typeof BookieBoxWrapSettings!=="undefined" && BookieBoxWrapSettings.hasState()) ||
    (typeof BookieParagraphBreakSettings!=="undefined" && BookieParagraphBreakSettings.hasState())
  );

  if(!hasWork){
    resetWorkState({restoreDefaults:true});
    return;
  }
  openResetConfirm();
}

document.getElementById("txtFile").addEventListener("change",e=>{
  const files=sortedTxtFiles([...e.target.files]);
  setTxtInputFiles(files);

  if(!files.length){
    resetWorkState({keepSelectedFiles:true, keepCover:true, keepFont:true});
    if(typeof BookieFontSettings!=="undefined") BookieFontSettings.refreshPreview("");
    return;
  }

  resetWorkState({keepSelectedFiles:true, keepCover:true, keepFont:true});

  updateSelectedTxtFileNames(files);

  loadPreview();
});

async function loadPreview(){
  const files=[...document.getElementById("txtFile").files];
  if(!files.length){
    alert("TXT 넣어주세요!");
    return;
  }

  document.getElementById("log").textContent="";
  log(files.length + "개 TXT 읽는 중...");

  fileText=await readAllTxtFiles(files);
  if(typeof BookieParagraphBreakSettings!=="undefined"){
    BookieParagraphBreakSettings.refreshCandidates(fileText);
  }

  const titleInput=document.getElementById("bookTitle");

  if(titleInput){
    titleInput.value=titleFromFiles(files);
  }

  detectParagraphStyle(fileText);

  lines=fileText.split("\n");
  buildLineStarts(fileText);
  selectedIndexes=[];
  tocConfidence={};
  document.getElementById("chapterPattern").value="";
  document.getElementById("patternTags").innerHTML="";

  const html=[];
  const n=Math.min(lines.length,120);
  let visibleLineNumber=0;
  for(let i=0;i<n;i++){
    if(!lines[i].trim()) continue;

    visibleLineNumber++;
    html.push(`<div class="line" data-i="${i}" onclick="selectPattern(${i})"><div class="lineNo">L${visibleLineNumber}</div><div class="lineText">${esc(lines[i])}</div></div>`);
  }

  document.getElementById("frontPreview").innerHTML=html.join("");
  document.getElementById("tocPreview").innerHTML="";
  document.getElementById("frontPanel").classList.add("closed");
  document.getElementById("tocPanel").classList.add("closed");
  document.getElementById("frontArrow").textContent="▸";
  document.getElementById("tocArrow").textContent="▸";

  if(typeof BookieFontSettings!=="undefined"){
    BookieFontSettings.refreshPreview(fileText);
  }

  autoDetectChapters();

  updateCount();
  log("앞부분 준비 완료");
}

const selectedFileList=document.getElementById("fileCountText");
let selectedFileDragIndex=null;
let selectedFileDragPointerId=null;
let selectedFileDragRow=null;
let selectedFileDragMoved=false;
let selectedFileDragGhost=null;
let selectedFileDragOffsetX=0;
let selectedFileDragOffsetY=0;

function selectedFileRows(){
  return [...selectedFileList.querySelectorAll(".selectedFileRow")];
}

function createSelectedFileDragGhost(row,event){
  const rect=row.getBoundingClientRect();
  const ghost=row.cloneNode(true);
  ghost.removeAttribute("data-file-index");
  ghost.classList.remove("dragging");
  ghost.classList.add("selectedFileDragGhost");
  ghost.setAttribute("aria-hidden","true");
  ghost.querySelectorAll("button").forEach(button=>button.tabIndex=-1);
  ghost.style.width=`${rect.width}px`;
  ghost.style.height=`${rect.height}px`;

  selectedFileDragOffsetX=event.clientX-rect.left;
  selectedFileDragOffsetY=event.clientY-rect.top;
  selectedFileDragGhost=ghost;
  document.body.appendChild(ghost);
  moveSelectedFileDragGhost(event);
}

function moveSelectedFileDragGhost(event){
  if(!selectedFileDragGhost) return;
  const x=event.clientX-selectedFileDragOffsetX;
  const y=event.clientY-selectedFileDragOffsetY;
  selectedFileDragGhost.style.transform=`translate3d(${x}px,${y}px,0) scale(1.01)`;
}

function removeSelectedFileDragGhost(){
  selectedFileDragGhost?.remove();
  selectedFileDragGhost=null;
  selectedFileDragOffsetX=0;
  selectedFileDragOffsetY=0;
}

function animateSelectedFileRows(previousTops){
  selectedFileRows().forEach(row=>{
    if(row===selectedFileDragRow) return;
    const previousTop=previousTops.get(row);
    if(previousTop===undefined || typeof row.animate!=="function") return;
    const delta=previousTop-row.getBoundingClientRect().top;
    if(Math.abs(delta)<1) return;
    row.animate(
      [{transform:`translateY(${delta}px)`},{transform:"translateY(0)"}],
      {duration:150,easing:"cubic-bezier(.2,.8,.2,1)"}
    );
  });
}

function finishSelectedFileReorder({commit}){
  if(selectedFileDragPointerId===null) return;

  const pointerId=selectedFileDragPointerId;
  const row=selectedFileDragRow;
  const fromIndex=selectedFileDragIndex;
  const toIndex=row ? selectedFileRows().indexOf(row) : -1;
  const moved=selectedFileDragMoved;

  selectedFileDragPointerId=null;
  selectedFileDragRow=null;
  selectedFileDragIndex=null;
  selectedFileDragMoved=false;

  removeSelectedFileDragGhost();
  row?.classList.remove("dragging");
  document.body.classList.remove("is-file-reordering");

  if(selectedFileList.hasPointerCapture?.(pointerId)){
    try{selectedFileList.releasePointerCapture(pointerId);}catch(_error){}
  }

  if(commit && fromIndex!==null && toIndex>=0 && fromIndex!==toIndex){
    moveSelectedTxtFile(fromIndex,toIndex);
    return;
  }

  if(moved){
    updateSelectedTxtFileNames([...document.getElementById("txtFile").files]);
  }
}

selectedFileList.addEventListener("click",e=>{
  const button=e.target.closest("[data-remove-file]");
  if(!button) return;
  e.preventDefault();
  e.stopPropagation();
  removeSelectedTxtFile(Number(button.dataset.removeFile));
});

selectedFileList.addEventListener("pointerdown",e=>{
  if(selectedFileDragPointerId!==null || !e.isPrimary || e.button!==0) return;
  if(e.target.closest("[data-remove-file]")) return;

  const row=e.target.closest("[data-file-index]");
  if(!row) return;
  if(e.pointerType==="touch" && !e.target.closest(".selectedFileDrag")) return;

  e.preventDefault();
  selectedFileDragIndex=Number(row.dataset.fileIndex);
  selectedFileDragPointerId=e.pointerId;
  selectedFileDragRow=row;
  selectedFileDragMoved=false;
  row.classList.add("dragging");
  document.body.classList.add("is-file-reordering");
  createSelectedFileDragGhost(row,e);
  // Capture on the stable list container. Capturing on the row itself can be
  // lost when that row is moved in the DOM during reordering.
  try{selectedFileList.setPointerCapture(e.pointerId);}catch(_error){}
  e.stopPropagation();
});

selectedFileList.addEventListener("pointermove",e=>{
  if(e.pointerId!==selectedFileDragPointerId || !selectedFileDragRow) return;

  e.preventDefault();
  e.stopPropagation();
  moveSelectedFileDragGhost(e);

  const rows=selectedFileRows();
  const currentIndex=rows.indexOf(selectedFileDragRow);
  if(currentIndex<0) return;
  const otherRows=rows.filter(row=>row!==selectedFileDragRow);
  const nextRow=otherRows.find(row=>{
    const rect=row.getBoundingClientRect();
    return e.clientY<rect.top+(rect.height/2);
  }) || null;

  if(nextRow===selectedFileDragRow.nextElementSibling) return;
  if(!nextRow && selectedFileList.lastElementChild===selectedFileDragRow) return;

  const previousTops=new Map(rows.map(row=>[row,row.getBoundingClientRect().top]));
  if(nextRow){
    selectedFileList.insertBefore(selectedFileDragRow,nextRow);
  }else{
    selectedFileList.appendChild(selectedFileDragRow);
  }
  selectedFileDragMoved=true;
  animateSelectedFileRows(previousTops);
});

selectedFileList.addEventListener("pointerup",e=>{
  if(e.pointerId!==selectedFileDragPointerId) return;
  e.preventDefault();
  e.stopPropagation();
  finishSelectedFileReorder({commit:true});
});

selectedFileList.addEventListener("pointercancel",e=>{
  if(e.pointerId!==selectedFileDragPointerId) return;
  finishSelectedFileReorder({commit:false});
});

selectedFileList.addEventListener("lostpointercapture",e=>{
  if(e.pointerId!==selectedFileDragPointerId) return;
  finishSelectedFileReorder({commit:false});
});

selectedFileList.addEventListener("dragstart",e=>{
  if(e.target.closest("[data-file-index]")) e.preventDefault();
});

const resetButton=document.getElementById("resetButton");

if(resetButton) resetButton.addEventListener("click",resetBookie);

const resetConfirmBackdrop=document.getElementById("resetConfirmBackdrop");
const resetConfirmCancel=document.getElementById("resetConfirmCancel");
const resetConfirmOk=document.getElementById("resetConfirmOk");
const resetConfirmClose=document.getElementById("resetConfirmClose");

resetConfirmCancel?.addEventListener("click",closeResetConfirm);
resetConfirmClose?.addEventListener("click",closeResetConfirm);
resetConfirmOk?.addEventListener("click",()=>{
  closeResetConfirm();
  resetWorkState({restoreDefaults:true});
});
resetConfirmBackdrop?.addEventListener("click",event=>{
  if(event.target===resetConfirmBackdrop) closeResetConfirm();
});
document.addEventListener("keydown",event=>{
  if(event.key==="Escape" && resetConfirmBackdrop?.classList.contains("is-open")){
    closeResetConfirm();
  }
});


const coverDropZone=document.getElementById("coverDropZone");

["dragenter","dragover"].forEach(eventName=>{
  coverDropZone.addEventListener(eventName,e=>{
    e.preventDefault();
    e.stopPropagation();
    coverDropZone.classList.add("dragover");
    if(e.dataTransfer) e.dataTransfer.dropEffect="copy";
  });
});

["dragleave","drop"].forEach(eventName=>{
  coverDropZone.addEventListener(eventName,e=>{
    e.preventDefault();
    e.stopPropagation();
    coverDropZone.classList.remove("dragover");
  });
});

coverDropZone.addEventListener("drop",e=>{
  const file=[...e.dataTransfer.files].find(isImageFile);
  if(!file){
    alert("표지는 이미지 파일만 넣어주세요!");
    return;
  }
  applyCoverFile(file);
});

const dropZone=document.getElementById("dropZone");
const txtInput=document.getElementById("txtFile");

["dragenter","dragover"].forEach(eventName=>{
  dropZone.addEventListener(eventName,e=>{
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add("dragover");
  });
});

["dragleave","drop"].forEach(eventName=>{
  dropZone.addEventListener(eventName,e=>{
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove("dragover");
  });
});

dropZone.addEventListener("drop",e=>{
  const files=[...e.dataTransfer.files].filter(f=>
    f.name.toLowerCase().endsWith(".txt")
  );

  if(!files.length){
    alert("TXT 파일만 넣어주세요!");
    return;
  }

  const dt=new DataTransfer();

  files.forEach(f=>dt.items.add(f));

  txtInput.files=dt.files;

  txtInput.dispatchEvent(new Event("change"));
});
