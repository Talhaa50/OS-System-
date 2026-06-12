import { DB } from '../core/db.js';
import { save } from '../core/save.js';
import { $, esc, pkr, clamp, html, val, uid } from '../core/utils.js';
import { showToast } from '../core/utils.js';
import { statCard } from '../widgets/statcard.js';

export function rProjects() {
  const pg=$('page-projects'); if(!pg) return;
  const ps=DB.projects||[];
  const COLS=[{key:'in-progress',label:'In Progress',color:'var(--blue)'},{key:'review',label:'Review',color:'var(--amber)'},{key:'done',label:'Done',color:'var(--accent)'}];

  const detailHtml=(()=>{
    if(!DB.openProjectId) return '';
    const p=ps.find(x=>x.id==DB.openProjectId); if(!p) return '';
    return `
<div class="card" style="margin-top:16px;border-color:var(--border-mid);">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
    <span style="font-size:26px;">${p.icon||'🚀'}</span>
    <div style="flex:1;">
      <div style="font-family:var(--font-display);font-size:17px;font-weight:700;">${esc(p.name)}</div>
      <div style="font-size:12px;color:var(--text-muted);">${esc(p.client)} · ${esc(p.projectType)}</div>
    </div>
    <div style="display:flex;gap:6px;">
      <button class="card-action" onclick="editProj(${p.id})">Edit</button>
      <button style="font-size:11px;color:var(--red);border:1px solid rgba(248,113,113,0.2);border-radius:var(--radius-sm);padding:3px 8px;background:transparent;cursor:pointer;" onclick="delProj(${p.id})">Delete</button>
      <button class="todo-icon-btn" onclick="DB.openProjectId=null;save();rProjects()">✕</button>
    </div>
  </div>
  <div class="grid grid-cols-4 gap-2.5 max-[1100px]:grid-cols-2 max-[780px]:grid-cols-1" style="margin-bottom:14px;">
    ${[['Contract',pkr(p.contractValue)],['Paid',pkr(p.paidAmount)],['Unpaid',pkr((p.contractValue||0)-(p.paidAmount||0))],['Hours',(p.hoursLogged||0)+'h']].map(([l,v])=>
      `<div class="quick-stat" style="padding:8px;"><div class="quick-stat-label">${l}</div><div class="quick-stat-value" style="font-size:13px;">${v}</div></div>`).join('')}
  </div>
  ${p.desc?`<p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;line-height:1.5;">${esc(p.desc)}</p>`:''}
  <div style="margin-bottom:12px;">
    <div class="sec-title" style="margin-bottom:5px;">Progress — ${p.progress||0}%</div>
    <div class="progress-track" style="height:7px;"><div class="progress-fill" style="width:${p.progress||0}%;"></div></div>
  </div>
  ${p.techStack&&p.techStack.length?`<div style="margin-bottom:12px;"><div class="sec-title" style="margin-bottom:6px;">Tech Stack</div><div style="display:flex;flex-wrap:wrap;gap:6px;">${p.techStack.map(t=>`<span class="tag tag-blue">${esc(t)}</span>`).join('')}</div></div>`:''}
  <div class="sec-title" style="margin-bottom:8px;">Project Tasks</div>
  <div>
    ${(p.todos||[]).map(t=>`
      <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);">
        <div class="todo-check${t.done?' done':''}" onclick="toggleProjTodo(${p.id},${t.id})" style="width:14px;height:14px;min-width:14px;">
          ${t.done?'<svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4l2 2 3-3.5" stroke="#021a07" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>':''}
        </div>
        <span style="flex:1;font-size:12px;${t.done?'text-decoration:line-through;color:var(--text-muted);':''}">${esc(t.text)}</span>
        <button class="todo-icon-btn" onclick="delProjTodo(${p.id},${t.id})">✕</button>
      </div>`).join('')}
  </div>
  <div style="margin-top:8px;display:flex;gap:6px;">
    <input id="proj-todo-input" class="todo-add-input" placeholder="Add task to project..." style="flex:1;">
    <button class="btn-ghost" style="padding:6px 12px;font-size:12px;" onclick="addProjTodo(${p.id})">Add</button>
  </div>
  ${p.notes?`<div style="margin-top:12px;padding:10px;background:var(--bg-elevated);border-radius:var(--radius-sm);font-size:12px;color:var(--text-secondary);line-height:1.5;">${esc(p.notes)}</div>`:''}
  ${p.deadline?`<div style="margin-top:8px;font-size:11px;color:var(--text-muted);">📅 Deadline: ${p.deadline}</div>`:''}
</div>`;
  })();

  pg.innerHTML=`<div style="max-width:1200px;margin:0 auto;width:100%;">

<div class="grid grid-cols-4 gap-2.5 max-[1100px]:grid-cols-2 max-[780px]:grid-cols-1" style="margin-bottom:16px;">
  ${statCard('🚀','Total',ps.length,'cyan')}
  ${statCard('⚡','Active',ps.filter(p=>p.status==='in-progress').length,'green')}
  ${statCard('✅','Done',ps.filter(p=>p.status==='done').length,'green')}
  ${statCard('💰','Value',pkr(ps.reduce((s,p)=>s+p.contractValue,0)),'cyan',{small:true})}
</div>

<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
  <div style="display:flex;gap:6px;">
    <button class="${DB.projView==='board'?'btn-primary':'btn-ghost'}" style="font-size:12px;padding:6px 14px;" onclick="DB.projView='board';rProjects()">🗃 Board</button>
    <button class="${DB.projView==='list'?'btn-primary':'btn-ghost'}" style="font-size:12px;padding:6px 14px;" onclick="DB.projView='list';rProjects()">☰ List</button>
  </div>
  <button class="btn-primary" onclick="openModal('project')">+ New Project</button>
</div>

${DB.projView==='board'?`
<div style="display:flex;gap:12px;overflow-x:auto;">
  ${COLS.map(col=>{
    const colPs=ps.filter(p=>p.status===col.key);
    return `
    <div style="flex:1;min-width:190px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${col.color};margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;">
        ${col.label}<span style="background:var(--bg-elevated);border-radius:10px;padding:1px 7px;font-size:9px;color:var(--text-muted);">${colPs.length}</span>
      </div>
      ${colPs.map(p=>`
        <div class="proj-card${DB.openProjectId==p.id?' active':''}" onclick="openProj(${p.id})" style="margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-size:18px;">${p.icon||'🚀'}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-size:12.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.name)}</div>
              <div style="font-size:10px;color:var(--text-muted);">${esc(p.client||'')}</div>
            </div>
          </div>
          <div class="progress-track" style="margin-bottom:4px;"><div class="progress-fill" style="width:${p.progress||0}%;"></div></div>
          <div style="font-size:10px;color:var(--text-muted);">${p.progress||0}% · ${pkr(p.contractValue)}</div>
        </div>`).join('')}
      ${!colPs.length?`<div style="font-size:11px;color:var(--text-ghost);padding:10px;text-align:center;">Empty</div>`:''}
    </div>`;
  }).join('')}
</div>`
:`
<div class="card">
  ${ps.map(p=>`
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;" onclick="openProj(${p.id})">
      <span style="font-size:20px;">${p.icon||'🚀'}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;">${esc(p.name)}</div>
        <div style="font-size:11px;color:var(--text-muted);">${esc(p.client)} · ${p.projectType}</div>
      </div>
      <div style="min-width:120px;"><div class="progress-track"><div class="progress-fill" style="width:${p.progress||0}%;"></div></div></div>
      <span style="font-size:12px;font-family:var(--font-mono);min-width:80px;text-align:right;">${pkr(p.contractValue)}</span>
      <span class="tag tag-${p.status==='done'?'green':p.status==='in-progress'?'blue':'amber'}">${p.status}</span>
    </div>`).join('')}
  ${!ps.length?'<div class="empty-state"><div class="empty-icon">🚀</div><div class="empty-text">No projects yet.</div></div>':''}
</div>`}

${detailHtml}

</div>`;
}

export function openProj(id) {
  DB.openProjectId=DB.openProjectId==id?null:id; save(); rProjects();
}

export function toggleProjTodo(pid, tid) {
  const p=DB.projects.find(x=>x.id==pid); if(!p) return;
  const t=(p.todos||[]).find(x=>x.id==tid); if(!t) return;
  t.done=!t.done; save(); rProjects();
}

export function addProjTodo(pid) {
  const p=DB.projects.find(x=>x.id==pid); if(!p) return;
  const v=(()=>{ const e=$('proj-todo-input'); return e?e.value.trim():''; })();
  if(!v) return;
  if(!p.todos)p.todos=[];
  p.todos.push({id:uid(),text:v,done:false}); save(); rProjects();
}

export function delProjTodo(pid, tid) {
  const p=DB.projects.find(x=>x.id==pid); if(!p) return;
  p.todos=(p.todos||[]).filter(x=>x.id!=tid); save(); rProjects();
}

export function editProj(id) {
  const p=DB.projects.find(x=>x.id==id); if(!p) return;
  DB.editCtx={type:'project',id};
  html('edit-modal-title','Edit Project');
  html('edit-modal-body',`
    <div class="input-group"><label class="input-label">Name</label>
      <input class="input-field" id="ep_name" value="${esc(p.name)}"></div>
    <div class="input-group"><label class="input-label">Client</label>
      <input class="input-field" id="ep_client" value="${esc(p.client||'')}"></div>
    <div class="input-group"><label class="input-label">Contract Value (₨)</label>
      <input type="number" class="input-field" id="ep_value" value="${p.contractValue||0}"></div>
    <div class="input-group"><label class="input-label">Paid Amount (₨)</label>
      <input type="number" class="input-field" id="ep_paid" value="${p.paidAmount||0}"></div>
    <div class="input-group"><label class="input-label">Progress %</label>
      <input type="number" class="input-field" id="ep_progress" value="${p.progress||0}" min="0" max="100"></div>
    <div class="input-group"><label class="input-label">Status</label>
      <select class="input-field" id="ep_status">${['in-progress','review','done'].map(s=>`<option value="${s}"${p.status===s?' selected':''}>${s}</option>`).join('')}</select></div>
    <div class="input-group"><label class="input-label">Deadline</label>
      <input type="date" class="input-field" id="ep_deadline" value="${p.deadline||''}"></div>
    <div class="input-group"><label class="input-label">Notes</label>
      <input class="input-field" id="ep_notes" value="${esc(p.notes||'')}"></div>`);
  $('editModalOverlay').classList.add('open');
}

export function delProj(id) {
  if(!confirm('Delete this project?')) return;
  DB.projects=DB.projects.filter(x=>x.id!=id); DB.openProjectId=null; save(); rProjects(); showToast('Project deleted');
}
