import { DB } from '../core/db.js';
import { save } from '../core/save.js';
import { $, esc, pct, clamp, html } from '../core/utils.js';
import { showToast } from '../core/utils.js';
import { statCard } from '../widgets/statcard.js';

export function rGoals() {
  const pg=$('page-goals'); if(!pg) return;
  const gs=DB.goals||[];
  const active=gs.filter(g=>g.status!=='done');
  const done=gs.filter(g=>g.status==='done');
  const cats={};
  gs.forEach(g=>{ cats[g.cat]=(cats[g.cat]||0)+1; });

  pg.innerHTML=`<div style="max-width:1000px;margin:0 auto;width:100%;">

<div class="grid grid-cols-4 gap-2.5 max-[1100px]:grid-cols-2 max-[780px]:grid-cols-1" style="margin-bottom:16px;">
  ${statCard('🎯','Total Goals',gs.length,'cyan')}
  ${statCard('✅','On Track',gs.filter(g=>g.status==='on-track').length,'green')}
  ${statCard('⚠️','At Risk',gs.filter(g=>g.status==='at-risk').length,'amber')}
  ${statCard('🏆','Completed',done.length,'green')}
</div>

<div class="card" style="margin-bottom:12px;">
  <div class="card-header"><span class="card-title">Active Goals</span><button class="card-action" onclick="openModal('goal')">+ Add Goal</button></div>
  ${active.length ? `<div style="display:flex;flex-direction:column;gap:10px;">
  ${active.map(g=>`
    <div class="goal-card">
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <span style="font-size:22px;margin-top:2px;">${g.icon||'🎯'}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13.5px;font-weight:600;margin-bottom:4px;">${esc(g.title)}</div>
          <div style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
            <span class="tag tag-${g.status==='on-track'?'green':g.status==='at-risk'?'amber':'blue'}">${g.status}</span>
            <span class="tag tag-blue">${esc(g.cat)}</span>
            ${g.deadline?`<span style="font-size:10px;color:var(--text-muted);">📅 ${g.deadline}</span>`:''}
          </div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
            <div style="flex:1;"><div class="progress-track"><div class="progress-fill" style="width:${g.pct||0}%;"></div></div></div>
            <input type="number" value="${g.pct||0}" min="0" max="100" onchange="updateGoalPct(${g.id},this.value)"
              style="width:52px;background:var(--bg-elevated);border:1px solid var(--border-soft);border-radius:4px;color:var(--text-primary);padding:2px 5px;font-size:12px;text-align:center;outline:none;">
            <span style="font-size:11px;color:var(--text-muted);">%</span>
          </div>
          ${g.currentVal!=null?`<div style="font-size:11px;color:var(--text-muted);">Progress: ${g.currentVal} / ${g.targetVal||'—'}</div>`:''}
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0;">
          <button class="card-action" onclick="markGoalDone(${g.id})">✓ Done</button>
          <button class="card-action" onclick="editGoal(${g.id})">Edit</button>
          <button style="font-size:11px;color:var(--red);border:1px solid rgba(248,113,113,0.2);border-radius:var(--radius-sm);padding:3px 8px;cursor:pointer;background:transparent;" onclick="delGoal(${g.id})">Delete</button>
        </div>
      </div>
    </div>`).join('')}
  </div>`
  : '<div class="empty-state"><div class="empty-icon">🎯</div><div class="empty-text">No active goals. Set your first goal!</div></div>'}
</div>

${done.length?`
<div class="card" style="margin-bottom:12px;">
  <div class="card-header"><span class="card-title">Completed Goals (${done.length})</span></div>
  ${done.map(g=>`
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);opacity:0.6;">
      <span>${g.icon||'🎯'}</span>
      <span style="flex:1;font-size:12.5px;text-decoration:line-through;color:var(--text-muted);">${esc(g.title)}</span>
      <button class="card-action" onclick="reopenGoal(${g.id})">Reopen</button>
      <button style="font-size:11px;color:var(--red);border:1px solid rgba(248,113,113,0.2);border-radius:4px;padding:2px 7px;cursor:pointer;background:transparent;" onclick="delGoal(${g.id})">Del</button>
    </div>`).join('')}
</div>`:''}

<div class="card">
  <div class="card-header"><span class="card-title">By Category</span></div>
  <div class="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-2 max-[780px]:grid-cols-1">
    ${Object.entries(cats).map(([cat,count])=>`
      <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;">
        <div style="font-size:11px;color:var(--text-muted);">${esc(cat)}</div>
        <div style="font-family:var(--font-display);font-size:20px;font-weight:700;">${count}</div>
        <div style="font-size:10px;color:var(--text-muted);">${pct(count,gs.length||1)}% of goals</div>
      </div>`).join('')}
  </div>
</div>

</div>`;
}

export function updateGoalPct(id, v) {
  const g=DB.goals.find(x=>x.id==id); if(!g) return;
  g.pct=clamp(parseInt(v)||0,0,100); save(); rGoals();
}

export function markGoalDone(id) {
  const g=DB.goals.find(x=>x.id==id); if(!g) return;
  g.status='done'; g.pct=100; save(); rGoals(); showToast('Goal completed! 🎉');
}

export function reopenGoal(id) {
  const g=DB.goals.find(x=>x.id==id); if(!g) return;
  g.status='on-track'; save(); rGoals(); showToast('Goal reopened');
}

export function editGoal(id) {
  const g=DB.goals.find(x=>x.id==id); if(!g) return;
  DB.editCtx={type:'goal',id};
  html('edit-modal-title','Edit Goal');
  html('edit-modal-body',`
    <div class="input-group"><label class="input-label">Icon</label>
      <input class="input-field" id="eg_icon" value="${esc(g.icon||'')}"></div>
    <div class="input-group"><label class="input-label">Goal</label>
      <input class="input-field" id="eg_title" value="${esc(g.title)}"></div>
    <div class="input-group"><label class="input-label">Category</label>
      <select class="input-field" id="eg_cat">${['Academic','Fitness','Finance','Tech','Personal','Health','Career'].map(c=>`<option value="${c}"${g.cat===c?' selected':''}>${c}</option>`).join('')}</select></div>
    <div class="input-group"><label class="input-label">Status</label>
      <select class="input-field" id="eg_status">${['on-track','at-risk','done'].map(s=>`<option value="${s}"${g.status===s?' selected':''}>${s}</option>`).join('')}</select></div>
    <div class="input-group"><label class="input-label">Deadline</label>
      <input type="date" class="input-field" id="eg_deadline" value="${g.deadline||''}"></div>
    <div class="input-group"><label class="input-label">Target Value</label>
      <input type="number" class="input-field" id="eg_target" value="${g.targetVal||''}"></div>
    <div class="input-group"><label class="input-label">Current Value</label>
      <input type="number" class="input-field" id="eg_current" value="${g.currentVal||0}"></div>`);
  $('editModalOverlay').classList.add('open');
}

export function delGoal(id) {
  if(!confirm('Delete this goal?')) return;
  DB.goals=DB.goals.filter(x=>x.id!=id); save(); rGoals(); showToast('Goal deleted');
}
