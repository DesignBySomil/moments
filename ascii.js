/* Thirty small scenes, authored in characters rather than filtered images. */
'use strict';
window.ASCII_SCENES = (()=>{
  const P=Math.PI*2, C={ivory:'#f5f1e8',mint:'#d5eadc',rose:'#f0d9e3',blue:'#d7e6f5',gold:'#f0dfba',dim:'#a0a7ac'};
  const S=(t,n=1,p=0)=>Math.sin(P*(t*n+p));
  const B=(t,n=1,p=0)=>(1-Math.cos(P*(t*n+p)))/2;
  const items=[];
  function add(id,color,loop,draw){items.push({id,name:id,color,loop,draw});}
  function sea(g,y,t,n=3){for(let j=0;j<n;j++)for(let i=0;i<5;i++){let x=5+i*8+Math.round(S(t,1,j*.2)*2);g.put(x,y+j*2,j%2?'~  ~':'~~',C.blue,.7-j*.08);}}
  function ground(g,y,t){for(let i=0;i<7;i++)g.put(3+((i*7-t*14+49)%49),y,'_',C.dim,.55);}
  function stars(g,t,points){points.forEach(([x,y],i)=>g.put(x,y,i%3?' .'.trim():'+',C.ivory,.22+.4*B(t,1,i*.17)));}
  add('bloom',C.rose,10,(g,t)=>{
    const o=B(t),cx=24,cy=21;
    g.line(24,25,24,36,'|',C.mint);g.art(24,30,['   _','  /',' /','/'],C.mint);g.art(18,31,['___','   \\','    \\','     |'],C.mint);
    const petals=[[' .-. ','(   )'," \u0027-\u0027 "],[' /\\ ','(  )',' \\/ ']];
    for(let i=0;i<6;i++){
      const a=P*i/6-P/4,px=cx+Math.cos(a)*(2+o*6),py=cy+Math.sin(a)*(1+o*4);
      g.line(cx,cy,px,py,i===0||i===3?'|':Math.cos(a)*Math.sin(a)>0?'\\':'/',C.rose,.7);
      g.art(px-2,py-1,petals[i%2],C.rose,1);
    }
    g.art(22,20,[' .:. ',':oOo:'," \u0027:\u0027 "],C.gold);
  });
  add('sail',C.ivory,14,(g,t)=>{
    let x=-18+t*62,y=18+Math.round(S(t,2)*.5);
    g.art(x,y,['        |','        |\\','        | \\','        |  \\','        |   \\','    /|  |____\\','   / |  |','  /__|__|______','  \\__________/'],C.ivory);
    g.put(x+9,y,'>',C.rose);sea(g,29,t,3);
  });
  add('bird',C.blue,10,(g,t)=>{
    const f=B(t,4), x=-18+t*64,y=24-t*12+Math.round(S(t,2)*2);
    const rows=f>.6?['\\               /',' \\             /','  \\           /','   \\    _    /','    \\__/o\\__/','        \\_>','         v']:f>.2?['                 ',' __           __ ','   \\__   __/','      \\o/','       \\_>','        v']:['','       _','   ___/o\\___',' _/   \\_>  \\_','/      v      \\'];
    g.art(x,y,rows);g.put(8,17,'.',C.dim);g.put(38,31,'.',C.dim);
  });
  add('wave',C.gold,8,(g,t)=>{
    let x=16+Math.round(S(t,3)*2);
    g.art(x,15,['      _ _','    _| | |_','   | | | | |','   | | | | |','   |       |','   |       | __','   |       |/ /','   |         /','    \\       /','     |     |','     |     |','     |_____|']);
    g.put(x-3,17,'(',C.dim,B(t,3));g.put(x+15,17,')',C.dim,1-B(t,3));
  });
  add('cycle',C.mint,8,(g,t)=>{
    const y=20;
    g.art(10,y,[
      '             O',
      '            /|_',
      '          _/ | \\',
      '         /   /  \\_',
      '        _|__/______',
      '       / | /      \\',
      '  .---/--|/----.   \\',
      ' /    \\  o    / \\   \\',
      '(      )---(      )',
      ' \\____/     \\____/'
    ]);
    g.put(14,y+8,B(t,4)>.5?'+':'x',C.ivory);
    g.put(26,y+8,B(t,4)>.5?'x':'+',C.ivory);
    g.put(20,y+4,B(t,4)>.5?'/':'|',C.ivory);
    ground(g,33,t);
  });
  add('rain',C.blue,8,(g,t)=>{
    g.art(8,11,['.----------------------------.','|                            |','|                            |','|                            |','|                            |','|                            |','|                            |','|                            |','|                            |','|                            |','|                            |','|                            |','|                            |','|                            |','|                            |','|                            |','|                            |',"'----------------------------'"],C.dim);
    for(let i=0;i<18;i++){let x=10+(i*11%25), y=13+((t*16+(i*7%15))%15);g.put(x,y,';',C.blue,.6+.3*B(t,1,i*.2));g.put(x,y-1,':',C.blue,.3);}
    g.put(9,20,'|',C.dim);g.put(36,20,'|',C.dim);
  });
  add('candle',C.gold,8,(g,t)=>{
    let x=23+Math.round(S(t,3)*.5);g.art(x-2,14,[' .',S(t,3)>0?'( )':' )(', ' V'],C.gold);
    g.put(21,17,'|',C.gold);g.art(19,18,['  ___',' /___\\',' |   |',' | : |',' |   |',' |   |',' |   |',' |   |',' |___|','/_____\\'],C.ivory);
    g.put(x-4,15,'.',C.gold,.15+.2*B(t,3));g.put(x+4,14,'.',C.gold,.15+.2*B(t,2));
  });
  add('campfire',C.gold,8,(g,t)=>{
    const f=Math.floor(B(t,4)*2.99);
    const fire=[['       .','      ( )','   . (   )','  ( ( )  )','   (  )( )','    \\___/'],['       )','    . ( )','   ( )   )','  ( ( ) (','   (   ) )','    \\___/'],['     .','    ( ) .','   (   ( )','    ) (  )','   (   )/','    \\___/']][f];
    g.art(17,17,fire);g.art(14,23,['  \\   \\  /   /','   \\___\\/___/','   /___/\\___\\','  /   /  \\   \\'],C.ivory);
    for(let i=0;i<4;i++){let p=(t*2+i*.25)%1;g.put(21+S(p)*3,17-p*7,p>.5?'.':"'",C.gold,1-p);}
  });
  add('moonsea',C.blue,12,(g,t)=>{
    g.art(24,12,['   _..._',' .\'     `.','/   .     \\','|         |','\\     .   /'," `._____.\'"],C.ivory);
    sea(g,27,t,5);for(let i=0;i<4;i++)g.put(28+Math.round(S(t,1,i*.14)),27+i*2,'-'.repeat(2+i),C.ivory,.6-i*.1);
    stars(g,t,[[9,13],[39,21],[15,22]]);
  });
  add('meteors',C.blue,10,(g,t)=>{
    stars(g,t,[[7,15],[24,12],[39,18],[12,31],[30,34],[35,26],[17,22]]);
    for(let k=0;k<3;k++){const p=(t+k/3)%1;const x=5+p*38,y=10+p*24;g.put(x,y,'*',C.ivory,Math.sin(p*Math.PI));for(let j=1;j<5;j++)g.put(x-j,y-j*.6,j>2?'.':'/',C.blue,(1-j/5)*Math.sin(p*Math.PI));}
  });
  add('dandelion',C.ivory,12,(g,t)=>{
    g.line(22,25,21,36,'|',C.mint);g.art(18,31,['__','  \\','   |'],C.mint);
    for(let i=0;i<14;i++){const a=P*i/14;g.line(22,21,22+Math.cos(a)*5,21+Math.sin(a)*4,'.',C.dim);let p=B(t,1,i*.025);let dx=Math.cos(a)*5+p*p*12,dy=Math.sin(a)*4-p*7;g.put(22+dx,21+dy,'*',C.ivory,1-p*.65);}
    g.put(22,21,'o',C.gold);
  });
  add('leaves',C.gold,12,(g,t)=>{
    for(let i=0;i<4;i++){const p=(t+i/4)%1,x=15+S(p,1,i*.2)*9,y=9+p*30;
      const a=Math.sin(P*p*2+i);g.art(x,y,a>0?[' /\\','/  )','\\ /',' |']:[' /','( \\',' \\/'],i%2?C.rose:C.gold,Math.sin(p*Math.PI));}
  });
  add('snow',C.ivory,12,(g,t)=>{
    g.art(15,27,['      /\\','     /  \\','    /____\\','    | [] |','    |  __|','____|__|_|____'],C.dim);
    for(let i=0;i<27;i++){const p=(t+(i*17%31)/31)%1;g.put(5+(i*13%37)+S(p,1,i*.12)*2,8+p*28,i%4===0?'+':'.',C.ivory,.35+.5*Math.sin(p*Math.PI));}
  });
  add('lighthouse',C.ivory,12,(g,t)=>{
    const reach=S(t)*14;for(let j=0;j<3;j++)g.line(25,18,25+reach,16+j*2,'-',C.gold,.18+j*.08);
    g.art(19,15,['    /\\','   /__\\','   |**|','   |__|','   /  \\','  /----\\','  |    |',' /------\\',' |  __  |','_|__||__|_']);sea(g,31,t,3);
  });
  add('lantern',C.gold,10,(g,t)=>{
    const x=18+Math.round(S(t)*3),y=16+Math.round(S(t,2));
    g.art(x,y,['   .----.','  /      \\',' / | || | \\',' | | || | |',' | | || | |',' \\ | || | /','  \\______/','    |  |','    \\__/','     ||','     ~'],C.gold);
    stars(g,t,[[10,13],[37,19],[12,32]]);
  });
  add('balloon',C.rose,12,(g,t)=>{
    const x=16+Math.round(S(t)*3),y=11+Math.round(S(t)*2);
    g.art(x,y,['    .----.','  .\'  |   `.',' / |  |  | \\','|  |  |  |  |','|  |  |  |  |',' \\ |  |  | /','  \\ | | | /','   \\|_|_|/','    \\   /','     \\ /','     |_|','     |_|']);
    g.put(7,31,'- -',C.dim);g.put(35,19,'- -',C.dim);
  });
  add('kite',C.blue,10,(g,t)=>{
    const x=24+S(t)*5,y=17+S(t,2)*2;
    g.art(x-4,y-3,['    /\\','   / |\\','  /  | \\',' /___|__\\',' \\   | /','  \\  |/','   \\ /','    V']);
    for(let i=0;i<12;i++)g.put(x+S(t,1,i*.06)*i*.12,y+5+i,i%3===0?'x':'|',i%3===0?C.rose:C.ivory,.7);
  });
  add('paperplane',C.ivory,12,(g,t)=>{
    const x=-10+t*56,y=25-t*12+S(t,2)*3;
    g.art(x,y,['        /|','      /  |','    /    |','  /______|','  \\  /','   \\/']);
    for(let i=0;i<8;i++)g.put(x-2-i*2,y+5+Math.sin(i*.5)*2,'.',C.dim,(1-i/9)*.7);
  });
  add('waves',C.blue,10,(g,t)=>{
    for(let j=0;j<7;j++)for(let x=5;x<43;x++){const y=19+j*2+S(t,1,x/28+j*.15)*1.7;g.put(x,y,x%4===0?'~':'.',j<3?C.ivory:C.blue,.85-j*.08);}
  });
  add('jellyfish',C.rose,12,(g,t)=>{
    const x=17+Math.round(S(t)*3),y=16+Math.round(S(t)*2);
    g.art(x,y,['    .---.','  .\'     `.',' /   . .   \\','(___________)',' \\_/\\_/\\_/']);
    for(let j=0;j<5;j++)for(let k=0;k<9;k++)g.put(x+2+j*2+S(t,1,k*.05+j*.1)*1.3,y+5+k,k%3===0?'~':j%2?'|':':',j%2?C.rose:C.blue,1-k*.055);
  });
  add('butterfly',C.rose,8,(g,t)=>{
    const x=14+Math.round(S(t)*3),y=19+Math.round(S(t,2)*2);
    const open=B(t,4)>.4;
    g.art(x,y,open?[' .-.   .-.','(   \\ /   )',' \\   V   /','  >  |  <',' /   |   \\','(____|____)','     |','     v']:['  .-.-.',' (  |  )','  \\ | /','   >|<','  / | \\',' (___)']);
    g.put(x+4,y-1,'\\ /',C.ivory);
  });
  add('sunrise',C.gold,14,(g,t)=>{
    const cy=29-Math.round(B(t)*12);
    const rows=['    .----.','  .\u0027      `.',' /          \\','|            |',' \\          /',"  ` .____. \u0027"];
    rows.forEach((row,i)=>{if(cy+i<=28)g.put(17,cy+i,row,C.gold);});
    if(cy<25){g.put(23,cy-3,'|',C.gold,.65);g.put(13,cy+2,'-',C.gold,.65);g.put(33,cy+2,'-',C.gold,.65);}
    for(let x=6;x<42;x++)g.put(x,29,'_',C.dim);sea(g,31,t,3);
  });
  add('train',C.ivory,10,(g,t)=>{
    const x=5+Math.round(S(t)*2);g.art(x,21,['    __','   |  |    ___________',' __|__|___| [] [] [] |','|  _      |         |','|_|_|_____|_________|','  O  O  O   O     O']);
    for(let i=0;i<4;i++){const p=(t*2+i/4)%1;g.put(x+4+p*9,20-p*7,p>.5?'.':'o',C.ivory,1-p);}
    g.put(3,29,'='.repeat(42),C.dim,.65);ground(g,30,t);
  });
  add('windmill',C.ivory,12,(g,t)=>{
    g.art(19,24,['    |','   / \\','  /   \\',' / [ ] \\',' |     |',' |  _  |','_|_| |_|_'],C.mint);
    for(let i=0;i<4;i++){const a=P*t+i*Math.PI/2;g.line(24,23,24+Math.cos(a)*10,23+Math.sin(a)*6,'+',C.ivory);g.line(24+Math.cos(a)*5,23+Math.sin(a)*3,24+Math.cos(a)*9-Math.sin(a)*2,23+Math.sin(a)*5+Math.cos(a),'#',C.ivory,.7);}
    g.put(24,23,'O',C.gold);
  });
  add('pendulum',C.gold,8,(g,t)=>{
    g.art(16,14,['      /\\','     /  \\','    /    \\','   /      \\','  /        \\',' /          \\','/            \\','|            |','|            |','|            |','|            |','|            |','|            |','|____________|'],C.dim);
    const a=S(t,2)*.65,x=24+Math.sin(a)*9,y=16+Math.cos(a)*9;g.line(24,16,x,y,'|',C.ivory);g.put(24,16,'+',C.gold);g.art(x-1,y-1,[' _','(O)',' -']);
  });
  add('fireflies',C.mint,12,(g,t)=>{
    g.art(5,32,[' /|     /       |\\        /|','/ |  / /   /|   | \\  /|  |','  | / /   / |   |  \\/ | /|'],C.dim);
    for(let i=0;i<9;i++){const x=9+(i*13%31)+S(t,1,i*.14)*2,y=17+(i*7%14)+S(t,1,i*.11)*2;g.put(x,y,B(t,1,i*.15)>.7?'*':'.',C.mint,.2+.8*B(t,1,i*.15));}
  });
  add('aurora',C.mint,14,(g,t)=>{
    for(let band=0;band<3;band++)for(let x=7;x<42;x++){
      const y=16+band*3+S(t,1,x/39+band*.1)*4;
      g.put(x,y,x%3===0?'|':':',band===1?C.blue:C.mint,.45+.45*B(t,1,x*.012));
      if(x%2===0)g.put(x,y+1,'.',C.mint,.35);
    }
    g.art(5,34,['       /\\       /\\','   ___/  \\_____/  \\____'],C.dim);stars(g,t,[[11,11],[31,9],[39,31]]);
  });
  add('umbrella',C.blue,10,(g,t)=>{
    const x=15+Math.round(S(t)*2),y=19+Math.round(S(t)*.5);
    for(let i=0;i<15;i++){const p=(t*2+i*.079)%1;g.put(4+(i*11%40),9+p*29,"'",C.dim,.55);}
    g.art(x,y,['      _|_','   .-\' | `-.',' .\'    |    `.','/______|______\\','  V    |    V','       |','       |','       |','       |','       J']);
  });
  add('swing',C.gold,10,(g,t)=>{
    g.put(9,12,'_'.repeat(30),C.ivory);const dx=S(t)*5,dy=B(t,2)*1;
    g.line(17,13,17+dx,28-dy,'|',C.dim);g.line(30,13,30+dx,28-dy,'|',C.dim);g.put(16+dx,29-dy,'='.repeat(16));
    g.art(21+dx,21-dy,[' O','/|\\',' |','/ \\'],C.ivory);
  });
  add('sprout',C.mint,12,(g,t)=>{
    const grow=.25+.75*B(t),top=34-grow*13,x=24+S(t)*.7;
    g.line(24,35,x,top,'|');
    if(grow>.35){g.art(x-7,top+1,[' __','/  \\','\\___\\__']);g.art(x,top-1,['     __','   /   \\','__/____/']);}
    g.put(11,36,'._..__.._..._..__.._..._..',C.dim);
  });
  return items;
})();
