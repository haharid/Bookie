// Bookie default cover generator
// Uses the user-provided Tiro template and the title/author currently entered in Bookie.
(function(){
  const TEMPLATE_URL = window.BOOKIE_DEFAULT_COVER_DATA_URL || "assets/default_cover_template.png";

  function loadImage(src){
    return new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=()=>reject(new Error("Bookie 기본 표지 템플릿을 불러오지 못했습니다."));
      img.src=src;
    });
  }

  function splitText(ctx,text,maxWidth,maxLines){
    const source=(text||"").trim();
    if(!source) return [];
    const chars=[...source];
    const lines=[];
    let line="";
    for(const ch of chars){
      const next=line+ch;
      if(line && ctx.measureText(next).width>maxWidth){
        lines.push(line.trim());
        line=ch;
        if(lines.length===maxLines-1) break;
      }else{
        line=next;
      }
    }
    const used=lines.join("").length;
    const rest=source.slice(used);
    if(rest) lines.push(rest);
    return lines.slice(0,maxLines);
  }

  function fitTitle(ctx,title,maxWidth,maxLines){
    let size=66;
    let lines=[];
    while(size>=34){
      ctx.font=`700 ${size}px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;
      lines=splitText(ctx,title,maxWidth,maxLines);
      if(lines.length<=maxLines && lines.every(line=>ctx.measureText(line).width<=maxWidth)){
        return {size,lines};
      }
      size-=2;
    }
    ctx.font=`700 34px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;
    return {size:34,lines:splitText(ctx,title,maxWidth,maxLines)};
  }

  function canvasToBlob(canvas,type="image/png",quality=0.95){
    return new Promise((resolve,reject)=>{
      canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("기본 표지 이미지 생성에 실패했습니다.")),type,quality);
    });
  }

  async function generateBookieDefaultCover(title,author){
    const template=await loadImage(TEMPLATE_URL);
    const canvas=document.createElement("canvas");
    canvas.width=template.naturalWidth||template.width;
    canvas.height=template.naturalHeight||template.height;
    const ctx=canvas.getContext("2d");
    if(!ctx) throw new Error("브라우저에서 기본 표지 캔버스를 만들 수 없습니다.");

    ctx.drawImage(template,0,0,canvas.width,canvas.height);
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillStyle="#2b1d16";

    const fitted=fitTitle(ctx,title||"제목 없음",760,3);
    const lineHeight=fitted.size*1.25;
    const titleCenterY=425;
    const startY=titleCenterY-((fitted.lines.length-1)*lineHeight/2);
    fitted.lines.forEach((line,index)=>ctx.fillText(line,canvas.width/2,startY+index*lineHeight));

    // Dotted sage divider and coral heart, matching the supplied cover design.
    const dividerY=515;
    ctx.fillStyle="#a8ad86";
    for(let x=175;x<=911;x+=18){
      ctx.beginPath();
      ctx.arc(x,dividerY,2.5,0,Math.PI*2);
      ctx.fill();
    }
    ctx.fillStyle="#f28c79";
    ctx.font='34px "Segoe UI Symbol", sans-serif';
    ctx.fillText("♥",canvas.width/2,dividerY+2);

    const safeAuthor=(author||"").trim();
    if(safeAuthor){
      let authorSize=32;
      do{
        ctx.font=`500 ${authorSize}px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;
        if(ctx.measureText(safeAuthor).width<=500) break;
        authorSize-=2;
      }while(authorSize>=22);
      ctx.fillStyle="#2b1d16";
      ctx.fillText(safeAuthor,canvas.width/2,575);
    }

    return canvasToBlob(canvas,"image/png");
  }

  window.generateBookieDefaultCover=generateBookieDefaultCover;
})();
