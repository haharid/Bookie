// User-supplied EPUB font selection, preview, and export helpers.
// Only the selected TTF/OTF file is embedded in the generated EPUB.

const BookieFontSettings=(()=>{
  const EPUB_FAMILY="BookieUserFont";
  const PREVIEW_LIMIT=20;

  let entries=[];
  let selectedId="";
  let nextId=1;
  let previewFace=null;
  let previewToken=0;
  let initialized=false;

  function byId(id){
    return typeof document!=="undefined" ? document.getElementById(id) : null;
  }

  function escapeHtml(value){
    return String(value || "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/\"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }

  function fontExtension(fileOrName){
    const name=typeof fileOrName==="string" ? fileOrName : fileOrName?.name;
    const match=String(name || "").trim().match(/\.([^.]+)$/);
    const ext=match ? match[1].toLowerCase() : "";
    return ext==="ttf" || ext==="otf" ? ext : "";
  }

  function fontDescriptor(file){
    const ext=fontExtension(file);
    if(!ext) return null;
    const filename=`bookie-user-font.${ext}`;
    return {
      file,
      name:String(file.name || filename),
      ext,
      href:`fonts/${filename}`,
      zipPath:`fonts/${filename}`,
      mediaType:ext==="ttf" ? "font/ttf" : "font/otf",
      format:ext==="ttf" ? "truetype" : "opentype",
      family:EPUB_FAMILY
    };
  }

  function makeEpubCss(baseCss,descriptor){
    if(!descriptor) return String(baseCss || "");
    return `@font-face {
  font-family: "${EPUB_FAMILY}";
  src: url("${descriptor.href}") format("${descriptor.format}");
  font-weight: normal;
  font-style: normal;
}

html, body {
  font-family: "${EPUB_FAMILY}";
}

${String(baseCss || "")}`;
  }

  function previewLines(source){
    const lines=String(source || "")
      .replace(/\r\n?/g,"\n")
      .split("\n")
      .map(line=>line.trim())
      .filter(Boolean)
      .slice(0,PREVIEW_LIMIT);
    return lines;
  }

  function selectedEntry(){
    return entries.find(entry=>entry.id===selectedId) || null;
  }

  function selectedForEpub(){
    const entry=selectedEntry();
    return entry ? fontDescriptor(entry.file) : null;
  }

  function setMessage(message,isError=false){
    const target=byId("fontMessage");
    if(!target) return;
    target.textContent=message || "";
    target.classList.toggle("is-error",!!isError);
  }

  function sizeLabel(file){
    const bytes=Number(file?.size) || 0;
    if(bytes>=1024*1024) return `${(bytes/(1024*1024)).toFixed(1)} MB`;
    if(bytes>=1024) return `${Math.max(1,Math.round(bytes/1024))} KB`;
    return `${bytes} B`;
  }

  function renderList(){
    const list=byId("fontFileList");
    if(!list) return;

    const defaultSelected=!selectedEntry();
    const defaultRow=`<div class="fontFileItem${defaultSelected ? " is-selected" : ""}">`+
      `<button type="button" class="fontChoice" data-select-default-font aria-pressed="${defaultSelected}">`+
        `<span class="fontChoiceCheck" aria-hidden="true">${defaultSelected ? "✓" : ""}</span>`+
        `<span class="fontChoiceText"><strong>리더기 기본 글꼴</strong><small>글꼴 파일을 EPUB에 넣지 않아요</small></span>`+
      `</button>`+
    `</div>`;

    const rows=entries.map(entry=>{
      const selected=entry.id===selectedId;
      return `<div class="fontFileItem${selected ? " is-selected" : ""}" data-font-entry="${entry.id}">`+
        `<button type="button" class="fontChoice" data-select-font="${entry.id}" aria-pressed="${selected}">`+
          `<span class="fontChoiceCheck" aria-hidden="true">${selected ? "✓" : ""}</span>`+
          `<span class="fontChoiceText"><strong>${escapeHtml(entry.file.name)}</strong><small>${entry.ext.toUpperCase()} · ${sizeLabel(entry.file)}</small></span>`+
        `</button>`+
        `<button type="button" class="fontRemove" data-remove-font="${entry.id}" aria-label="${escapeHtml(entry.file.name)} 삭제">×</button>`+
      `</div>`;
    }).join("");

    list.innerHTML=defaultRow+rows;
  }

  function renderPreviewText(source){
    const preview=byId("fontPreview");
    if(!preview) return;
    preview.replaceChildren();
    const lines=previewLines(source);
    if(!lines.length){
      const empty=document.createElement("div");
      empty.className="fontPreviewEmpty";
      empty.textContent="TXT를 넣으면 실제 앞부분 미리보기가 표시돼요.";
      preview.appendChild(empty);
      return;
    }
    lines.forEach((line,index)=>{
      const row=document.createElement("p");
      row.className="fontPreviewLine";
      row.dataset.previewLine=String(index+1);
      row.textContent=line;
      preview.appendChild(row);
    });
  }

  function clearPreviewFace(){
    previewToken++;
    const preview=byId("fontPreview");
    if(preview) preview.style.removeProperty("font-family");
    if(previewFace && typeof document!=="undefined" && document.fonts?.delete){
      try{document.fonts.delete(previewFace);}catch(_error){}
    }
    previewFace=null;
  }

  async function applyPreviewFont(){
    const entry=selectedEntry();
    const preview=byId("fontPreview");
    clearPreviewFace();
    const token=previewToken;
    if(!entry || !preview){
      if(entry===null) setMessage(entries.length ? "리더기 기본 글꼴을 사용해요." : "TTF 또는 OTF 파일을 추가해 주세요.");
      return false;
    }

    if(typeof FontFace==="undefined" || !document.fonts?.add){
      setMessage("이 브라우저에서는 글꼴 미리보기를 지원하지 않아요.",true);
      return false;
    }

    try{
      const family=`BookiePreviewFont${entry.id.replace(/[^a-z0-9_-]/gi,"")}`;
      const face=new FontFace(family,await entry.file.arrayBuffer());
      await face.load();
      if(token!==previewToken) return false;
      document.fonts.add(face);
      previewFace=face;
      preview.style.fontFamily=`"${family}"`;
      setMessage(`${entry.file.name} 글꼴을 적용했어요.`);
      return true;
    }catch(_error){
      if(token===previewToken) setMessage("글꼴 파일을 미리볼 수 없어요. 다른 파일을 확인해 주세요.",true);
      return false;
    }
  }

  async function refreshPreview(source){
    const text=source===undefined && typeof fileText!=="undefined" ? fileText : source;
    renderPreviewText(text);
    return applyPreviewFont();
  }

  async function select(id){
    const next=String(id || "");
    if(next && !entries.some(entry=>entry.id===next)) return false;
    selectedId=next;
    renderList();
    await refreshPreview();
    return true;
  }

  async function addFiles(files){
    const incoming=[...(files || [])];
    const accepted=[];
    const rejected=[];
    let latestId="";

    incoming.forEach(file=>{
      const ext=fontExtension(file);
      if(!ext){
        rejected.push(file?.name || "이름 없는 파일");
        return;
      }

      const key=String(file.name || "").toLocaleLowerCase("ko");
      const existing=entries.find(entry=>entry.key===key);
      if(existing){
        existing.file=file;
        existing.ext=ext;
        latestId=existing.id;
      }else{
        const entry={id:`font_${nextId++}`,key,file,ext};
        entries.push(entry);
        latestId=entry.id;
      }
      accepted.push(file.name);
    });

    if(latestId) selectedId=latestId;
    renderList();
    await refreshPreview();

    if(rejected.length){
      setMessage(`TTF/OTF가 아닌 파일은 제외했어요: ${rejected.join(", ")}`,true);
    }else if(accepted.length){
      const entry=selectedEntry();
      if(entry) setMessage(`${entry.file.name} 글꼴을 적용했어요.`);
    }
    return {accepted,rejected,selectedId};
  }

  async function remove(id){
    const target=String(id || "");
    const index=entries.findIndex(entry=>entry.id===target);
    if(index<0) return false;
    const [removed]=entries.splice(index,1);
    if(selectedId===target) selectedId="";
    renderList();
    await refreshPreview();
    setMessage(`${removed.file.name} 글꼴을 목록에서 삭제했어요.`);
    return true;
  }

  function open(){
    const settings=byId("fontSettings");
    if(!settings) return;
    settings.hidden=false;
    settings.setAttribute("aria-hidden","false");
    byId("fontToggle")?.setAttribute("aria-expanded","true");
    const arrow=byId("fontArrow");
    if(arrow) arrow.textContent="▾";
    refreshPreview();
  }

  function close(){
    const settings=byId("fontSettings");
    if(!settings) return;
    settings.hidden=true;
    settings.setAttribute("aria-hidden","true");
    byId("fontToggle")?.setAttribute("aria-expanded","false");
    const arrow=byId("fontArrow");
    if(arrow) arrow.textContent="▸";
  }

  function toggle(){
    const settings=byId("fontSettings");
    if(!settings) return;
    if(settings.hidden) open();
    else close();
  }

  function reset(){
    entries=[];
    selectedId="";
    nextId=1;
    const input=byId("fontFile");
    if(input) input.value="";
    clearPreviewFace();
    renderList();
    renderPreviewText("");
    close();
    setMessage("TTF 또는 OTF 파일을 추가해 주세요.");
  }

  function hasState(){
    return entries.length>0 || !!selectedId;
  }

  function init(){
    if(initialized || typeof document==="undefined") return;
    initialized=true;

    byId("fontToggle")?.addEventListener("click",toggle);
    byId("fontFile")?.addEventListener("change",async event=>{
      await addFiles(event.target.files);
      event.target.value="";
    });
    byId("fontFileList")?.addEventListener("click",event=>{
      const removeButton=event.target.closest?.("[data-remove-font]");
      if(removeButton){
        event.preventDefault();
        remove(removeButton.dataset.removeFont);
        return;
      }
      const selectButton=event.target.closest?.("[data-select-font]");
      if(selectButton){
        select(selectButton.dataset.selectFont);
        return;
      }
      if(event.target.closest?.("[data-select-default-font]")) select("");
    });

    renderList();
    renderPreviewText("");
    setMessage("TTF 또는 OTF 파일을 추가해 주세요.");
  }

  return {
    init,
    reset,
    hasState,
    addFiles,
    remove,
    select,
    refreshPreview,
    previewLines,
    fontExtension,
    fontDescriptor,
    makeEpubCss,
    selectedForEpub,
    getEntries:()=>entries.map(entry=>({...entry})),
    getSelectedId:()=>selectedId
  };
})();

if(typeof document!=="undefined") BookieFontSettings.init();
if(typeof module!=="undefined" && module.exports) module.exports=BookieFontSettings;
