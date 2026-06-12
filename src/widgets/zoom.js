import { DB } from '../core/db.js';
import { $, localISO } from '../core/utils.js';
import { renderCountdown } from './countdown.js';

// Fullscreen zoom for dashboard cards (double-click to open).
// 'countdown' → giant live wall-clock countdown
// 'focus'     → expanded 30-day focus chart with stats

export function openZoom(type){
  const ov=$('zoom-overlay'), box=$('zoom-box');
  if(!ov||!box) return;
  ov.dataset.type=type;
  if(type==='countdown'){
    box.innerHTML=`<div class="cd-xl" id="zoom-cd"></div><div class="zoom-hint">double-click anywhere or press Esc to close</div>`;
    // the live updater targets element IDs — blank the dashboard copy so they don't collide
    const dc=$('dash-countdown'); if(dc) dc.innerHTML='';
    renderCountdown('zoom-cd');
  } else {
    box.innerHTML=focusZoomHTML();
  }
  ov.classList.add('open');
}

export function closeZoom(){
  const ov=$('zoom-overlay');
  if(!ov||!ov.classList.contains('open')) return false;
  ov.classList.remove('open');
  const wasCountdown=ov.dataset.type==='countdown';
  const box=$('zoom-box'); if(box) box.innerHTML='';
  if(wasCountdown){ const dc=$('dash-countdown'); if(dc) renderCountdown('dash-countdown'); }
  return true;
}

function focusZoomHTML(){
  const days=[];
  for(let i=29;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    const ds=localISO(d);
    days.push({mins:(DB.dw.dailyMins||{})[ds]||0,
      lbl:d.getDate(), m:d.toLocaleDateString('en-US',{month:'short'}), isToday:i===0});
  }
  const max=Math.max(...days.map(x=>x.mins),60);
  const total=days.reduce((s,x)=>s+x.mins,0);
  const active=days.filter(x=>x.mins>0).length;
  const best=Math.max(...days.map(x=>x.mins));
  const h=m=>Math.round(m/60*10)/10+'h';

  return `<div class="card" style="padding:28px;">
    <div style="display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:8px;">
      <div style="font-family:var(--font-display);font-size:20px;font-weight:700;">Focus — Last 30 Days</div>
      <div style="display:flex;gap:18px;font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">
        <span>total <b style="color:var(--accent);">${h(total)}</b></span>
        <span>avg/day <b style="color:var(--accent);">${h(Math.round(total/30))}</b></span>
        <span>best <b style="color:var(--cyan);">${h(best)}</b></span>
        <span>active days <b style="color:var(--accent);">${active}/30</b></span>
      </div>
    </div>
    <div class="bar-chart" style="height:min(46vh,380px);gap:5px;">
      ${days.map(d=>`<div class="bar-wrap">
        <div style="font-size:9px;font-family:var(--font-mono);color:var(--text-muted);">${d.mins?h(d.mins):''}</div>
        <div class="bar${d.isToday?' highlighted':''}" style="height:${Math.round(d.mins/max*88)+3}%;" title="${d.m} ${d.lbl}: ${h(d.mins)}"></div>
        <div class="bar-lbl">${d.lbl===1||d.isToday||d.lbl%5===0?d.lbl:''}</div>
      </div>`).join('')}
    </div>
    <div class="zoom-hint">double-click anywhere or press Esc to close</div>
  </div>`;
}
