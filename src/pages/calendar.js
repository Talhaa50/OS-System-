import { DB } from '../core/db.js';
import { save } from '../core/save.js';
import { $, esc, today } from '../core/utils.js';
import { showToast } from '../core/utils.js';

const CAL_COL={green:'var(--accent)',red:'var(--red)',amber:'var(--amber)',blue:'var(--blue)',purple:'var(--purple)',orange:'var(--orange)'};
const CAL_BG ={green:'rgba(34,197,94,0.10)',red:'rgba(248,113,113,0.10)',amber:'rgba(251,191,36,0.10)',blue:'rgba(96,165,250,0.10)',purple:'rgba(167,139,250,0.10)',orange:'rgba(251,146,60,0.10)'};

export function rCalendar() {
  const pg=$('page-calendar'); if(!pg) return;
  const y=DB.calYear, m=DB.calMonth;
  const now=new Date(), isCurMonth=now.getFullYear()===y&&now.getMonth()===m;
  const first=new Date(y,m,1).getDay(), days=new Date(y,m+1,0).getDate();
  const mName=new Date(y,m,1).toLocaleDateString('en-US',{month:'long',year:'numeric'});
  const evs=DB.calEvents||[];
  const evMap={};
  evs.forEach(e=>{ const d=new Date(e.date); if(d.getFullYear()===y&&d.getMonth()===m){ const dd=d.getDate(); (evMap[dd]=evMap[dd]||[]).push(e); } });

  let cells='';
  for(let i=0;i<first;i++) cells+='<div></div>';
  for(let d=1;d<=days;d++){
    const isT=isCurMonth&&d===now.getDate();
    const de=(evMap[d]||[]);
    const pills=de.slice(0,2).map(e=>`<div style="font-size:8.5px;padding:1px 4px;border-radius:3px;background:${CAL_BG[e.color]||CAL_BG.green};border-left:2px solid ${CAL_COL[e.color]||'var(--accent)'};color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;">${esc(e.title)}</div>`).join('');
    const more=de.length>2?`<div style="font-size:8px;color:var(--text-muted);margin-top:1px;">+${de.length-2} more</div>`:'';
    cells+=`<div style="min-height:64px;border:1px solid var(--border);border-radius:5px;padding:4px;${isT?'background:var(--accent-glow-strong);border-color:var(--accent);':''}">
      <div style="font-size:11px;font-weight:${isT?700:500};color:${isT?'var(--accent)':'var(--text-secondary)'};">${d}</div>${pills}${more}</div>`;
  }

  const tStr=today();
  const todayEvs=evs.filter(e=>e.date===tStr).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  const deadlines=evs.filter(e=>['Academic','Work'].includes(e.category)&&e.date>=tStr)
    .sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);

  pg.innerHTML=`<div style="max-width:1200px;margin:0 auto;width:100%;">
<div class="page-head">
  <div><div class="page-title">Calendar Overview</div><div class="page-subtitle">${mName}</div></div>
  <button class="btn-primary" onclick="openModal('calEvent')">+ Event</button>
</div>
<div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;align-items:start;">
  <div class="card">
    <div class="card-header">
      <span class="card-title">${mName}</span>
      <div style="display:flex;gap:5px;">
        <button class="card-action" onclick="calNav(-1)">‹ Prev</button>
        <button class="card-action" onclick="calNavToday()">Today</button>
        <button class="card-action" onclick="calNav(1)">Next ›</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:5px;">
      ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div style="text-align:center;font-size:9px;color:var(--text-ghost);font-weight:700;text-transform:uppercase;">${d}</div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">${cells}</div>
  </div>
  <div style="display:flex;flex-direction:column;gap:12px;">
    <div class="card">
      <div class="card-header"><span class="card-title">Today's Schedule</span></div>
      ${todayEvs.length?todayEvs.map(e=>`
        <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);">
          <span style="font-family:var(--font-mono);font-size:11px;color:${CAL_COL[e.color]||'var(--accent)'};min-width:42px;">${esc(e.time||'—')}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:12px;font-weight:500;">${esc(e.title)}</div>
            ${e.location?`<div style="font-size:10px;color:var(--text-muted);">📍 ${esc(e.location)}</div>`:''}
          </div>
          <span class="tag tag-${e.color||'green'}" style="font-size:8px;">${esc(e.category||'Other')}</span>
          <button class="todo-icon-btn" onclick="delCalEv(${e.id})">✕</button>
        </div>`).join(''):'<div style="padding:14px 0;text-align:center;color:var(--text-muted);font-size:12px;">Nothing scheduled today 🎉</div>'}
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">Upcoming Deadlines</span></div>
      ${deadlines.length?deadlines.map(e=>{
        const dl=Math.ceil((new Date(e.date)-new Date(tStr))/86400000);
        const chip=dl<5?'red':dl<10?'amber':'green';
        return `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);">
          <span class="tag tag-${chip}" style="min-width:44px;justify-content:center;">${dl}d</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:12px;font-weight:500;">${esc(e.title)}</div>
            <div style="font-size:10px;color:var(--text-muted);">${e.date}</div>
          </div></div>`;
      }).join(''):'<div style="padding:14px 0;text-align:center;color:var(--text-muted);font-size:12px;">No deadlines ahead</div>'}
    </div>
  </div>
</div></div>`;
}

export function calNav(dir) {
  DB.calMonth+=dir;
  if(DB.calMonth>11){DB.calMonth=0;DB.calYear++;}
  if(DB.calMonth<0) {DB.calMonth=11;DB.calYear--;}
  save(); rCalendar();
}

export function calNavToday() { DB.calYear=new Date().getFullYear(); DB.calMonth=new Date().getMonth(); save(); rCalendar(); }

export function delCalEv(id) { DB.calEvents=DB.calEvents.filter(e=>e.id!=id); save(); rCalendar(); showToast('Event removed'); }
