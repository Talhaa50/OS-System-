import { DB } from '../core/db.js';
import { $, html, esc, DAYS } from '../core/utils.js';
import { navigate } from '../core/router.js';

export function openGlobalSearch() {
  const ov = $('search-overlay'); if (!ov) return;
  ov.classList.add('open');
  const inp = $('search-input');
  if (inp) { inp.value=''; setTimeout(()=>inp.focus(), 50); }
  html('search-results','<div class="search-empty">Type to search across Personal OS…</div>');
}

export function closeGlobalSearch() {
  const ov = $('search-overlay'); if (ov) ov.classList.remove('open');
}

export function runGlobalSearch(q) {
  if (!q) { html('search-results','<div class="search-empty">Type to search across Personal OS…</div>'); return; }
  const ql = q.toLowerCase();
  const results = [];

  DAYS.forEach(day => (DB.todoWeek[day]||[]).forEach(t => {
    if (t.text.toLowerCase().includes(ql))
      results.push({icon:'✅', label:t.text, sub:`Todo — ${day.charAt(0).toUpperCase()+day.slice(1)}`, type:'Todo', page:'todo'});
  }));
  (DB.notes||[]).forEach(n => {
    if (n.title.toLowerCase().includes(ql)||(n.content||'').toLowerCase().includes(ql))
      results.push({icon:'📝', label:n.title, sub:`Note — ${n.tag}`, type:'Note', page:'notes', id:n.id});
  });
  (DB.projects||[]).forEach(p => {
    if (p.name.toLowerCase().includes(ql)||(p.client||'').toLowerCase().includes(ql))
      results.push({icon:p.icon||'🚀', label:p.name, sub:`Project — ${p.client}`, type:'Project', page:'projects', id:p.id});
  });
  (DB.goals||[]).forEach(g => {
    if (g.title.toLowerCase().includes(ql))
      results.push({icon:g.icon||'🎯', label:g.title, sub:`Goal — ${g.cat}`, type:'Goal', page:'goals'});
  });
  (DB.books||[]).forEach(b => {
    if (b.title.toLowerCase().includes(ql)||b.author.toLowerCase().includes(ql))
      results.push({icon:'📚', label:b.title, sub:`Book by ${b.author}`, type:'Book', page:'books', id:b.id});
  });
  (DB.habits||[]).forEach(h => {
    if (h.name.toLowerCase().includes(ql))
      results.push({icon:h.icon||'🔥', label:h.name, sub:`Habit — ${h.streak} day streak`, type:'Habit', page:'habits'});
  });

  if (!results.length) {
    html('search-results',`<div class="search-empty">No results for "<strong>${esc(q)}</strong>"</div>`);
    return;
  }
  html('search-results', results.slice(0,12).map(r=>`
    <div class="sr-item" onclick="searchGo('${esc(r.page)}',${r.id?`'${r.id}'`:'null'})">
      <div class="sr-icon">${r.icon}</div>
      <div class="sr-text">
        <div class="sr-label">${esc(r.label)}</div>
        <div class="sr-sub">${esc(r.sub)}</div>
      </div>
      <span class="sr-type">${esc(r.type)}</span>
    </div>`).join(''));
}

export function searchGo(page, id) {
  closeGlobalSearch();
  if (id) {
    if (page==='notes')    DB.activeNote    = id;
    if (page==='projects') DB.openProjectId = id;
    if (page==='books')    DB.activeBook    = id;
  }
  navigate(page);
}
