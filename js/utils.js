// Bookie Step 8 - shared non-UI utilities
function esc(s){
  return String(s||"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;");
}
function escAttr(s){
  return esc(s)
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#39;");
}
function sleep(){return new Promise(r=>setTimeout(r,0));}

function buildLineStarts(text){
  lineStarts=[0];
  for(let i=0;i<text.length;i++){
    if(text.charCodeAt(i)===10) lineStarts.push(i+1);
  }
  lineStarts.push(text.length+1);
}

function lineByIndex(i){
  const s=lineStarts[i];
  const e=Math.max(s,(lineStarts[i+1]||fileText.length)-1);
  return fileText.slice(s,e);
}

function textBetweenLines(startLine,endLine){
  const start=lineStarts[startLine+1]||fileText.length;
  const end=Math.max(start,(lineStarts[endLine]||fileText.length)-1);
  return fileText.slice(start,end);
}
