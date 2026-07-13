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
      /<(p|h[1-6]|li)\b([^>]*)>\s*([\s\S]*?)\s*<\/\1>/gi,
      (element, tag, attributes, content)=>`<${tag}${attributes}>${content.trim()}</${tag}>`
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

function normalizeSingleChapterBodySpacing(html){
  const blank = '(?:<p(?: class="txt")?>\\s*<br\\s*\\/?>\\s*<\\/p>|<p>\\s*(?:&nbsp;|&#160;)?\\s*<\\/p>)';
  const star = '(<p style="text-align:\\s*center;">\\s*\\*\\s*\\*\\s*\\*\\s*<\\/p>)';
  const starBlock = new RegExp(`(?:${blank}\\s*)*${star}(?:\\s*${blank})*`, "g");

  return String(html || "").replace(
    starBlock,
    "<p><br/></p>$1<p><br/></p>"
  );
}

function removeDuplicateHeadingStarBlank(html){
  return String(html || "").replace(
    /^\s*<p><br\s*\/?>\s*<\/p>\s*(?=<p style="text-align:\s*center;">\s*\*\s*\*\s*\*\s*<\/p>)/,
    ""
  );
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

    oebps.file("style.css", EPUB_CSS, {compression:"DEFLATE"});

    let manifest=`<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="css" href="style.css" media-type="text/css"/>`;

    let spine="";
    let navNcx="";
    let navHtml="";

    const uploadedCover=document.getElementById("coverFile").files[0];
    let coverBlob=uploadedCover || null;
    let coverExt="";
    let coverMime="";

    if(uploadedCover){
      coverExt=uploadedCover.name.split(".").pop().toLowerCase();
      coverMime=coverExt==="jpg"?"jpeg":coverExt;
    }else{
      if(typeof generateBookieDefaultCover !== "function"){
        throw new Error("Bookie 기본 표지 생성기를 찾을 수 없습니다.");
      }
      log("표지가 없어 티로 기본 표지를 만드는 중...");
      coverBlob=await generateBookieDefaultCover(title,author);
      coverExt="png";
      coverMime="png";
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
<style>html,body{margin:0;padding:0;height:100%;}body{display:flex;align-items:center;justify-content:center;}img.cover{max-width:100%;max-height:100%;object-fit:contain;}</style>
</head>
<body>
<div class="cover">
<img class="cover" src="cover.${ext}" alt="cover"/>
</div>
</body>
</html>`),{compression:"DEFLATE"});

      manifest += `<item id="coverimg" href="cover.${ext}" media-type="image/${mime}" properties="cover-image"/>
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
      endByLineIndex[lineIndex] = contentIndexes[idx + 1] || lines.length;
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

      oebps.file(filename,formatXhtmlSource(parts.join("")),{compression:"DEFLATE"});

      manifest += `<item id="part${fileNo+1}" href="${filename}" media-type="application/xhtml+xml"/>`;

      spine += `<itemref idref="part${fileNo+1}"/>`;

      setProgress(endChapter,totalChapters,"챕터 처리 중...");
      log(`${endChapter}/${totalChapters} 챕터 처리 완료`);

      await sleep();
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
<meta name="dtb:uid" content="bookid"/>
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
<dc:identifier id="bookid">bookid-${Date.now()}</dc:identifier>
<dc:title>${esc(title)}</dc:title>
${author ? `<dc:creator>${esc(author)}</dc:creator>` : ""}
<dc:language>ko</dc:language>
${coverBlob ? `<meta name="cover" content="coverimg"/>` : ""}
<meta property="dcterms:modified">2026-01-01T00:00:00Z</meta>
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
      if(optimizerReport.fontFilesRemoved > 0 || optimizerReport.fontFaceBlocksRemoved > 0){
        log(`내장 폰트 ${optimizerReport.fontFilesRemoved}개 및 @font-face ${optimizerReport.fontFaceBlocksRemoved}개 제거`);
      }else{
        log("내장 폰트 없음");
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
