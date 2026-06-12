import { DB } from '../core/db.js';
import { save } from '../core/save.js';
import { $ } from '../core/utils.js';

// ─── PAC-MAN ARCADE ───────────────────────────────────────────────
// Procedurally generated mazes (seeded per level, so each level is fair
// and repeatable). Maps grow and the game speeds up every level.

const GHOST_COLORS = ['#f87171', '#f9a8d4', '#22d3ee', '#fb923c'];
const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];

let S = null;        // game state
let _raf = null;
let _keysBound = false;

// Seeded RNG — same level always generates the same maze
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

// ─── MAZE GENERATION ──────────────────────────────────────────────
function genMaze(level){
  const cols = Math.min(15 + 2*(level-1), 29);   // 15 → 29 wide
  const rows = Math.min(11 + 2*(level-1), 21);   // 11 → 21 tall
  const rng = mulberry32(level*7349+1013);
  const g = Array.from({length:rows},()=>Array(cols).fill('#'));

  // DFS carve on odd lattice — guarantees every corridor is reachable
  const stack=[[1,1]]; g[1][1]=' ';
  while(stack.length){
    const [r,c]=stack[stack.length-1];
    const opts=[[2,0],[-2,0],[0,2],[0,-2]]
      .map(([dr,dc])=>[r+dr,c+dc,dr,dc])
      .filter(([nr,nc])=>nr>0&&nr<rows-1&&nc>0&&nc<cols-1&&g[nr][nc]==='#');
    if(!opts.length){ stack.pop(); continue; }
    const [nr,nc,dr,dc]=opts[(rng()*opts.length)|0];
    g[nr][nc]=' '; g[r+dr/2][c+dc/2]=' ';
    stack.push([nr,nc]);
  }
  // knock out extra walls so it plays like Pac-Man, not a dead-end maze
  for(let r=1;r<rows-1;r++)for(let c=1;c<cols-1;c++){
    if(g[r][c]!=='#') continue;
    const h=g[r][c-1]===' '&&g[r][c+1]===' ';
    const v=g[r-1][c]===' '&&g[r+1][c]===' ';
    if((h||v)&&rng()<0.22) g[r][c]=' ';
  }
  // tunnel row: full highway across the middle with wrap-around edges
  const tr=rows>>1;
  for(let c=0;c<cols;c++) g[tr][c]=' ';
  // ghost room 3x3 dead centre (sits on the tunnel row → always connected)
  const gr=tr, gc=cols>>1;
  for(let r=gr-1;r<=gr+1;r++)for(let c=gc-1;c<=gc+1;c++) g[r][c]=' ';
  return {g,cols,rows,tr,gr,gc};
}

// ─── LEVEL SETUP ──────────────────────────────────────────────────
const cx=c=>c*S.T+S.T/2, cy=r=>r*S.T+S.T/2;

function initLevel(){
  const m=genMaze(S.level);
  S.m=m;
  S.T=Math.max(14, Math.min(26, Math.floor(640/m.cols), Math.floor(440/m.rows)));

  S.pellets=new Set(); S.power=new Set();
  for(let r=0;r<m.rows;r++)for(let c=1;c<m.cols-1;c++){
    if(m.g[r][c]===' '&&!(Math.abs(r-m.gr)<=1&&Math.abs(c-m.gc)<=1)) S.pellets.add(c+','+r);
  }
  // 4 power pellets, one nearest each corner
  [[1,1],[m.cols-2,1],[1,m.rows-2],[m.cols-2,m.rows-2]].forEach(([tc,trr])=>{
    let best=null,bd=1e9;
    S.pellets.forEach(k=>{
      const [c,r]=k.split(',').map(Number);
      const d=(c-tc)*(c-tc)+(r-trr)*(r-trr);
      if(d<bd){bd=d;best=k;}
    });
    if(best){ S.pellets.delete(best); S.power.add(best); }
  });
  spawnEntities();
  S.fright=0; S.combo=0;
  S.mode='scatter'; S.modeT=0; S.elapsed=0;
  const cv=$('pac-canvas');
  if(cv){ cv.width=m.cols*S.T; cv.height=m.rows*S.T; }
}

