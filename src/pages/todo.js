import { DB } from '../core/db.js';
import { save } from '../core/save.js';
import { $, esc, pct, dayName, DAYS, DAY_LABELS } from '../core/utils.js';
import { renderCalWidget } from '../widgets/calendar.js';
import { statCard } from '../widgets/statcard.js';

export function rTodo() {
  const pg=$('page-todo'); if(!pg) return;
  const dn=dayName();
  let total=0,done=0;
  DAYS.forEach(d=>{ const ts=DB.todoWeek[d]||[]; total+=ts.length; done+=ts.filter(t=>t.done).length; });
  const ntf=DB.ntfItems||[];

  pg.innerHTML=`<div style="max-width:1200px;margin:0 auto;width:100%;">

<div class="grid grid-cols-4 gap-2.5 max-[1100px]:grid-cols-2 max-[780px]:grid-cols-1" style="margin-bottom:16px;">
  ${statCard('📋','Total Tasks',total,'cyan')}
  ${statCard('✅','Done',done,'green')}
  ${statCard('⏳','Remaining',total-done,'amber')}
  ${statCard('','Completion',pct(done,total)+'%','cyan',{ring:pct(done,total)})}
</div>

<div style="display:flex;gap:12px;align-items:flex-start;">

<div style="width:210px;flex-shrink:0;display:flex;flex-direction:column;gap:12px;">
  <div class="card">
    <div class="card-header"><span class="card-title">Not-to-Forget</span></div>
    ${ntf.map(n=>`
      <div style="display:flex;align-items:flex-start;gap:6px;padding:5px 0;border-bottom:1px solid var(--border);">
        <span style="font-size:13px;margin-top:1px;">🔔</span>
        <span style="flex:1;font-size:12px;color:var(--text-secondary);line-height:1.4;">${esc(n.text)}</span>
        <button class="todo-icon-btn" style="font-size:10px;" onclick="delNTF(${n.id})">✕</button>
      </div>`).join('')}
    <div style="margin-top:8px;display:flex;gap:5px;">
      <input id="ntf-input" class="todo-add-input" style="flex:1;font-size:11px;" placeholder="Add reminder..." onkeydown="if(event.key==='Enter')saveNTF()">
      <button class="btn-ghost" style="padding:5px 8px;font-size:11px;" onclick="saveNTF()">+</button>
    </div>
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title">Calendar</span></div>
    <div id="todo-cal"></div>
  </div>
</div>

<div style="flex:1;min-width:0;overflow-x:auto;">
  <div style="display:flex;gap:8px;min-width:700px;">
  ${DAYS.map((d,i)=>{
    const isToday=d===dn;
    const tasks=DB.todoWeek[d]||[];
    const dDone=tasks.filter(t=>t.done).length;
    return `
    <div class="${isToday?'day-today':''}" style="flex:1;min-width:110px;background:${isToday?'var(--bg-card-hover)':'var(--bg-card)'};border:1px solid ${isToday?'var(--border-mid)':'var(--border)'};border-radius:var(--radius-md);padding:10px;">
      <div style="font-family:var(--font-display);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${isToday?'var(--accent)':'var(--text-muted)'};margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;">
        <span style="display:flex;align-items:center;">${DAY_LABELS[i]}${isToday?'<span class="today-pill">TODAY</span>':''}</span><span style="font-size:9px;color:${isToday?'var(--text-muted)':'var(--text-ghost)'};">${dDone}/${tasks.length}</span>
      </div>
      <div>
      ${tasks.map(t=>`
        <div style="display:flex;align-items:flex-start;gap:5px;padding:3px 0;border-bottom:1px solid var(--border);">
          <div class="todo-check${t.done?' done':''}" style="margin-top:1px;width:13px;height:13px;min-width:13px;" onclick="toggleTask('${d}',${t.id})">
            ${t.done?'<svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4l2 2 3-3.5" stroke="#021a07" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>':''}
          </div>
          <span style="flex:1;font-size:11px;line-height:1.35;${t.done?'text-decoration:line-through;color:var(--text-muted);':''}">${esc(t.text)}</span>
          <button class="todo-icon-btn" style="width:14px;height:14px;font-size:9px;opacity:0.4;" onclick="delTask('${d}',${t.id})">✕</button>
        </div>`).join('')}
      </div>
      <input class="todo-add-input" style="margin-top:6px;font-size:11px;padding:5px 7px;" placeholder="+ Add task"
        onkeydown="if(event.key==='Enter'&&this.value.trim()){addTask('${d}',this.value.trim());this.value='';}">
    </div>`;
  }).join('')}
  </div>
</div>

</div></div>`;

  renderCalWidget('todo-cal');
}

export function toggleTask(day, id) {
  const t=(DB.todoWeek[day]||[]).find(x=>x.id==id); if(!t) return;
  t.done=!t.done; save(); rTodo();
}

export function addTask(day, text) {
  if(!text) return;
  DB.todoNextId=(DB.todoNextId||200)+1;
  if(!DB.todoWeek[day])DB.todoWeek[day]=[];
  DB.todoWeek[day].push({id:DB.todoNextId,text,done:false}); save(); rTodo();
}

export function delTask(day, id) {
  DB.todoWeek[day]=(DB.todoWeek[day]||[]).filter(t=>t.id!=id); save(); rTodo();
}

export function saveNTF() {
  const v=(()=>{ const e=$('ntf-input'); return e?e.value.trim():''; })();
  if(!v) return;
  DB.ntfNextId=(DB.ntfNextId||20)+1;
  DB.ntfItems.push({id:DB.ntfNextId,text:v});
  save(); rTodo();
}

export function delNTF(id) {
  DB.ntfItems=DB.ntfItems.filter(n=>n.id!=id); save(); rTodo();
}
