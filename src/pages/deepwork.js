import { DB } from '../core/db.js';
import { save } from '../core/save.js';
import { $, esc, today, val } from '../core/utils.js';
import { showToast } from '../core/utils.js';
import { _curPage } from '../core/router.js';

let _dwInterval = null;

function dwSecsFor(mode) { return (mode==='focus'?DB.dw.focusMin:mode==='short'?DB.dw.shortMin:DB.dw.longMin)*60; }

export function updateFocusPill() {
  const ft=document.querySelector('.focus-text');
  if(ft) ft.textContent=DB.dw.running?'Deep Work Active':'Focus Mode';
}

export function rDeepwork() {
  const pg=$('page-deepwork'); if(!pg) return;
  const dw=DB.dw;
  if(dw.monk===undefined)dw.monk=false;
  const activeProjs=(DB.projects||[]).filter(p=>p.status==='in-progress');

  pg.innerHTML=`<div style="max-width:1100px;margin:0 auto;width:100%;">

<div class="card" style="text-align:center;padding:36px 20px;margin-bottom:14px;background:radial-gradient(circle at 50% 40%, rgba(34,197,94,0.07), var(--bg-card) 70%);border-color:var(--border-soft);">
  <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.18em;color:var(--text-muted);font-family:var(--font-mono);margin-bottom:14px;">Deep Work Session</div>
  <div class="dw-timer${dw.running?' running':''}" id="dw-display">00:00</div>
  <div style="font-size:12px;color:var(--text-secondary);margin:12px 0 18px;" id="dw-session-label"></div>
  <div style="display:flex;gap:10px;justify-content:center;">
    <button class="btn-primary" id="dw-toggle-btn" onclick="toggleDwTimer()" style="padding:10px 24px;">${dw.running?'⏸ Pause':'▶ Start Session'}</button>
    <button class="btn-ghost" onclick="resetDwTimer()">↺ Reset</button>
    <button class="btn-ghost" onclick="skipDwSession()">⏭ Skip</button>
  </div>
  <div style="font-size:11px;color:var(--text-muted);margin-top:14px;">🔥 ${dw.sessCount||0} sessions today · ${Math.round((dw.todayMins||0)/60*10)/10}h focused</div>
</div>

<div class="grid grid-cols-4 gap-2.5 max-[1100px]:grid-cols-2 max-[780px]:grid-cols-1">
  <div class="card">
    <div class="card-header"><span class="card-title">Timer Settings</span></div>
    ${[['Focus (min)','focusMin'],['Short Break','shortMin'],['Long Break','longMin'],['Sessions','sessions']].map(([l,k])=>`
      <div class="input-group" style="margin-bottom:8px;"><label class="input-label">${l}</label>
        <input type="number" class="input-field" id="dw-set-${k}" value="${dw[k]}" min="1" onchange="applyDwSettings()"></div>`).join('')}
    <div style="display:flex;gap:4px;margin-top:8px;">
      ${[['focus','Focus'],['short','Short'],['long','Long']].map(([m,l])=>
        `<button class="sem-tab${dw.mode===m?' active':''}" style="flex:1;padding:5px 4px;font-size:10px;" onclick="setDwMode('${m}')">${l}</button>`).join('')}
    </div>
  </div>
  <div class="card" style="text-align:center;">
    <div class="card-header"><span class="card-title">Breathing</span></div>
    <div class="breathe-ring" id="breathe-ring"><span style="font-size:22px;">🧘</span></div>
    <div style="font-size:12px;color:var(--accent);font-weight:600;" id="breathe-label">Inhale (4s)</div>
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title">Session Stats</span></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
      ${[['Today',Math.round((dw.todayMins||0)/60*10)/10+'h','dw-st-today'],['Sessions',(dw.sessCount||0),'dw-st-sess'],['This Week',Math.round((dw.weekMins||0)/60*10)/10+'h','dw-st-week'],['All Time',Math.round((dw.allMins||0)/60)+'h','dw-st-all']].map(([l,v,id])=>
        `<div class="quick-stat" style="padding:7px;"><div class="quick-stat-label">${l}</div><div class="quick-stat-value" style="font-size:15px;" id="${id}">${v}</div></div>`).join('')}
    </div>
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title">Distraction Control</span></div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <span style="font-size:12px;">🧘 Monk Mode</span>
      <div class="toggle-switch${dw.monk?' on':''}" onclick="toggleMonk()"></div>
    </div>
    <div class="input-group" style="margin-bottom:10px;"><label class="input-label">Linked Project</label>
      <select class="input-field" id="dw-project" onchange="DB.dw.linkedProject=this.value;save()">
        <option value="">— None —</option>
        ${activeProjs.map(p=>`<option value="${p.id}"${dw.linkedProject==p.id?' selected':''}>${esc(p.name)}</option>`).join('')}
      </select></div>
    <div class="sec-title" style="margin-bottom:6px;">Recent Sessions</div>
    <div id="dw-log"></div>
  </div>
</div>

</div>`;

  updateDwDisplay(); rDwLog(); startBreathing();
}

export function applyDwSettings() {
  ['focusMin','shortMin','longMin','sessions'].forEach(k=>{
    const v=parseInt(val('dw-set-'+k)); if(v>0)DB.dw[k]=v;
  });
  if(!DB.dw.running) DB.dw.secs=dwSecsFor(DB.dw.mode);
  save(); updateDwDisplay(); showToast('Timer settings saved');
}

export function setDwMode(mode) {
  stopDwInterval(); DB.dw.running=false; DB.dw.mode=mode; DB.dw.secs=dwSecsFor(mode);
  save(); updateFocusPill(); rDeepwork();
}

