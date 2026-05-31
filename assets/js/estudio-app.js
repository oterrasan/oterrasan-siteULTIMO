(() => {
  const canvas = document.getElementById("artCanvas");
  const ctx = canvas.getContext("2d");
  let uploaded = null;
  const themes = {
    executive:["#0f172a","#5b3df6","#19b6d2","#ffffff"],
    market:["#07111f","#00d1ff","#88ff4d","#ffffff"],
    health:["#10251d","#16a34a","#c8f7dc","#ffffff"],
    tech:["#120f25","#7c3aed","#f4b740","#ffffff"]
  };
  function wrap(text, max, font){ ctx.font = font; const words = String(text || "").split(/\s+/); const lines=[]; let line=""; words.forEach(w=>{ const test=(line?line+" ":"")+w; if(ctx.measureText(test).width>max && line){ lines.push(line); line=w; } else line=test; }); if(line) lines.push(line); return lines; }
  function coverImage(img,x,y,w,h){ const r=Math.max(w/img.width,h/img.height); const nw=img.width*r, nh=img.height*r; ctx.drawImage(img,x+(w-nw)/2,y+(h-nh)/2,nw,nh); }
  function render(){
    const theme = themes[document.getElementById("templateSelect").value] || themes.executive;
    const [bg,accent,accent2,white] = theme;
    const title = document.getElementById("titleText").value;
    const subtitle = document.getElementById("subtitleText").value;
    ctx.clearRect(0,0,1080,1080);
    const grad = ctx.createLinearGradient(0,0,1080,1080); grad.addColorStop(0,bg); grad.addColorStop(.68,"#111827"); grad.addColorStop(1,"#050816"); ctx.fillStyle=grad; ctx.fillRect(0,0,1080,1080);
    ctx.globalAlpha=.18; ctx.strokeStyle=accent; for(let i=0;i<1080;i+=72){ ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,1080); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(1080,i); ctx.stroke(); } ctx.globalAlpha=1;
    if(uploaded){ ctx.save(); ctx.beginPath(); ctx.roundRect(610,170,330,330,34); ctx.clip(); coverImage(uploaded,610,170,330,330); ctx.restore(); ctx.fillStyle="rgba(0,0,0,.36)"; ctx.fillRect(610,170,330,330); }
    ctx.fillStyle=accent; ctx.fillRect(84,88,76,10); ctx.fillStyle=white; ctx.font="800 30px Inter, Arial"; ctx.fillText("GRUPO TERRASAN",84,150); ctx.fillStyle=accent2; ctx.font="700 24px Inter, Arial"; ctx.fillText("INTELIGENCIA APLICADA",84,190);
    const titleFont="800 68px Inter, Arial"; ctx.fillStyle=white; wrap(title,760,titleFont).slice(0,5).forEach((line,i)=>{ ctx.font=titleFont; ctx.fillText(line,84,330+i*82); });
    ctx.fillStyle="rgba(255,255,255,.78)"; const subFont="500 30px Inter, Arial"; wrap(subtitle,760,subFont).slice(0,5).forEach((line,i)=>{ ctx.font=subFont; ctx.fillText(line,88,770+i*42); });
    ctx.fillStyle=accent; ctx.roundRect(84,950,360,58,18); ctx.fill(); ctx.fillStyle=bg; ctx.font="800 24px Inter, Arial"; ctx.fillText("www.oterrasan.com.br",112,987);
    ctx.strokeStyle="rgba(255,255,255,.25)"; ctx.lineWidth=2; ctx.roundRect(54,54,972,972,34); ctx.stroke();
  }
  function download(type){ const a=document.createElement("a"); a.download=type === "image/jpeg" ? "studio-terrasan.jpg" : "studio-terrasan.png"; a.href=canvas.toDataURL(type,.92); a.click(); }
  document.getElementById("renderBtn").onclick=render; document.getElementById("downloadPng").onclick=()=>download("image/png"); document.getElementById("downloadJpg").onclick=()=>download("image/jpeg");
  document.getElementById("templateSelect").onchange=render; document.getElementById("titleText").oninput=render; document.getElementById("subtitleText").oninput=render;
  document.getElementById("imageInput").onchange=(e)=>{ const file=e.target.files?.[0]; if(!file)return; const img=new Image(); img.onload=()=>{uploaded=img; render();}; img.src=URL.createObjectURL(file); };
  if(!CanvasRenderingContext2D.prototype.roundRect){ CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){this.beginPath();this.moveTo(x+r,y);this.arcTo(x+w,y,x+w,y+h,r);this.arcTo(x+w,y+h,x,y+h,r);this.arcTo(x,y+h,x,y,r);this.arcTo(x,y,x+w,y,r);this.closePath();return this;}; }
  render();
})();
