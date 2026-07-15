// Bookie Step 7 - EPUB builder logic
function formatXhtmlSource(xhtml){
  const source = String(xhtml || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blockName = "(?:address|article|aside|blockquote|div|figure|figcaption|footer|form|h[1-6]|header|hr|li|main|nav|ol|p|section|table|tbody|td|tfoot|th|thead|tr|ul)";
  const bodyPattern = /(<body\b[^>]*>)([\s\S]*?)(<\/body>)/i;

  return source.replace(bodyPattern, (match, openBody, bodyContent, closeBody)=>{
    let body = bodyContent.trim();

    // Keep paragraph-like elements on one source line when their only extra
    // whitespace is directly inside the opening or closing tag.
    body = body.replace(
      /<(p|h[1-6]|li)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
      (element, tag, attributes, content)=>{
        const classValue=String(attributes).match(/\bclass\s*=\s*["']([^"']*)["']/i)?.[1] || "";
        const isGameChat=String(tag).toLowerCase()==="p" &&
          classValue.split(/\s+/).some(className=>/^chat(?:_|$)/.test(className));
        const normalizedContent=isGameChat ? content : content.trim();
        return `<${tag}${attributes}>${normalizedContent}</${tag}>`;
      }
    );

    // Add one empty source line between block elements. This changes only
    // inter-tag whitespace and never indents nested tags.
    body = body
      .replace(new RegExp(`>\\s*(?=<${blockName}\\b)`, "gi"), ">\n\n")
      .replace(new RegExp(`(<\\/${blockName}>)\\s*(?=<\\/${blockName}>|<${blockName}\\b)`, "gi"), "$1\n\n")
      .replace(new RegExp(`^[ \\t]+(?=<\\/?${blockName}\\b)`, "gmi"), "");

    return `${openBody}\n\n${body}\n\n${closeBody}`;
  });
}

function splitFootnoteAsidePattern(noteNo){
  const safeNo=String(Math.max(0,Number(noteNo) || 0));
  return new RegExp(`<aside\\b[^>]*\\bid=["']fn${safeNo}["'][^>]*>[\\s\\S]*?<\\/aside>`,"i");
}

function isSplitFootnoteMarkerCandidate(text,offset,match){
  const lineStart=text.lastIndexOf("\n",offset-1)+1;
  const linePrefix=text.slice(lineStart,offset);
  if(!linePrefix.trim()) return false;

  const throughMarker=text.slice(lineStart,offset+match.length);
  if(/\(\s*\d+(?:\s*[,/]\s*\d+)*\)$/.test(throughMarker)) return false;
  if(text.charAt(offset-1)==="/") return false;
  return true;
}

function linkLastPlainFootnoteMarker(xhtml,note,maxOffset){
  const source=String(xhtml || "");
  const limit=Number.isFinite(maxOffset) ? Math.max(0,Math.min(source.length,maxOffset)) : source.length;
  const sourceNo=Number(note?.sourceNo);
  if(!Number.isFinite(sourceNo)) return {xhtml:source,linked:false};

  let anchorDepth=0;
  let asideDepth=0;
  let candidate=null;
  const tokens=/<[^>]*>|[^<]+/g;
  let token;

  while((token=tokens.exec(source))){
    if(token.index>=limit) break;
    const value=token[0];

    if(value.startsWith("<")){
      if(/^<a\b/i.test(value) && !/\/\s*>$/.test(value)) anchorDepth++;
      else if(/^<\/a\b/i.test(value)) anchorDepth=Math.max(0,anchorDepth-1);
      else if(/^<aside\b/i.test(value) && !/\/\s*>$/.test(value)) asideDepth++;
      else if(/^<\/aside\b/i.test(value)) asideDepth=Math.max(0,asideDepth-1);
      continue;
    }

    if(anchorDepth || asideDepth) continue;
    const available=value.slice(0,Math.max(0,limit-token.index));
    const markers=/\d+\)/g;
    let marker;
    while((marker=markers.exec(available))){
      if(Number(marker[0].slice(0,-1))!==sourceNo) continue;
      if(!isSplitFootnoteMarkerCandidate(available,marker.index,marker[0])) continue;
      candidate={offset:token.index+marker.index,length:marker[0].length};
    }
  }

  if(!candidate) return {xhtml:source,linked:false};
  const anchor=`<a href="#fn${note.no}" id="ref${note.no}" epub:type="noteref" style="color:#4a7dff;text-decoration:none;">${note.no})</a>`;
  return {
    xhtml:source.slice(0,candidate.offset)+anchor+source.slice(candidate.offset+candidate.length),
    linked:true
  };
}

