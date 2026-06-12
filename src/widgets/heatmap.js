import { DB } from '../core/db.js';
import { $, localISO } from '../core/utils.js';

export function renderHeatmap(containerId) {
  const el=$(containerId); if(!el) return;
  const now=new Date(), start=new Date(now); start.setDate(start.getDate()-364);
  const dayMap={};
  (DB.habits||[]).forEach(h=>Object.keys(h.doneHistory||{}).forEach(ds=>{ if(h.doneHistory[ds]) dayMap[ds]=(dayMap[ds]||0)+1; }));
  const mx=(DB.habits||[]).length||5;
  let cells='';
  for(let i=0;i<371;i++){
    const d=new Date(start); d.setDate(start.getDate()+i); if(d>now)break;
    const ds=localISO(d), c=dayMap[ds]||0;
    let l=0;
    if(c>=1)l=1; if(c>=Math.ceil(mx*.4))l=2; if(c>=Math.ceil(mx*.7))l=3; if(c>=mx)l=4;
    cells+=`<div class="heatmap-cell${l?' l'+l:''}" title="${ds}: ${c} habits done"></div>`;
  }
  el.innerHTML=`<div class="heatmap-grid">${cells}</div>`;
}