function spawnEntities(){
  const m=S.m;
  // pac: bottom-most, centre-most pellet tile
  let best=null;
  S.pellets.forEach(k=>{
    const [c,r]=k.split(',').map(Number);
    if(!best||r>best[1]||(r===best[1]&&Math.abs(c-m.cols/2)<Math.abs(best[0]-m.cols/2))) best=[c,r];
  });
  S.pac={c:best[0],r:best[1],x:cx(best[0]),y:cy(best[1]),dir:null,want:null,mouth:0};
  S.pellets.delete(best[0]+','+best[1]);

  const n=Math.min(1+Math.ceil(S.level/2)+1, 4);  // lvl1: 3 ghosts → cap 4
  const spots=[[m.gc,m.gr],[m.gc-1,m.gr],[m.gc+1,m.gr],[m.gc,m.gr-1]];
  const corners=[[1,1],[m.cols-2,1],[1,m.rows-2],[m.cols-2,m.rows-2]];
  S.ghosts=[];
  for(let i=0;i<n;i++){
    const [c,r]=spots[i%4];
    S.ghosts.push({c,r,x:cx(c),y:cy(r),dir:[0,-1],color:GHOST_COLORS[i%4],
      state:'home',release:i*2000,corner:corners[i%4]});
  }
}

// ─── MOVEMENT ─────────────────────────────────────────────────────
function open(c,r){
  const m=S.m;
  if(r<0||r>=m.rows) return false;
  if(c<0||c>=m.cols) return r===m.tr;   // wrap only through the tunnel row
  return m.g[r][c]!=='#';
}

function step(e,v,dt,decide){
  let dist=v*S.T*dt, guard=10;
  while(dist>1e-6&&guard-->0){
    if(!e.dir){ decide(e); if(!e.dir) return; }
    let nc=e.c+e.dir[0], nr=e.r+e.dir[1];
    if(!open(nc,nr)){ decide(e); if(!e.dir) return;
      nc=e.c+e.dir[0]; nr=e.r+e.dir[1];
      if(!open(nc,nr)) return;
    }
    const tx=nc*S.T+S.T/2, ty=nr*S.T+S.T/2;
    const d=Math.abs(tx-e.x)+Math.abs(ty-e.y);
    if(dist>=d){
      e.x=tx; e.y=ty; e.c=nc; e.r=nr; dist-=d;
      if(e.c<0){ e.c=S.m.cols-1; e.x=cx(e.c); }
      if(e.c>=S.m.cols){ e.c=0; e.x=cx(e.c); }
      decide(e);
    } else {
      e.x+=Math.sign(tx-e.x)*Math.min(dist,Math.abs(tx-e.x));
      e.y+=Math.sign(ty-e.y)*Math.min(dist,Math.abs(ty-e.y));
      dist=0;
    }
  }
}

function pacDecide(p){
  if(p.want&&open(p.c+p.want[0],p.r+p.want[1])){ p.dir=p.want; }
  if(p.dir&&!open(p.c+p.dir[0],p.r+p.dir[1])) p.dir=null;
}

function ghostDecide(g){
  let pool=DIRS.filter(d=>open(g.c+d[0],g.r+d[1])&&!(g.dir&&d[0]===-g.dir[0]&&d[1]===-g.dir[1]));
  if(!pool.length) pool=DIRS.filter(d=>open(g.c+d[0],g.r+d[1]));
  if(!pool.length){ g.dir=null; return; }
  if(g.state!=='eyes'&&S.fright>0){ g.dir=pool[(Math.random()*pool.length)|0]; return; }
  let target;
  if(g.state==='eyes') target=[S.m.gc,S.m.gr];
  else if(S.mode==='scatter') target=g.corner;
  else target=chaseTarget(g);
  g.dir=pool.reduce((a,b)=>{
    const da=(g.c+a[0]-target[0])**2+(g.r+a[1]-target[1])**2;
    const db=(g.c+b[0]-target[0])**2+(g.r+b[1]-target[1])**2;
    return db<da?b:a;
  });
}

function chaseTarget(g){
  const p=S.pac, i=S.ghosts.indexOf(g);
  if(i===1&&p.dir) return [p.c+p.dir[0]*4, p.r+p.dir[1]*4];          // ambusher
  if(i===2&&p.dir) return [p.c+p.dir[0]*2, p.r+p.dir[1]*2];
  if(i===3){ const d=(g.c-p.c)**2+(g.r-p.r)**2; return d>64?[p.c,p.r]:g.corner; } // shy
  return [p.c,p.r];                                                  // direct chaser
}