function reconcileSplitFootnotes(partFiles,notes){
  const files=(Array.isArray(partFiles) ? partFiles : []).map(file=>({
    ...file,
    xhtml:String(file?.xhtml || "")
  }));
  let relinked=0;
  let moved=0;

  (Array.isArray(notes) ? notes : []).forEach(note=>{
    if(!note || note.refHref || !Number.isFinite(Number(note.sourceNo))) return;
    const asidePattern=splitFootnoteAsidePattern(note.no);
    let sourceIndex=-1;
    let sourceAside=null;

    for(let index=0;index<files.length;index++){
      const match=asidePattern.exec(files[index].xhtml);
      if(!match) continue;
      sourceIndex=index;
      sourceAside={html:match[0],offset:match.index};
      break;
    }
    if(sourceIndex<0 || !sourceAside) return;

    let targetIndex=-1;
    for(let index=sourceIndex;index>=0;index--){
      const maxOffset=index===sourceIndex ? sourceAside.offset : files[index].xhtml.length;
      const result=linkLastPlainFootnoteMarker(files[index].xhtml,note,maxOffset);
      if(!result.linked) continue;
      files[index].xhtml=result.xhtml;
      targetIndex=index;
      break;
    }
    if(targetIndex<0) return;

    note.refHref=`${files[targetIndex].filename}#ref${note.no}`;
    relinked++;

    if(targetIndex!==sourceIndex){
      const currentAside=asidePattern.exec(files[sourceIndex].xhtml);
      if(currentAside){
        files[sourceIndex].xhtml=
          files[sourceIndex].xhtml.slice(0,currentAside.index)+
          files[sourceIndex].xhtml.slice(currentAside.index+currentAside[0].length);
        files[targetIndex].xhtml=files[targetIndex].xhtml.replace(
          /\s*<\/body>/i,
          `\n\n${currentAside[0]}\n\n</body>`
        );
        moved++;
      }
    }
  });

  return {files,relinked,moved};
}

