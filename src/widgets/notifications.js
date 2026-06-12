import { DB } from '../core/db.js';
import { $, esc, today, dayName } from '../core/utils.js';

// Live notification feed computed from real app data — no stored state.
export function buildNotifs(){
  const t=today(), list=[];
  (DB.calEvents||[]).filter(e=>e.date===t).forEach(e=>
    list.push({icon:'📅',text:esc(e.title)+' — today',page:'calendar'}));
  (DB.goals||[]).filter(g=>g.deadline&&g.status!=='done'&&g.deadline<t).forEach(g=>
    list.push({icon:'🎯',text:esc(g.title)+' — deadline passed',page:'goals',warn:true}));
  (DB.projects||[]).filter(p=>p.deadline&&p.status!=='done'&&p.deadline<t).forEach(p=>
    list.push({icon:'🚀',text:esc(p.name)+' — deadline passed',page:'projects',warn:true}));
  const left=(DB.todoWeek[dayName()]||[]).filter(x=>!x.done).length;
  if(left) list.push({icon:'✅',text:left+' task'+(left>1?'s':'')+' still open today',page:'todo'});
  const hLeft=(DB.habits||[]).filter(h=>!(h.doneHistory&&h.doneHistory[t])).length;
  if(hLeft) list.push({icon:'🔥',text:hLeft+' habit'+(hLeft>1?'s':'')+' not done yet',page:'habits'});
  if(!DB.lastBackup||Date.now()-DB.lastBackup>7*86400000)
    list.push({icon:'💾',text:'No backup in 7+ days — export your data',page:'settings',warn:true});
  return list;
}

export function updateNotifBadge(){
  const b=$('notif-badge'); if(!b) return;
  const n=buildNotifs().length;
  b.textContent=n>9?'9+':n;
  b.style.display=n?'flex':'none';
}

export function toggleNotifs(){
  const p=$('notif-panel'); if(!p) return;
  if(p.classList.contains('open')){ p.classList.remove('open'); return; }
  const list=buildNotifs();
  p.innerHTML=`<div class="notif-head">Notifications${list.length?` (${list.length})`:''}</div>`+
    (list.length?list.map(n=>`
      <div class="notif-item" onclick="navigate('${n.page}');toggleNotifs()">
        <span style="font-size:14px;">${n.icon}</span>
        <span style="flex:1;line-height:1.45;${n.warn?'color:var(--red);':'color:var(--text-secondary);'}">${n.text}</span>
        <span style="color:var(--text-muted);font-size:10px;">→</span>
      </div>`).join('')
    :'<div class="notif-empty">All clear — nothing needs you 🎉</div>');
  p.classList.add('open');
  updateNotifBadge();
}

export function closeNotifs(){
  const p=$('notif-panel');
  if(p&&p.classList.contains('open')){ p.classList.remove('open'); return true; }
  return false;
}
