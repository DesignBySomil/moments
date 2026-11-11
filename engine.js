/* Direct character renderer. Every mark is a literal ASCII glyph. */
'use strict';
const Engine = (() => {
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  let scene, width, height, dpr;
  function resize() {
    width = innerWidth; height = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
  }
  addEventListener('resize', resize); resize();
  function render(time, alpha=1) {
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.fillStyle='#08090b'; ctx.fillRect(0,0,width,height);
    if (!scene) return;
    const cw = Math.min((width-30)/36, (height-70)/72, 11.2), ch=cw*1.7;
    const ox=(width-cw*48)/2, oy=(height-ch*48)/2;
    const grid = Array.from({length:48},()=>Array(48).fill(null));
    const g = {
      put(x,y,s,color=scene.color,a=1) { x=Math.round(x); y=Math.round(y); if(y<0||y>=48)return; for(let i=0;i<s.length;i++) if(x+i>=0&&x+i<48&&s[i]!==' ') grid[y][x+i]={c:s[i],color,a}; },
      art(x,y,rows,color=scene.color,a=1) { rows.forEach((s,i)=>this.put(x,y+i,s,color,a)); },
      line(x0,y0,x1,y1,char='.',color=scene.color,a=1) {const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let i=0;i<=n;i++)this.put(x0+(x1-x0)*i/(n||1),y0+(y1-y0)*i/(n||1),char,color,a);},
      ring(x,y,rx,ry,color=scene.color,a=1) {for(let i=0;i<80;i++){const z=i/80*Math.PI*2;this.put(x+Math.cos(z)*rx,y+Math.sin(z)*ry,Math.abs(Math.sin(z))>.7?'_':Math.cos(z)>0?')':'(',color,a);}},
    };
    const t=((time%scene.loop)+scene.loop)%scene.loop/scene.loop;
    scene.draw(g,t);
    ctx.font='700 '+(ch*.97)+'px "Courier New", monospace'; ctx.textBaseline='middle'; ctx.textAlign='center';
    for(let y=0;y<48;y++)for(let x=0;x<48;x++){const q=grid[y][x]; if(q){ctx.globalAlpha=alpha*q.a;ctx.fillStyle=q.color;ctx.fillText(q.c,ox+(x+.5)*cw,oy+(y+.5)*ch);}}
    ctx.globalAlpha=1;
  }
  return {render,resize,setScene(s){scene=s;},get scene(){return scene;}};
})();
