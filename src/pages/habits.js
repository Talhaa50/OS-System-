import { DB } from '../core/db.js';
import { save } from '../core/save.js';
import { $, esc, html, today, pct } from '../core/utils.js';
import { showToast } from '../core/utils.js';
import { _curPage } from '../core/router.js';
import { recalcStreaks } from '../core/reset.js';
import { isDoneToday, habitMonthPct } from '../core/helpers.js';
import { renderHeatmap } from '../widgets/heatmap.js';
import { statCard } from '../widgets/statcard.js';

export function rHabits() {
  const pg=$('page-habits'); if(!pg) return;
  const hs=DB.habits||[];
  const doneToday=hs.filter(h=>isDoneToday(h)).length;
  const avgStreak=hs.length?Math.round(hs.reduce((s,h)=>s+h.streak,0)/hs.length):0;
  const bestStreak=hs.length?Math.max(...hs.map(h=>h.streak)):0;
  const COL={green:'var(--accent)',blue:'var(--blue)',amber:'var(--amber)',purple:'var(--purple)',red:'var(--red)',orange:'var(--orange)'};

  pg.innerHTML=`<div style="max-width:900px;margin:0 auto;width:100%;">

<div class="grid grid-cols-4 gap-2.5 max-[1100px]:grid-cols-2 max-[780px]:grid-cols-1" style="margin-bottom:16px;">
  ${statCard('📋','Total Habits',hs.length,'cyan')}
  ${statCard('✅','Done Today',`${doneToday}/${hs.length}`,'green')}
  ${statCard('🔥','Avg Streak',avgStreak+' days','green')}
  ${statCard('🏆','Best Streak',bestStreak+' days','amber')}
</div>

<div class="card" style="margin-bottom:12px;">
  <div class="card-header"><span class="card-title">Daily Habits</span><button class="card-action" onclick="openModal('habit')">+ Add Habit</button></div>
  <div>
  ${hs.length ? hs.map(h=>{
    const done=isDoneToday(h), mp=habitMonthPct(h), col=COL[h.color]||'var(--accent)';
    return `
    <div class="habit-row" onclick="toggleHabit(${h.id})">
      <div class="habit-checkbox${done?' done':''}" style="${done?`background:${col};border-color:${col};`:''}">
        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 2.5" stroke="#021a07" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
      </div>
      <span style="font-size:18px;">${h.icon}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:500;${done?'text-decoration:line-through;color:var(--text-muted);':''}">${esc(h.name)}</div>
        <div style="margin-top:4px;"><div class="progress-track" style="height:4px;"><div class="progress-fill ${h.color}" style="width:${mp}%;"></div></div></div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">Month: ${mp}%</div>
      </div>
      <div style="text-align:center;min-width:52px;">
        <div style="font-size:13px;font-family:var(--font-display);font-weight:700;color:${col};">🔥 ${h.streak}</div>
        <div style="font-size:9px;color:var(--text-muted);">streak</div>
      </div>
      <div style="display:flex;gap:4px;" class="h-acts" onclick="event.stopPropagation()">
        <button class="todo-icon-btn" onclick="editHabit(${h.id})" title="Edit">✏️</button>
        <button class="todo-icon-btn" onclick="delHabit(${h.id})" title="Delete">🗑️</button>
      </div>
    </div>`;
  }).join('') : '<div class="empty-state"><div class="empty-icon">🌱</div><div class="empty-text">No habits yet. Add your first!</div></div>'}
  </div>
</div>

<div class="card" style="margin-bottom:12px;">
  <div class="card-header"><span class="card-title">Consistency — Past Year</span></div>
  <div id="habits-heatmap"></div>
</div>

<div class="card">
  <div class="card-header"><span class="card-title">Hydration Today</span><span style="font-size:11px;color:var(--blue);">${DB.water||0}/8 cups</span></div>
  <div id="habits-water" style="display:flex;flex-wrap:wrap;gap:6px;"></div>
</div>

</div>`;

  pg.querySelectorAll('.habit-row').forEach(row=>{
    const acts=row.querySelector('.h-acts');
    if(!acts) return;
    row.addEventListener('mouseenter',()=>acts.style.opacity='1');
    row.addEventListener('mouseleave',()=>acts.style.opacity='0');
    acts.style.opacity='0';
  });

  renderHeatmap('habits-heatmap');
  const hw=$('habits-water');
  if(hw) {
    const n=DB.water||0;
    hw.innerHTML=Array.from({length:8},(_,i)=>`
      <div onclick="setWater(${i+1});if(_curPage==='habits')rHabits();"
        style="width:30px;height:38px;border-radius:3px 3px 6px 6px;background:${i<n?'rgba(96,165,250,0.30)':'var(--bg-elevated)'};
        border:1px solid ${i<n?'rgba(96,165,250,0.45)':'var(--border)'};cursor:pointer;
        display:flex;align-items:center;justify-content:center;font-size:14px;opacity:${i<n?1:0.5};">💧</div>`).join('');
  }
}

export function toggleHabit(id) {
  const h=DB.habits.find(x=>x.id==id); if(!h) return;
  if(!h.doneHistory)h.doneHistory={};
  h.doneHistory[today()]=!h.doneHistory[today()];
  recalcStreaks(); save();
  if(_curPage==='habits') rHabits();
  else if(_curPage==='dashboard') window.rDashboard?.();
  showToast(h.doneHistory[today()]?`${h.icon} ${h.name} — done!`:`${h.icon} ${h.name} — unmarked`);
}

export function editHabit(id) {
  const h=DB.habits.find(x=>x.id==id); if(!h) return;
  DB.editCtx={type:'habit',id};
  html('edit-modal-title','Edit Habit');
  html('edit-modal-body',`
    <div class="input-group"><label class="input-label">Icon</label>
      <input class="input-field" id="eh_icon" value="${esc(h.icon||'')}"></div>
    <div class="input-group"><label class="input-label">Name</label>
      <input class="input-field" id="eh_name" value="${esc(h.name)}"></div>
    <div class="input-group"><label class="input-label">Color</label>
      <select class="input-field" id="eh_color">${['green','blue','amber','purple','red','orange'].map(c=>`<option value="${c}"${h.color===c?' selected':''}>${c}</option>`).join('')}</select></div>`);
  $('editModalOverlay').classList.add('open');
}

export function delHabit(id) {
  if(!confirm('Delete this habit?')) return;
  DB.habits=DB.habits.filter(x=>x.id!=id); save();
  rHabits(); if(_curPage==='dashboard') window.rDashboard?.(); showToast('Habit deleted');
}
