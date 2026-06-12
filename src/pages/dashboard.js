import { DB } from '../core/db.js';
import { save } from '../core/save.js';
import { $, esc, pkr, dayName, today, pct, localISO } from '../core/utils.js';
import { isDoneToday, totalIncome, totalExpenses, computeExpDonut } from '../core/helpers.js';
import { renderCalWidget } from '../widgets/calendar.js';
import { renderDonut } from '../widgets/donut.js';
import { renderQuotes } from '../widgets/quotes.js';
import { renderWater } from '../widgets/water.js';
import { renderHeatmap } from '../widgets/heatmap.js';
import { renderCountdown } from '../widgets/countdown.js';

export function rDashboard() {
  const pg=$('page-dashboard'); if(!pg) return;
  const dn=dayName();
  const todayTasks=DB.todoWeek[dn]||[];
  const doneHabits=(DB.habits||[]).filter(h=>isDoneToday(h)).length;
  const activeGoals=(DB.goals||[]).filter(g=>g.status!=='done').length;
  const activeProjs=(DB.projects||[]).filter(p=>p.status==='in-progress').length;
  const bal=totalIncome()-totalExpenses();

  const week7=[];
  for(let i=6;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    const ds=localISO(d);
    week7.push({mins:(DB.dw.dailyMins||{})[ds]||0,lbl:'SMTWTFS'[d.getDay()],isToday:i===0});
  }
  const maxW=Math.max(...week7.map(x=>x.mins),60);
  const weekTotal=Math.round(week7.reduce((s,x)=>s+x.mins,0)/60*10)/10;

  // Up Next digest
  const t=today();
  const whenLbl=ds=>{
    const days=Math.round((new Date(ds)-new Date(t))/86400000);
    return days<=0?'today':days===1?'tmrw':'in '+days+'d';
  };
  const nextEv=(DB.calEvents||[]).filter(e=>e.date>=t).sort((a,b)=>a.date.localeCompare(b.date))[0];
  const nextDl=[
    ...(DB.goals||[]).filter(g=>g.deadline&&g.status!=='done').map(g=>({icon:'🎯',label:g.title,date:g.deadline,page:'goals'})),
    ...(DB.projects||[]).filter(p=>p.deadline&&p.status!=='done').map(p=>({icon:'🚀',label:p.name,date:p.deadline,page:'projects'}))
  ].filter(d=>d.date>=t).sort((a,b)=>a.date.localeCompare(b.date))[0];
  const tasksLeft=todayTasks.filter(x=>!x.done).length;
  const bestStreak=Math.max(...(DB.habits||[]).map(h=>h.streak),0);
  const upnextRows=[
    nextEv?`<div class="upnext-row" onclick="navigate('calendar')"><span>📅</span><span class="upnext-label">${esc(nextEv.title)}</span><span class="upnext-when">${whenLbl(nextEv.date)}</span></div>`:'',
    nextDl?`<div class="upnext-row" onclick="navigate('${nextDl.page}')"><span>${nextDl.icon}</span><span class="upnext-label">${esc(nextDl.label)}</span><span class="upnext-when">${whenLbl(nextDl.date)}</span></div>`:'',
    `<div class="upnext-row" onclick="navigate('todo')"><span>✅</span><span class="upnext-label">${tasksLeft?tasksLeft+' task'+(tasksLeft>1?'s':'')+' left today':'All tasks done today'}</span><span class="upnext-when">${tasksLeft?'open':'✓'}</span></div>`,
    `<div class="upnext-row" onclick="navigate('habits')"><span>🔥</span><span class="upnext-label">Best streak</span><span class="upnext-when">${bestStreak} days</span></div>`
  ].filter(Boolean).join('');

  pg.innerHTML=`<div style="max-width:1200px;margin:0 auto;width:100%;">

<div style="background:radial-gradient(ellipse 420px 220px at 92% -20%,rgba(34,211,238,0.08),transparent 60%),radial-gradient(ellipse 380px 200px at 8% 120%,rgba(34,197,94,0.07),transparent 60%),linear-gradient(135deg,var(--bg-elevated),var(--bg-card));border:1px solid var(--border-mid);border-radius:var(--radius-lg);padding:20px 24px;margin-bottom:16px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.04);">
  <div style="display:flex;gap:24px;flex-wrap:wrap;">
    <div style="flex:1;min-width:280px;">
      <div style="font-size:12px;color:var(--text-muted);" id="hero-greeting">Good morning,</div>
      <div style="font-family:var(--font-display);font-size:26px;font-weight:800;color:var(--text-primary);line-height:1.1;margin:2px 0 4px;"><span id="hero-name">${esc(DB.username||'Zyrax')}</span> 👋</div>
      <div style="font-size:12px;color:var(--text-secondary);" id="hero-date"></div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;">
        <div class="stat-chip" onclick="navigate('todo')" title="To-Do"><span class="chip-icon">✅</span><span class="chip-val">${todayTasks.filter(t=>t.done).length}/${todayTasks.length}</span><span class="chip-lbl">Tasks Today</span></div>
        <div class="stat-chip" onclick="navigate('habits')" title="Habits"><span class="chip-icon">🔥</span><span class="chip-val">${doneHabits}/${(DB.habits||[]).length}</span><span class="chip-lbl">Habits Done</span></div>
        <div class="stat-chip" onclick="navigate('goals')" title="Goals"><span class="chip-icon">🎯</span><span class="chip-val">${activeGoals}</span><span class="chip-lbl">Active Goals</span></div>
        <div class="stat-chip" onclick="navigate('projects')" title="Projects"><span class="chip-icon">🚀</span><span class="chip-val">${activeProjs}</span><span class="chip-lbl">Projects</span></div>
        <div class="stat-chip" onclick="navigate('finance')" title="Finance"><span class="chip-icon">💰</span><span class="chip-val" style="font-size:13px;">${pkr(bal)}</span><span class="chip-lbl">Balance</span></div>
      </div>
    </div>
    <div style="width:280px;min-width:240px;border-left:1px solid var(--border);padding-left:20px;display:flex;flex-direction:column;">
      <div style="font-size:9.5px;text-transform:uppercase;letter-spacing:0.12em;color:var(--text-muted);font-weight:700;margin-bottom:4px;">⚡ Up Next</div>
      ${upnextRows}
    </div>
  </div>
</div>

<div class="grid grid-cols-2 gap-3 max-[780px]:grid-cols-1" style="margin-bottom:12px;">
  <div class="card card-zoomable" ondblclick="openZoom('countdown')" title="Double-click for fullscreen">
    <div class="card-header"><span class="card-title">Time Remaining</span><span style="font-size:11px;color:var(--text-muted);">⤢</span></div>
    <div id="dash-countdown"></div>
  </div>
  <div class="card card-zoomable" ondblclick="openZoom('focus')" title="Double-click for fullscreen">
    <div class="card-header"><span class="card-title">Focus — Last 7 Days</span><span style="display:flex;gap:10px;align-items:center;"><span style="font-size:11px;font-family:var(--font-mono);color:var(--accent);">${weekTotal}h</span><span style="font-size:11px;color:var(--text-muted);">⤢</span></span></div>
    <div class="bar-chart" style="height:104px;">
      ${week7.map(d=>`<div class="bar-wrap">
        <div class="bar${d.isToday?' highlighted':''}" style="height:${Math.round(d.mins/maxW*82)+4}px;" title="${Math.round(d.mins/60*10)/10}h focused"></div>
        <div class="bar-lbl">${d.lbl}</div></div>`).join('')}
    </div>
  </div>
</div>

<div class="grid grid-cols-2 gap-3 max-[780px]:grid-cols-1" style="margin-bottom:12px;">
  <div class="card">
    <div class="card-header"><span class="card-title">Today's Habits</span><button class="card-action" onclick="navigate('habits')">All →</button></div>
    <div id="dash-habits">
    ${(DB.habits||[]).map(h=>`
      <div class="habit-row" onclick="toggleHabit(${h.id})">
        <div class="habit-checkbox${isDoneToday(h)?' done':''}"><svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 2.5" stroke="#021a07" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg></div>
        <span style="font-size:16px;">${h.icon}</span>
        <span style="flex:1;font-size:12.5px;${isDoneToday(h)?'text-decoration:line-through;color:var(--text-muted);':''}">${esc(h.name)}</span>
        <span style="font-size:11px;color:var(--text-muted);">🔥 ${h.streak}</span>
      </div>`).join('')}
    </div>
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title">Today's Tasks</span><button class="card-action" onclick="navigate('todo')">All →</button></div>
    ${todayTasks.length ? todayTasks.map(t=>`
      <div class="todo-task-item">
        <div class="todo-check${t.done?' done':''}" onclick="dashToggleTask('${dn}',${t.id})" style="width:14px;height:14px;min-width:14px;">${t.done?'<svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4l2 2 3-3.5" stroke="#021a07" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>':''}</div>
        <span class="todo-task-text${t.done?' done':''}">${esc(t.text)}</span>
      </div>`).join('')
      : '<div style="padding:16px 0;text-align:center;color:var(--text-muted);font-size:12px;">No tasks for today</div>'}
  </div>
</div>

<div class="grid grid-cols-2 gap-3 max-[780px]:grid-cols-1" style="margin-bottom:12px;">
  <div class="card">
    <div class="card-header"><span class="card-title">Calendar</span><button class="card-action" onclick="navigate('calendar')">Full →</button></div>
    <div id="dash-cal"></div>
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title">Quick Actions</span></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      ${[['➕ Task','task'],['💰 Expense','expense'],['🎯 Goal','goal'],['🚀 Project','project'],['📖 Habit','habit'],['📚 Book','book']].map(([l,t])=>
        `<button class="btn-ghost" style="text-align:left;padding:10px 12px;font-size:12px;" onclick="openModal('${t}')">${l}</button>`).join('')}
    </div>
  </div>
</div>

<div class="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-2 max-[780px]:grid-cols-1" style="margin-bottom:12px;">
  <div class="card">
    <div class="card-header"><span class="card-title">Spending</span><button class="card-action" onclick="navigate('finance')">Finance →</button></div>
    <div style="display:flex;gap:12px;align-items:center;">
      <canvas id="dash-donut" width="80" height="80"></canvas>
      <div id="dash-donut-legend" style="flex:1;min-width:0;font-size:11px;"></div>
    </div>
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title">Motivation</span></div>
    <div id="dash-quotes"></div>
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title">Hydration</span><span style="font-size:11px;color:var(--blue);">${DB.water||0}/8</span></div>
    <div id="water-widget" style="display:flex;flex-wrap:wrap;gap:5px;"></div>
  </div>
</div>

<div class="card" style="margin-bottom:12px;">
  <div class="card-header"><span class="card-title">Consistency — Past Year</span></div>
  <div id="dash-heatmap"></div>
</div>

<div class="card">
  <div class="card-header"><span class="card-title">Journal — Today</span><span style="font-size:10px;color:var(--text-muted);">Auto-saved</span></div>
  <textarea id="dash-journal" class="input-field" rows="4" placeholder="What's on your mind today?"  style="resize:vertical;">${esc(DB.journal[today()]||'')}</textarea>
</div>

</div>`;

  renderCountdown('dash-countdown');
  renderCalWidget('dash-cal');
  const segs=computeExpDonut();
  renderDonut('dash-donut',segs,80);
  const leg=$('dash-donut-legend');
  if(leg) leg.innerHTML=segs.length
    ? segs.map(s=>`<div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;"><div style="width:7px;height:7px;border-radius:50%;background:${s.color};flex-shrink:0;"></div><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(s.label)}</span><span style="margin-left:auto;color:var(--text-muted);">${pkr(s.value)}</span></div>`).join('')
    : '<div style="color:var(--text-muted);">No expenses yet</div>';
  renderQuotes('dash-quotes');
  renderWater();
  renderHeatmap('dash-heatmap');
  const j=$('dash-journal');
  if(j) j.addEventListener('input',()=>{ DB.journal[today()]=j.value; save(); });
}

export function dashToggleTask(day, id) {
  const t=(DB.todoWeek[day]||[]).find(x=>x.id==id); if(!t) return;
  t.done=!t.done; save(); rDashboard();
}