// ─── UPDATE ───────────────────────────────────────────────────────
function update(dt){
  S.elapsed+=dt*1000;
  // scatter/chase rhythm (frightened pauses it)
  if(S.fright>0){ S.fright-=dt; if(S.fright<=0){ S.fright=0; S.combo=0; } }
  else {
    S.modeT+=dt;
    if(S.mode==='scatter'&&S.modeT>6){ S.mode='chase'; S.modeT=0; reverseGhosts(); }
    else if(S.mode==='chase'&&S.modeT>18){ S.mode='scatter'; S.modeT=0; reverseGhosts(); }
  }

  const pacV=Math.min(4.2+0.3*S.level, 8);
  S.pac.mouth+=dt*10;
  step(S.pac, pacV, dt, pacDecide);

  // eat
  const key=S.pac.c+','+S.pac.r;
  if(S.pellets.has(key)){ S.pellets.delete(key); S.score+=10; }
  if(S.power.has(key)){
    S.power.delete(key); S.score+=50;
    S.fright=Math.max(2.5, 7-S.level*0.45); S.combo=0;
    reverseGhosts();
  }

  const gBase=pacV*0.82+0.05*S.level;
  S.ghosts.forEach(g=>{
    if(g.state==='home'){ if(S.elapsed>=g.release) g.state='normal'; else return; }
    let v=gBase;
    if(g.state==='eyes') v=pacV*1.8;
    else if(S.fright>0) v=gBase*0.55;
    step(g, v, dt, ghostDecide);
    if(g.state==='eyes'&&g.c===S.m.gc&&g.r===S.m.gr) g.state='normal';
  });

  // collisions
  for(const g of S.ghosts){
    if(g.state!=='normal') continue;
    if(Math.abs(g.x-S.pac.x)+Math.abs(g.y-S.pac.y)<S.T*0.55){
      if(S.fright>0){
        S.score+=200*Math.pow(2,S.combo); S.combo++;
        g.state='eyes';
      } else { startDeath(); return; }
    }
  }

  if(S.pellets.size+S.power.size===0) startLevelUp();
}

function reverseGhosts(){ S.ghosts.forEach(g=>{ if(g.dir&&g.state==='normal') g.dir=[-g.dir[0],-g.dir[1]]; }); }

function startDeath(){
  S.lives--;
  S.phase='dying'; S.phaseT=0;
}
function startLevelUp(){
  S.score+=100*S.level;
  S.lives=Math.min(S.lives+1,5);
  S.phase='levelup'; S.phaseT=0;
  bumpHigh();
}
function bumpHigh(){
  if(S.score>(DB.pacHigh||0)){ DB.pacHigh=S.score; save(); }
}

// ─── DRAW ─────────────────────────────────────────────────────────
function theme(){
  const cs=getComputedStyle(document.documentElement);
  return {
    bg:    cs.getPropertyValue('--bg-elevated').trim()||'#1d211d',
    wall:  cs.getPropertyValue('--accent').trim()||'#22c55e',
    dot:   cs.getPropertyValue('--text-secondary').trim()||'#8fa396',
    cyan:  cs.getPropertyValue('--cyan').trim()||'#22d3ee',
    text:  cs.getPropertyValue('--text-primary').trim()||'#eceeec'
  };
}

