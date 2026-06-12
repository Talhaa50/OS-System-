import { DB } from '../core/db.js';
import { $ } from '../core/utils.js';
import { save } from '../core/save.js';
import { showToast } from '../core/utils.js';

export function renderWater() {
  const el=$('water-widget'); if(!el) return;
  const n=DB.water||0;
  el.innerHTML=Array.from({length:8},(_,i)=>`
    <div onclick="setWater(${i+1})" style="width:26px;height:32px;border-radius:3px 3px 5px 5px;
      background:${i<n?'rgba(96,165,250,0.30)':'var(--bg-elevated)'};
      border:1px solid ${i<n?'rgba(96,165,250,0.45)':'var(--border)'};
      cursor:pointer;transition:all 0.15s;display:flex;align-items:center;justify-content:center;
      font-size:12px;opacity:${i<n?1:0.4};">💧</div>`).join('');
}

export function setWater(n) {
  DB.water = DB.water===n ? n-1 : n;
  if(DB.water<0)DB.water=0;
  save(); renderWater(); showToast(`Water: ${DB.water}/8 cups`);
}