function stopDwInterval() { if(_dwInterval){clearInterval(_dwInterval);_dwInterval=null;} }

// The countdown is anchored to a wall-clock deadline (endAt), not interval
// ticks — browsers throttle timers in background tabs, so decrementing a
// counter would drift badly. Recomputing from Date.now() is always exact.
function dwTick() {
  const dw=DB.dw;
  dw.secs=Math.max(0, Math.round((dw.endAt-Date.now())/1000));
  if(dw.secs<=0){ dwSessionComplete(); return; }
  const d=$('dw-display');
  if(d){const mm=Math.floor(dw.secs/60),ss=dw.secs%60; d.textContent=`${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;}
}

export function toggleDwTimer() {
  const dw=DB.dw;
  if(dw.running){
    dw.running=false;
    dw.secs=Math.max(0, Math.round((dw.endAt-Date.now())/1000));
    dw.endAt=null;
    stopDwInterval();
  }
  else {
    if(!dw.secs||dw.secs<=0) dw.secs=dwSecsFor(dw.mode);
    dw.running=true;
    dw.endAt=Date.now()+dw.secs*1000;
    stopDwInterval();
    _dwInterval=setInterval(dwTick, 500);
  }
  save(); updateFocusPill();
  if(_curPage==='deepwork') rDeepwork();
}

// Re-sync instantly when the tab regains focus (interval may have been throttled)
document.addEventListener('visibilitychange', ()=>{
  if(!document.hidden && DB.dw && DB.dw.running && DB.dw.endAt) dwTick();
});

export const dwToggle = toggleDwTimer;

function dwSessionComplete() {
  stopDwInterval();
  const dw=DB.dw; dw.running=false; dw.endAt=null;
  if(dw.mode==='focus'){
    const mins=dw.focusMin;
    dw.sessCount=(dw.sessCount||0)+1;
    dw.todayMins=(dw.todayMins||0)+mins;
    dw.weekMins=(dw.weekMins||0)+mins;
    dw.allMins=(dw.allMins||0)+mins;
    dw.dailyMins[today()]=(dw.dailyMins[today()]||0)+mins;
    let task='Deep work';
    if(dw.linkedProject){
      const p=DB.projects.find(x=>x.id==dw.linkedProject);
      if(p){ p.hoursLogged=Math.round(((p.hoursLogged||0)+mins/60)*10)/10; task=p.name; }
    }
    (dw.log=dw.log||[]).push({date:today(),mins,task,time:new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})});
    showToast('🎉 Session complete! Take a break.');
    dw.mode=(dw.sessCount%(dw.sessions||4)===0)?'long':'short';
  } else {
    showToast('Break over — back to focus!');
    dw.mode='focus';
  }
  dw.secs=dwSecsFor(dw.mode);
  save(); updateFocusPill();
  if(_curPage==='deepwork') rDeepwork();
}

export function resetDwTimer() { stopDwInterval(); DB.dw.running=false; DB.dw.endAt=null; DB.dw.secs=dwSecsFor(DB.dw.mode); save(); updateFocusPill(); rDeepwork(); }

export function skipDwSession() {
  if(DB.dw.running) DB.dw.endAt=Date.now();   // next tick completes it
  else { DB.dw.secs=0; dwSessionComplete(); }
}

function updateDwDisplay() {
  const dw=DB.dw;
  if(!dw.secs||dw.secs<0) dw.secs=dwSecsFor(dw.mode);
  const d=$('dw-display');
  if(d){const mm=Math.floor(dw.secs/60),ss=dw.secs%60; d.textContent=`${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;}
  const lbl=$('dw-session-label');
  if(lbl){
    const modeLbl=dw.mode==='focus'?'Focus':dw.mode==='short'?'Short Break':'Long Break';
    lbl.textContent=`Session ${(dw.sessCount%(dw.sessions||4))+1} of ${dw.sessions||4} · ${modeLbl}`;
  }
}

export function toggleMonk() { DB.dw.monk=!DB.dw.monk; save(); rDeepwork(); showToast(DB.dw.monk?'🧘 Monk Mode ON — stay focused':'Monk Mode off'); }

function rDwLog() {
  const el=$('dw-log'); if(!el)return;
  const log=(DB.dw.log||[]).slice(-6).reverse();
  el.innerHTML=log.length?log.map(s=>`
    <div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--border);font-size:11px;">
      <span style="color:var(--accent);">✓</span>
      <span style="color:var(--text-secondary);">${s.mins}min</span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-muted);">${esc(s.task)}</span>
      <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-ghost);">${esc(s.time||'')}</span>
    </div>`).join(''):'<div style="font-size:11px;color:var(--text-muted);padding:6px 0;">No sessions logged yet</div>';
}

let _breathePhase=0, _breatheTimer=null;
const B_PHASES=[{l:'Inhale (4s)',d:4000,scale:1.1},{l:'Hold (4s)',d:4000,scale:1.1},{l:'Exhale (6s)',d:6000,scale:0.85}];

function startBreathing() {
  if(_breatheTimer)clearTimeout(_breatheTimer);
  _breathePhase=0; nextBreathe();
}
function nextBreathe() {
  const ring=$('breathe-ring'), lbl=$('breathe-label');
  if(!ring||!lbl){ _breatheTimer=null; return; }
  const ph=B_PHASES[_breathePhase];
  lbl.textContent=ph.l;
  ring.style.transform=`scale(${ph.scale})`;
  ring.style.transitionDuration=(ph.d/1000)+'s';
  _breathePhase=(_breathePhase+1)%B_PHASES.length;
  _breatheTimer=setTimeout(nextBreathe, ph.d);
}