function draw(){
  const cv=$('pac-canvas'); if(!cv) return;
  const ctx=cv.getContext('2d'), m=S.m, T=S.T, th=theme();
  ctx.clearRect(0,0,cv.width,cv.height);
  ctx.fillStyle=th.bg; ctx.fillRect(0,0,cv.width,cv.height);

  // neon maze walls: stroke every wall edge that faces a corridor
  ctx.strokeStyle=th.wall; ctx.lineWidth=2;
  ctx.shadowColor=th.wall; ctx.shadowBlur=7;
  ctx.beginPath();
  for(let r=0;r<m.rows;r++)for(let c=0;c<m.cols;c++){
    if(m.g[r][c]!=='#') continue;
    const x=c*T,y=r*T;
    if(r>0&&m.g[r-1][c]!=='#'){ ctx.moveTo(x,y); ctx.lineTo(x+T,y); }
    if(r<m.rows-1&&m.g[r+1][c]!=='#'){ ctx.moveTo(x,y+T); ctx.lineTo(x+T,y+T); }
    if(c>0&&m.g[r][c-1]!=='#'){ ctx.moveTo(x,y); ctx.lineTo(x,y+T); }
    if(c<m.cols-1&&m.g[r][c+1]!=='#'){ ctx.moveTo(x+T,y); ctx.lineTo(x+T,y+T); }
  }
  ctx.stroke();
  ctx.shadowBlur=0;

  // pellets
  ctx.fillStyle=th.dot;
  S.pellets.forEach(k=>{
    const [c,r]=k.split(',').map(Number);
    ctx.beginPath(); ctx.arc(cx(c),cy(r),T*0.08,0,7); ctx.fill();
  });
  // power pellets (pulsing cyan)
  const pulse=0.18+0.07*Math.sin(performance.now()/180);
  ctx.fillStyle=th.cyan; ctx.shadowColor=th.cyan; ctx.shadowBlur=10;
  S.power.forEach(k=>{
    const [c,r]=k.split(',').map(Number);
    ctx.beginPath(); ctx.arc(cx(c),cy(r),T*pulse,0,7); ctx.fill();
  });
  ctx.shadowBlur=0;

  // pac
  const p=S.pac;
  const ang=p.dir?Math.atan2(p.dir[1],p.dir[0]):0;
  const mouth=S.phase==='dying'
    ? Math.min(Math.PI, S.phaseT*3.5)
    : Math.abs(Math.sin(p.mouth))*0.55+0.05;
  ctx.fillStyle='#fbbf24'; ctx.shadowColor='#fbbf24'; ctx.shadowBlur=12;
  ctx.beginPath();
  ctx.moveTo(p.x,p.y);
  ctx.arc(p.x,p.y,T*0.42,ang+mouth,ang-mouth+Math.PI*2);
  ctx.closePath(); ctx.fill();
  ctx.shadowBlur=0;

  // ghosts
  S.ghosts.forEach(g=>{
    const fr=S.fright>0&&g.state==='normal';
    const blink=fr&&S.fright<1.5&&Math.floor(performance.now()/180)%2===0;
    if(g.state!=='eyes'){
      ctx.fillStyle=blink?'#ffffff':(fr?'#3b82f6':g.color);
      if(!fr){ ctx.shadowColor=g.color; ctx.shadowBlur=8; }
      const R=S.T*0.4;
      ctx.beginPath();
      ctx.arc(g.x,g.y-R*0.1,R,Math.PI,0);
      ctx.lineTo(g.x+R,g.y+R*0.75);
      for(let i=0;i<3;i++) ctx.lineTo(g.x+R-(i*2+1)*R/3, g.y+R*(i%2?0.75:0.55));
      ctx.lineTo(g.x-R,g.y+R*0.75);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur=0;
    }
    // eyes
    const ex=g.dir?g.dir[0]*1.5:0, ey=g.dir?g.dir[1]*1.5:0;
    ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(g.x-S.T*0.14,g.y-S.T*0.12,S.T*0.11,0,7); ctx.arc(g.x+S.T*0.14,g.y-S.T*0.12,S.T*0.11,0,7); ctx.fill();
    ctx.fillStyle='#1e3a8a';
    ctx.beginPath(); ctx.arc(g.x-S.T*0.14+ex,g.y-S.T*0.12+ey,S.T*0.055,0,7); ctx.arc(g.x+S.T*0.14+ex,g.y-S.T*0.12+ey,S.T*0.055,0,7); ctx.fill();
  });

  // overlays
  const ov=(big,sub)=>{
    ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(0,0,cv.width,cv.height);
    ctx.textAlign='center'; ctx.fillStyle=th.text;
    ctx.font=`700 ${Math.max(18,T)}px Syne, sans-serif`;
    ctx.shadowColor=th.wall; ctx.shadowBlur=16;
    ctx.fillText(big, cv.width/2, cv.height/2-6);
    ctx.shadowBlur=0;
    ctx.font=`12px "Space Mono", monospace`; ctx.fillStyle=th.dot;
    ctx.fillText(sub, cv.width/2, cv.height/2+18);
  };
  if(S.phase==='ready')   ov('PAC-MAN','press an arrow key to start');
  if(S.phase==='paused')  ov('PAUSED','space to resume');
  if(S.phase==='levelup') ov(`LEVEL ${S.level} CLEAR!`,'+1 life · maze grows · speed up');
  if(S.phase==='over')    ov('GAME OVER',`score ${S.score} · high ${DB.pacHigh||0} · R to retry`);
}

