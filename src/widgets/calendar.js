import { DB } from '../core/db.js';
import { $, esc } from '../core/utils.js';

export function renderCalWidget(containerId) {
  const el = $(containerId); if (!el) return;
  const now=new Date(), y=now.getFullYear(), m=now.getMonth(), td=now.getDate();
  const first=new Date(y,m,1).getDay(), days=new Date(y,m+1,0).getDate();
  const mName=now.toLocaleDateString('en-US',{month:'long',year:'numeric'});

  const evMap={};
  (DB.calEvents||[]).filter(e=>{ const d=new Date(e.date); return d.getFullYear()===y&&d.getMonth()===m; })
    .forEach(e=>{ const d=new Date(e.date).getDate(); if(!evMap[d])evMap[d]=[]; evMap[d].push(e.color||'green'); });

  const colorVar={green:'var(--accent)',red:'var(--red)',amber:'var(--amber)',blue:'var(--blue)',purple:'var(--purple)',orange:'var(--orange)'};

  let s='<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:6px;">';
  ['S','M','T','W','T','F','S'].forEach(d=>s+=`<div style="text-align:center;font-size:9px;color:var(--text-ghost);font-weight:600;">${d}</div>`);
  s+='</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">';
  for(let i=0;i<first;i++)s+='<div></div>';
  for(let d=1;d<=days;d++){
    const isT=d===td, ev=evMap[d];
    const dot=ev&&!isT?`<div style="width:4px;height:4px;border-radius:50%;background:${colorVar[ev[0]]||'var(--accent)'};"></div>`:'';
    s+=`<div${isT?' class="cal-today"':''} style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:3px 2px;border-radius:4px;cursor:pointer;${isT?'background:var(--accent);':''}font-size:11px;font-weight:${isT?700:400};color:${isT?'#021a07':'var(--text-secondary)'};">${d}${dot}</div>`;
  }
  s+='</div>';
  el.innerHTML=`<div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;font-family:var(--font-display);">${mName}</div>${s}`;
}