function escapeParagraphBreakPattern(value){
  return String(value || "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
}

function currentParagraphBreakTextPattern(){
  const defaultRules=[{source:"***",output:"* * *",matchStars:true,isDefault:true}];
  const rules=(typeof BookieParagraphBreakSettings!=="undefined")
    ? BookieParagraphBreakSettings.getConversionRules()
    : defaultRules;
  const patterns=[];
  const seen=new Set();

  (Array.isArray(rules) ? rules : defaultRules).forEach(rule=>{
    const output=String(rule?.output ?? rule?.source ?? "").trim();
    if(!output || seen.has(output)) return;
    seen.add(output);
    patterns.push(output.replace(/\s+/gu,"")==="***"
      ? "\\*\\s*\\*\\s*\\*"
      : escapeParagraphBreakPattern(output));
  });

  return patterns.length ? `(?:${patterns.join("|")})` : "\\*\\s*\\*\\s*\\*";
}

function paragraphBreakParagraphPattern(){
  return `(<p style="text-align:\\s*center;">\\s*${currentParagraphBreakTextPattern()}\\s*<\\/p>)`;
}

function normalizeSingleChapterBodySpacing(html){
  const blank = '(?:<p(?: class="txt")?>\\s*<br\\s*\\/?>\\s*<\\/p>|<p>\\s*(?:&nbsp;|&#160;)?\\s*<\\/p>)';
  const paragraphBreak = paragraphBreakParagraphPattern();
  const paragraphBreakBlock = new RegExp(`(?:${blank}\\s*)*${paragraphBreak}(?:\\s*${blank})*`, "g");

  return String(html || "").replace(
    paragraphBreakBlock,
    "<p><br/></p>$1<p><br/></p>"
  );
}

function removeDuplicateHeadingStarBlank(html){
  const paragraphBreak = paragraphBreakParagraphPattern();
  return String(html || "").replace(
    new RegExp(`^\\s*<p><br\\s*\\/?>\\s*<\\/p>\\s*(?=${paragraphBreak})`),
    ""
  );
}

function resolveChapterEndLine(lineIndex,nextChapterLine,totalLines){
  const next=Number.isInteger(nextChapterLine) ? nextChapterLine : totalLines;
  const previewApi=(typeof window !== "undefined") ? window.BookieEditableFrontPreview : null;
  const fileEnd=previewApi && typeof previewApi.combinedFileEndForLineIndex === "function"
    ? previewApi.combinedFileEndForLineIndex(lineIndex)
    : null;
  return Number.isInteger(fileEnd) ? Math.min(next,fileEnd) : next;
}

function createEpubIdentifier(){
  if(typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"){
    return `urn:uuid:${crypto.randomUUID()}`;
  }

  const bytes=new Uint8Array(16);
  if(typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function"){
    crypto.getRandomValues(bytes);
  }else{
    for(let index=0;index<bytes.length;index++) bytes[index]=Math.floor(Math.random()*256);
  }
  bytes[6]=(bytes[6]&0x0f)|0x40;
  bytes[8]=(bytes[8]&0x3f)|0x80;
  const hex=[...bytes].map(value=>value.toString(16).padStart(2,"0"));
  const uuid=[
    hex.slice(0,4).join(""),hex.slice(4,6).join(""),hex.slice(6,8).join(""),
    hex.slice(8,10).join(""),hex.slice(10,16).join("")
  ].join("-");
  return `urn:uuid:${uuid}`;
}

function currentEpubModifiedTimestamp(){
  return new Date().toISOString().replace(/\.\d{3}Z$/,"Z");
}

function currentGameCssForEpub(){
  const base=typeof GAME_CSS!=="undefined" ? GAME_CSS : "";
  if(typeof BookieGameModeSettings!=="undefined"){
    return BookieGameModeSettings.buildEpubCss(base);
  }
  return `${String(base).trimEnd()}\n`;
}

function currentBoxCssForEpub(){
  const base=typeof BOX_CSS!=="undefined" ? BOX_CSS : "";
  if(typeof BookieBoxWrapSettings!=="undefined"){
    return BookieBoxWrapSettings.buildEpubCss(base);
  }
  return `${String(base).trimEnd()}\n`;
}

function coverFormatFromFile(file){
  const type=String(file?.type || "").toLowerCase();
  const extension=String(file?.name || "").split(".").pop().toLowerCase();
  const byType={
    "image/jpeg":{ext:"jpg",mime:"image/jpeg",core:true},
    "image/png":{ext:"png",mime:"image/png",core:true},
    "image/gif":{ext:"gif",mime:"image/gif",core:true},
    "image/svg+xml":{ext:"svg",mime:"image/svg+xml",core:true},
    "image/webp":{ext:"webp",mime:"image/webp",core:false},
    "image/avif":{ext:"avif",mime:"image/avif",core:false},
    "image/bmp":{ext:"bmp",mime:"image/bmp",core:false}
  };
  if(byType[type]) return byType[type];

  const byExtension={
    jpg:byType["image/jpeg"],jpeg:byType["image/jpeg"],
    png:byType["image/png"],gif:byType["image/gif"],svg:byType["image/svg+xml"],
    webp:byType["image/webp"],avif:byType["image/avif"],bmp:byType["image/bmp"]
  };
  return byExtension[extension] || null;
}

async function rasterCoverToPng(blob){
  const canvas=document.createElement("canvas");
  let width=0;
  let height=0;
  let drawable=null;
  let objectUrl="";

  try{
    if(typeof createImageBitmap === "function"){
      drawable=await createImageBitmap(blob);
      width=drawable.width;
      height=drawable.height;
    }else{
      objectUrl=URL.createObjectURL(blob);
      drawable=await new Promise((resolve,reject)=>{
        const image=new Image();
        image.onload=()=>resolve(image);
        image.onerror=()=>reject(new Error("표지 이미지를 읽을 수 없습니다."));
        image.src=objectUrl;
      });
      width=drawable.naturalWidth || drawable.width;
      height=drawable.naturalHeight || drawable.height;
    }

    if(!width || !height) throw new Error("표지 이미지 크기를 확인할 수 없습니다.");
    canvas.width=width;
    canvas.height=height;
    const context=canvas.getContext("2d");
    if(!context) throw new Error("표지 변환용 캔버스를 만들 수 없습니다.");
    context.drawImage(drawable,0,0,width,height);
    const png=await new Promise((resolve,reject)=>{
      canvas.toBlob(result=>result ? resolve(result) : reject(new Error("PNG 표지 변환에 실패했습니다.")),"image/png");
    });
    return png;
  }finally{
    if(drawable && typeof drawable.close === "function") drawable.close();
    if(objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

async function prepareCoverForEpub(file){
  const format=coverFormatFromFile(file);
  if(!format) throw new Error("지원하지 않는 표지 형식입니다. JPG, PNG, GIF, SVG, WEBP, AVIF, BMP를 사용해주세요.");
  if(format.core) return {blob:file,ext:format.ext,mime:format.mime,converted:false};

  return {
    blob:await rasterCoverToPng(file),
    ext:"png",
    mime:"image/png",
    converted:true
  };
}

async function makeEPUB(){
  try{
    const loaded = await ensureJSZip();
    if(!loaded || !window.JSZip){
      alert("준비 실패! 인터넷 연결 후 새로고침해줘.");
      return;
    }

    const files=[...document.getElementById("txtFile").files];

    if(!files.length){
      alert("TXT 넣어주세요!");
      return;
    }

    if(!fileText){
      fileText=await readAllTxtFiles(files);

  const titleInput=document.getElementById("bookTitle");

  if(titleInput){
    titleInput.value=titleFromFiles(files);
  }
      lines=fileText.split("\n");
      buildLineStarts(fileText);
    }

    if(!selectedIndexes.length){
      alert("챕터 줄을 선택해주세요!");
      return;
    }

    document.getElementById("log").textContent="";
    document.getElementById("progressBox").style.display="none";
    const customTitle = (
      document.getElementById("bookTitle").value || ""
    ).trim();

    const title = customTitle || titleFromFiles(files);
    const author=(document.getElementById("authorName").value||"").trim();
    const bookIdentifier=createEpubIdentifier();
    const modifiedTimestamp=currentEpubModifiedTimestamp();
    log("EPUB 생성 시작...");
    await sleep();

    const zip=new JSZip();

    zip.file("mimetype","application/epub+zip",{compression:"STORE"});

    zip.folder("META-INF").file("container.xml",
`<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles>
<rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
</rootfiles>
</container>`,{compression:"DEFLATE"});

    const oebps=zip.folder("OEBPS");

    const selectedFont=(typeof BookieFontSettings!=="undefined")
      ? BookieFontSettings.selectedForEpub()
      : null;
    const epubStyleCss=(typeof BookieFontSettings!=="undefined")
      ? BookieFontSettings.makeEpubCss(EPUB_CSS,selectedFont)
      : EPUB_CSS;

    oebps.file("style.css", epubStyleCss, {compression:"DEFLATE"});
    oebps.file("game.css", currentGameCssForEpub(), {compression:"DEFLATE"});
    oebps.file("box.css", currentBoxCssForEpub(), {compression:"DEFLATE"});

    let manifest=`<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="css" href="style.css" media-type="text/css"/>
<item id="gamecss" href="game.css" media-type="text/css"/>
<item id="boxcss" href="box.css" media-type="text/css"/>`;

    if(selectedFont){
      oebps.file(selectedFont.zipPath,await selectedFont.file.arrayBuffer(),{compression:"DEFLATE"});
      manifest += `<item id="bookiefont" href="${selectedFont.href}" media-type="${selectedFont.mediaType}"/>`;
      log(`폰트 적용: ${selectedFont.name}`);
    }

    let spine="";
    let navNcx="";
    let navHtml="";

    const uploadedCover=document.getElementById("coverFile").files[0];
    let coverBlob=null;
    let coverExt="";
    let coverMime="";

    if(uploadedCover){
      const preparedCover=await prepareCoverForEpub(uploadedCover);
      coverBlob=preparedCover.blob;
      coverExt=preparedCover.ext;
      coverMime=preparedCover.mime;
      if(preparedCover.converted) log("리더 호환을 위해 표지를 PNG로 변환했어요.");
    }else{
      if(typeof generateBookieDefaultCover !== "function"){
        throw new Error("Bookie 기본 표지 생성기를 찾을 수 없습니다.");
      }
      log("표지가 없어 티로 기본 표지를 만드는 중...");
      coverBlob=await generateBookieDefaultCover(title,author);
      coverExt="png";
      coverMime="image/png";
    }

    if(coverBlob){
      log(uploadedCover ? "표지 처리 중..." : "티로 기본 표지 적용 중...");
      const ext=coverExt;
      const mime=coverMime;

      oebps.file(`cover.${ext}`,await coverBlob.arrayBuffer(),{compression:"DEFLATE"});

      oebps.file("cover.xhtml",formatXhtmlSource(
`<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
<title>Cover</title>
<link rel="stylesheet" type="text/css" href="style.css"/>
<link rel="stylesheet" type="text/css" href="game.css"/>
<link rel="stylesheet" type="text/css" href="box.css"/>
<style>html,body{margin:0!important;padding:0!important;width:100%;height:100%;overflow:hidden;}body{display:flex;align-items:center;justify-content:center;}div.cover{display:flex;align-items:center;justify-content:center;width:100%;height:100%;margin:0;padding:0;}img.cover{display:block;width:100%;height:100%;max-width:100%;max-height:100%;margin:0;padding:0;object-fit:contain;}</style>
</head>
<body>
<div class="cover">
<img class="cover" src="cover.${ext}" alt="cover"/>
</div>
</body>
</html>`),{compression:"DEFLATE"});

      manifest += `<item id="coverimg" href="cover.${ext}" media-type="${mime}" properties="cover-image"/>
<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>`;

      spine += `<itemref idref="cover"/>`;
    }

    if(typeof normalizeTocSelection === "function") normalizeTocSelection();
    const tocTitleMap = getTocTitles();

    // Step6 body-order hotfix:
    // selectedIndexes is the user-edited TOC order.
    // Build EPUB body files in that same order, while each chapter still keeps
    // its original text slice by ending at the next chapter in the original TXT order.
    const orderedTocIndexes = [...selectedIndexes];
    const contentIndexes = [...selectedIndexes].sort((a,b)=>a-b);
    const endByLineIndex = {};

    contentIndexes.forEach((lineIndex, idx) => {
      endByLineIndex[lineIndex] = resolveChapterEndLine(
        lineIndex,
        contentIndexes[idx + 1],
        lines.length
      );
    });

    const hrefByLineIndex = {};
    const titleByLineIndex = {};

    // Rebuild footnotes fresh on every EPUB export.
    // Without this, a second export can reuse or duplicate old note data.
    footnoteCounter = 0;
    footnoteList = [];

    const totalChapters=orderedTocIndexes.length;
    CHAPTERS_PER_FILE = parseInt(document.getElementById("chapterSplitMode").value, 10) || 1;
    const fileCount=Math.ceil(totalChapters/CHAPTERS_PER_FILE);
    const generatedPartFiles=[];
    setProgress(0,totalChapters,"챕터 처리 준비 중...");

    for(let fileNo=0; fileNo<fileCount; fileNo++){
      const startChapter=fileNo*CHAPTERS_PER_FILE;
      const endChapter=Math.min(startChapter+CHAPTERS_PER_FILE,totalChapters);
      const filename=`part${fileNo+1}.xhtml`;
      const parts=[];
      const singleChapterFile=CHAPTERS_PER_FILE===1;

      parts.push(`<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
<title>${esc(title)} ${fileNo+1}</title>
<link rel="stylesheet" type="text/css" href="style.css"/>
<link rel="stylesheet" type="text/css" href="game.css"/>
<link rel="stylesheet" type="text/css" href="box.css"/>
</head>
<body>`);

      for(let i=startChapter;i<endChapter;i++){
        const start=orderedTocIndexes[i];
        const end=endByLineIndex[start] || lines.length;
        const ch=tocTitleMap[start] || lineByIndex(start).trim();
        const content=textBetweenLines(start,end);
        const href=singleChapterFile ? filename : `${filename}#ch${i+1}`;

        hrefByLineIndex[start] = href;
        titleByLineIndex[start] = ch;

        let htmlPart = textPartToHtml(content);
        if(singleChapterFile){
          htmlPart = normalizeSingleChapterBodySpacing(htmlPart);
          htmlPart = removeDuplicateHeadingStarBlank(htmlPart);
        }

        // Bookie 3.5.1 Footnote v2:
        // Record backlink targets so the end-note page number can return to the body.
        if(Array.isArray(footnoteList) && footnoteList.length){
          footnoteList.forEach(note => {
            if(!note || note.refHref) return;
            if(htmlPart.includes(`id="ref${note.no}"`)){
              note.refHref = `${filename}#ref${note.no}`;
            }
          });
        }

        if(singleChapterFile){
          parts.push(`<h1>${esc(ch)}</h1><p><br/></p>${htmlPart}`);
        }else{
          parts.push(`<h1 id="ch${i+1}">${esc(ch)}</h1><p class="txt"><br/></p>${htmlPart}`);
        }
      }

      if(singleChapterFile){
        parts.push("<p><br/></p><p><br/></p></body></html>");
      }else{
        parts.push("</body></html>");
      }

      const partXhtml=formatXhtmlSource(parts.join(""));
      generatedPartFiles.push({filename,xhtml:partXhtml});
      oebps.file(filename,partXhtml,{compression:"DEFLATE"});

      manifest += `<item id="part${fileNo+1}" href="${filename}" media-type="application/xhtml+xml"/>`;

      spine += `<itemref idref="part${fileNo+1}"/>`;

      setProgress(endChapter,totalChapters,"챕터 처리 중...");
      log(`${endChapter}/${totalChapters} 챕터 처리 완료`);

      await sleep();
    }

    // A user-selected or auto-detected TOC line can split a marker from the
    // explicit footnote section that defines it. Reconnect any such note after
    // all chapter XHTML files exist, and move its semantic popup target into
    // the same XHTML document as the real body marker.
    const reconciledFootnotes=reconcileSplitFootnotes(generatedPartFiles,footnoteList);
    reconciledFootnotes.files.forEach(file=>{
      oebps.file(file.filename,formatXhtmlSource(file.xhtml),{compression:"DEFLATE"});
    });
    if(reconciledFootnotes.relinked){
      log(`분리된 각주 ${reconciledFootnotes.relinked}개 연결 (${reconciledFootnotes.moved}개 설명 이동)`);
    }


    if(footnoteList.length){

      let footHtml = "";

      footnoteList.forEach(note=>{

        const backHref = note.refHref || "";
        const noteNoHtml = backHref
          ? `<a href="${backHref}" style="color:#4a7dff;text-decoration:none;">${note.no})</a>`
          : `${note.no})`;

        // Bookie 3.5.3 Footnote Popup Content Fix:
        // Keep the end-note number visible/clickable, but place the popup target
        // on the note text only so Ridibooks popup shows content without "1)".
        footHtml += `
<p>
<b>${noteNoHtml}</b> <span id="fn${note.no}" epub:type="footnote">${esc(note.text)}</span>
</p>
`;

      });

      oebps.file("footnotes.xhtml",formatXhtmlSource(
`<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
<title>주석</title>
<link rel="stylesheet" type="text/css" href="style.css"/>
<link rel="stylesheet" type="text/css" href="game.css"/>
<link rel="stylesheet" type="text/css" href="box.css"/>
</head>
<body>

<h1>주석</h1>

${footHtml}

</body>
</html>`),{compression:"DEFLATE"});

      manifest += `
<item id="footnotes" href="footnotes.xhtml" media-type="application/xhtml+xml"/>`;

      spine += `
<itemref idref="footnotes"/>`;
    }


    log("목차 저장 중...");

    orderedTocIndexes.forEach((lineIndex, order) => {
      const href = hrefByLineIndex[lineIndex];
      if(!href) return;

      const ch = titleByLineIndex[lineIndex] || tocTitleMap[lineIndex] || lineByIndex(lineIndex).trim();

      navNcx += `<navPoint id="nav${order+1}" playOrder="${order+1}">
<navLabel><text>${esc(ch)}</text></navLabel>
<content src="${href}"/>
</navPoint>`;

      navHtml += `<li><a href="${href}">${esc(ch)}</a></li>`;
    });

    // Keep the notes page after all user-selected chapters in the visible TOC.
    if(footnoteList.length){
      const noteOrder = orderedTocIndexes.length + 1;
      navNcx += `<navPoint id="nav${noteOrder}" playOrder="${noteOrder}">
<navLabel><text>주석</text></navLabel>
<content src="footnotes.xhtml"/>
</navPoint>`;

      navHtml += `
<li><a href="footnotes.xhtml">주석</a></li>`;
    }

    oebps.file("nav.xhtml",formatXhtmlSource(
`<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
<title>목차</title>
</head>
<body>
<nav epub:type="toc" id="toc">
<h1>목차</h1>
<ol>
${navHtml}
</ol>
</nav>
</body>
</html>`),{compression:"DEFLATE"});

    oebps.file("toc.ncx",
`<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
<head>
<meta name="dtb:uid" content="${esc(bookIdentifier)}"/>
<meta name="dtb:depth" content="1"/>
<meta name="dtb:totalPageCount" content="0"/>
<meta name="dtb:maxPageNumber" content="0"/>
</head>
<docTitle><text>${esc(title)}</text></docTitle>
<navMap>${navNcx}</navMap>
</ncx>`,{compression:"DEFLATE"});

    oebps.file("content.opf",
`<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" unique-identifier="bookid" xmlns="http://www.idpf.org/2007/opf">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="bookid">${esc(bookIdentifier)}</dc:identifier>
<dc:title>${esc(title)}</dc:title>
${author ? `<dc:creator>${esc(author)}</dc:creator>` : ""}
<dc:language>ko</dc:language>
${coverBlob ? `<meta name="cover" content="coverimg"/>` : ""}
<meta property="dcterms:modified">${modifiedTimestamp}</meta>
</metadata>
<manifest>${manifest}</manifest>
<spine toc="ncx">${spine}</spine>
${coverBlob ? `<guide><reference type="cover" title="Cover" href="cover.xhtml"/></guide>` : ""}
</package>`,{compression:"DEFLATE"});

    if(typeof BookieOptimizerEngine !== "undefined"){
      log("EPUB 리소스 최적화 중...");
      const optimizerReport = await BookieOptimizerEngine.optimize(zip);
      if(optimizerReport.duplicateFiles > 0){
        log(`중복 리소스 ${optimizerReport.duplicateFiles}개 제거 대상 처리`);
      }else{
        log("중복 리소스 없음");
      }
      if(optimizerReport.unusedRemovedFiles > 0){
        log(`미사용 리소스 ${optimizerReport.unusedRemovedFiles}개 제거 (${optimizerReport.unusedSavedBytes} bytes)`);
      }else{
        log("미사용 리소스 없음");
      }
      if(optimizerReport.junkFilesRemoved > 0){
        log(`불필요한 메타 파일 ${optimizerReport.junkFilesRemoved}개 제거`);
      }else{
        log("불필요한 메타 파일 없음");
      }
      if(optimizerReport.opfFilesChanged > 0){
        const opfChanges = optimizerReport.opfMetadataDuplicatesRemoved
          + optimizerReport.opfDuplicateManifestItemsRemoved
          + optimizerReport.opfMissingManifestItemsRemoved
          + optimizerReport.opfDanglingSpineItemsRemoved
          + optimizerReport.opfDanglingCoverMetaRemoved
          + optimizerReport.opfDanglingGuideReferencesRemoved;
        log(`OPF ${optimizerReport.opfFilesChanged}개 정리 (${opfChanges}개 항목)`);
      }else{
        log("OPF 정리 항목 없음");
      }
      if(optimizerReport.zipDirectoryEntriesRemoved > 0){
        log(`ZIP 빈 폴더 엔트리 ${optimizerReport.zipDirectoryEntriesRemoved}개 정리`);
      }
      if(optimizerReport.summary){
        log("──────── Optimizer Report ────────");
        optimizerReport.summary.split("\n").forEach(line => log(line));
      }
    }

    log("EPUB 파일 만드는 중...");

    const blob=await zip.generateAsync({
      type:"blob",
      compression:"DEFLATE",
      compressionOptions:{level:9},
      mimeType:"application/epub+zip",
      platform:"DOS",
      comment:""
    });

    log("다운로드 시작...");

    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");

    a.href=url;
    const safeAuthor = author ? author.trim() : "";

    a.download = safeAuthor
      ? `${title}-${safeAuthor}.epub`
      : `${title}.epub`;

    document.body.appendChild(a);
    a.click();

    setTimeout(()=>{
      URL.revokeObjectURL(url);
      a.remove();
    },3000);

    finishProgress();
    log("완료!");

  }catch(e){
    log("오류: "+(e && e.message ? e.message : e));
    alert("오류가 났어: "+(e && e.message ? e.message : e));
  }
}