function drawHud(){
  const el=$('pac-hud'); if(!el) return;
  el.innerHTML=`
    <span>SCORE <b>${S.score}</b></span>
    <span>HIGH <b>${Math.max(DB.pacHigh||0,S.score)}</b></span>
    <span>LEVEL <b>${S.level}</b></span>
    <span>${'❤'.repeat(Math.max(0,S.lives))}<span style="opacity:0.25;">${'❤'.repeat(Math.max(0,5-S.lives))}</span></span>`;
}

// ─── GAME LOOP ────────────────────────────────────────────────────
function pageActive(){
  const pg=$('page-pacman');
  return !!pg&&pg.classList.contains('active')&&!document.hidden;
}

function frame(ts){
  _raf=null;
  if(!S) return;
  if(!pageActive()){ if(S.phase==='play') S.phase='paused'; return; }
  const dt=Math.min(0.05,(ts-(S.lastTs||ts))/1000); S.lastTs=ts;

  if(S.phase==='play') update(dt);
  else if(S.phase==='dying'){
    S.phaseT+=dt;
    if(S.phaseT>1.1){
      if(S.lives<=0){ S.phase='over'; bumpHigh(); }
      else { spawnEntities(); S.fright=0; S.phase='play'; }
    }
  }
  else if(S.phase==='levelup'){
    S.phaseT+=dt;
    if(S.phaseT>1.7){ S.level++; initLevel(); S.phase='play'; }
  }
  draw(); drawHud();
  _raf=requestAnimationFrame(frame);
}

function startLoop(){ if(!_raf) _raf=requestAnimationFrame(frame); }

// ─── CONTROLS ─────────────────────────────────────────────────────
const KEYMAP={ArrowUp:[0,-1],w:[0,-1],W:[0,-1],ArrowDown:[0,1],s:[0,1],S:[0,1],
  ArrowLeft:[-1,0],a:[-1,0],A:[-1,0],ArrowRight:[1,0],d:[1,0],D:[1,0]};

function onKey(e){
  if(!pageActive()||!S) return;
  if(KEYMAP[e.key]){
    e.preventDefault();
    S.pac.want=KEYMAP[e.key];
    if(S.phase==='ready'){ S.phase='play'; S.lastTs=0; }
    if(S.phase==='paused') S.phase='play';
    startLoop();
    return;
  }
  if(e.key===' '){ e.preventDefault(); pacToggle(); }
  if(e.key==='r'||e.key==='R'){ e.preventDefault(); pacRestart(); }
}

export function pacToggle(){
  if(!S) return;
  if(S.phase==='play') S.phase='paused';
  else if(S.phase==='paused'||S.phase==='ready') S.phase='play';
  else if(S.phase==='over'){ pacRestart(); return; }
  startLoop();
}

export function pacRestart(){
  newGame();
  S.phase='ready';
  startLoop();
}

function newGame(){
  S={level:1,score:0,lives:3,phase:'ready',phaseT:0,lastTs:0};
  initLevel();
}

// ─── PAGE RENDER ──────────────────────────────────────────────────
export function rPacman(){
  const pg=$('page-pacman'); if(!pg) return;
  pg.innerHTML=`<div style="max-width:900px;margin:0 auto;width:100%;display:flex;flex-direction:column;align-items:center;gap:12px;">

<div class="card" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:10px;">
  <div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
    <span class="card-title">🕹 Pac-Man Arcade</span>
    <div style="display:flex;gap:6px;">
      <button class="btn-primary" style="padding:5px 14px;" onclick="pacToggle()">▶ / ⏸</button>
      <button class="btn-ghost" style="padding:5px 14px;font-size:11px;" onclick="pacRestart()">↻ Restart</button>
    </div>
  </div>
  <div id="pac-hud" style="display:flex;gap:18px;font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);"></div>
  <canvas id="pac-canvas" style="border-radius:var(--radius-md);max-width:100%;"></canvas>
  <div style="font-size:10.5px;color:var(--text-muted);text-align:center;">
    Arrow keys / WASD to move · Space pause · R restart<br>
    Clear the maze to level up — the map grows and everything gets faster. +1 life per level.
  </div>
</div>

</div>`;

  if(!_keysBound){ document.addEventListener('keydown', onKey); _keysBound=true; }
  if(!S) newGame();
  else {
    // re-entering the page: rebuild canvas size for current maze
    const cv=$('pac-canvas');
    if(cv){ cv.width=S.m.cols*S.T; cv.height=S.m.rows*S.T; }
    if(S.phase==='play') S.phase='paused';
  }
  S.lastTs=0;
  draw(); drawHud();
  startLoop();
}
