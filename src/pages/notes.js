import { DB } from '../core/db.js';
import { save } from '../core/save.js';
import { $, esc, uid } from '../core/utils.js';
import { showToast } from '../core/utils.js';

const NOTE_TAGS = ['general','study','finance','fitness','productivity','ideas'];

export function rNotes() {
  const pg=$('page-notes'); if(!pg) return;
  const notes=DB.notes||[];
  let active=notes.find(n=>n.id==DB.activeNote)||notes[0];
  if(active) DB.activeNote=active.id;

  pg.innerHTML=`<div style="display:flex;gap:12px;height:100%;max-width:1100px;margin:0 auto;width:100%;">

<div style="width:260px;flex-shrink:0;display:flex;flex-direction:column;gap:8px;">
  <div style="display:flex;gap:6px;">
    <input class="todo-add-input" id="notes-search" placeholder="Search notes..." style="flex:1;" oninput="rNotesList(this.value)">
    <button class="btn-primary" style="padding:6px 12px;" onclick="addNote()">+</button>
  </div>
  <div id="notes-list" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:5px;"></div>
</div>

<div class="card" style="flex:1;min-width:0;display:flex;flex-direction:column;">
  ${active?`
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
    <input id="note-title" value="${esc(active.title)}" autocomplete="off"
      style="flex:1;background:transparent;border:none;outline:none;color:var(--text-primary);font-family:var(--font-display);font-size:20px;font-weight:700;"
      oninput="autoSaveNote()">
    <select class="input-field" id="note-tag" style="width:130px;" onchange="autoSaveNote();rNotesList(val('notes-search'))">
      ${NOTE_TAGS.map(t=>`<option value="${t}"${active.tag===t?' selected':''}>${t}</option>`).join('')}
    </select>
    <button class="todo-icon-btn" style="color:var(--red);" onclick="deleteActiveNote()" title="Delete note">🗑️</button>
  </div>
  <div class="divider" style="margin:4px 0 10px;"></div>
  <textarea id="note-content" spellcheck="false"
    style="flex:1;background:transparent;border:none;outline:none;resize:none;color:var(--text-primary);font-family:var(--font-body);font-size:13.5px;line-height:1.7;"
    oninput="autoSaveNote()">${esc(active.content||'')}</textarea>
  <div style="display:flex;justify-content:flex-end;gap:10px;font-size:10px;color:var(--text-muted);margin-top:6px;">
    <span id="note-wc"></span><span>· auto-saved</span>
  </div>`
  :'<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">No notes yet. <span style="color:var(--accent);cursor:pointer;" onclick="addNote()">Create your first note →</span></div></div>'}
</div>

</div>`;

  rNotesList('');
  updNoteWC();
  const ta=$('note-content');
  if(ta) ta.addEventListener('keydown',e=>{
    if(e.key==='Tab'){ e.preventDefault();
      const s=ta.selectionStart;
      ta.value=ta.value.slice(0,s)+'  '+ta.value.slice(ta.selectionEnd);
      ta.selectionStart=ta.selectionEnd=s+2; autoSaveNote();
    }
  });
}

export function rNotesList(q) {
  const el=$('notes-list'); if(!el)return;
  const ql=(q||'').toLowerCase();
  const list=(DB.notes||[]).filter(n=>!ql||n.title.toLowerCase().includes(ql)||(n.content||'').toLowerCase().includes(ql));
  el.innerHTML=list.length?list.map(n=>`
    <div onclick="selNote(${n.id})" style="padding:9px 11px;border-radius:var(--radius-sm);cursor:pointer;border:1px solid ${n.id==DB.activeNote?'var(--border-mid)':'var(--border)'};background:${n.id==DB.activeNote?'var(--accent-glow)':'var(--bg-card)'};">
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="flex:1;font-size:12.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${n.id==DB.activeNote?'var(--accent)':'var(--text-primary)'};">${esc(n.title||'Untitled')}</span>
        <span class="tag tag-blue" style="font-size:8px;">${esc(n.tag||'general')}</span>
      </div>
      <div style="font-size:10.5px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;">${esc((n.content||'').replace(/[#>*\n]/g,' ').trim().slice(0,60))}</div>
    </div>`).join(''):'<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:14px;">No matching notes</div>';
}

export function selNote(id) { DB.activeNote=id; save(); rNotes(); }

export function addNote() {
  const n={id:uid(),title:'Untitled Note',tag:'general',content:''};
  DB.notes.unshift(n); DB.activeNote=n.id; save(); rNotes();
  const t=$('note-title'); if(t){t.focus();t.select();}
}

export function autoSaveNote() {
  const n=(DB.notes||[]).find(x=>x.id==DB.activeNote); if(!n)return;
  const t=$('note-title'),tg=$('note-tag'),c=$('note-content');
  if(t)n.title=t.value; if(tg)n.tag=tg.value; if(c)n.content=c.value;
  save(); updNoteWC();
}

export function updNoteWC() {
  const c=$('note-content'),wc=$('note-wc');
  if(c&&wc){ const w=c.value.trim()?c.value.trim().split(/\s+/).length:0; wc.textContent=w+' words'; }
}

export function deleteActiveNote() {
  if(!confirm('Delete this note?'))return;
  DB.notes=DB.notes.filter(n=>n.id!=DB.activeNote);
  DB.activeNote=DB.notes.length?DB.notes[0].id:null;
  save(); rNotes(); showToast('Note deleted');
}
