import { DB } from '../core/db.js';
import { save } from '../core/save.js';
import { $, esc, pct, clamp, today } from '../core/utils.js';
import { showToast } from '../core/utils.js';
import { statCard } from '../widgets/statcard.js';

export function rBooks() {
  const pg=$('page-books'); if(!pg) return;
  const books=DB.books||[];
  const reading=books.filter(b=>b.status==='reading'),
        done=books.filter(b=>b.status==='done'),
        want=books.filter(b=>b.status==='want');
  const totalQuotes=books.reduce((s,b)=>s+(b.quotes||[]).length,0);
  const filter=DB.bookFilter||'reading';
  const list=books.filter(b=>b.status===filter);
  let active=books.find(b=>b.id==DB.activeBook);
  if(!active&&list.length){ active=list[0]; DB.activeBook=active.id; }

  pg.innerHTML=`<div style="max-width:1100px;margin:0 auto;width:100%;display:flex;flex-direction:column;height:100%;">

<div class="grid grid-cols-4 gap-2.5 max-[1100px]:grid-cols-2 max-[780px]:grid-cols-1" style="margin-bottom:14px;flex-shrink:0;">
  ${statCard('📖','Reading',reading.length,'cyan')}
  ${statCard('✅','Done',done.length,'green')}
  ${statCard('🔖','Want to Read',want.length,'cyan')}
  ${statCard('💬','Saved Quotes',totalQuotes,'green')}
</div>

<div style="display:flex;gap:12px;flex:1;min-height:0;">

<div style="width:280px;flex-shrink:0;display:flex;flex-direction:column;gap:8px;">
  <div style="display:flex;gap:4px;">
    ${[['reading','Reading',reading.length],['done','Done',done.length],['want','Want',want.length]].map(([k,l,n])=>
      `<button class="sem-tab${filter===k?' active':''}" style="flex:1;font-size:11px;padding:5px;" onclick="filterBooks('${k}')">${l} (${n})</button>`).join('')}
  </div>
  <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:6px;">
    ${list.length?list.map(b=>`
      <div onclick="selectBook(${b.id})" style="display:flex;gap:8px;padding:8px;border-radius:var(--radius-sm);cursor:pointer;border:1px solid ${b.id==DB.activeBook?'var(--border-mid)':'var(--border)'};background:${b.id==DB.activeBook?'var(--accent-glow)':'var(--bg-card)'};">
        <div style="width:5px;border-radius:2px;background:${b.spineColor||'#1a231a'};flex-shrink:0;"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(b.title)}</div>
          <div style="font-size:10px;color:var(--text-muted);">${esc(b.author)}</div>
          ${b.status==='reading'?`<div class="progress-track" style="height:3px;margin-top:5px;"><div class="progress-fill" style="width:${pct(b.currentPage,b.pages)}%;"></div></div>`
            :`<div style="font-size:9px;color:var(--text-ghost);margin-top:3px;">${b.pages} pages${b.status==='done'&&b.finishedDate?' · finished '+b.finishedDate:''}</div>`}
        </div>
      </div>`).join(''):'<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:14px;">No books in this shelf</div>'}
  </div>
  <button class="btn-primary" onclick="openModal('book')">+ Add Book</button>
</div>

<div class="card" style="flex:1;min-width:0;overflow-y:auto;">
  ${active?`
  <div style="display:flex;gap:16px;margin-bottom:16px;">
    <div style="width:84px;height:120px;border-radius:6px;background:${active.spineColor||'#1a231a'};flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:26px;box-shadow:4px 4px 12px rgba(0,0,0,0.4);">📕</div>
    <div style="flex:1;min-width:0;">
      <div style="font-family:var(--font-display);font-size:19px;font-weight:700;">${esc(active.title)}</div>
      <div style="font-size:12.5px;color:var(--text-secondary);margin:2px 0 8px;">${esc(active.author)} · ${active.year}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        <span class="tag tag-blue">${esc(active.genre)}</span>
        <span class="tag tag-${active.status==='done'?'green':active.status==='reading'?'amber':'purple'}">${active.status}</span>
        <span style="font-size:13px;color:var(--amber);">${'★'.repeat(active.rating||0)}${'☆'.repeat(5-(active.rating||0))}</span>
      </div>
    </div>
  </div>
  ${active.status==='reading'?`
  <div style="margin-bottom:14px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px;">
      <div style="flex:1;"><div class="progress-track" style="height:6px;"><div class="progress-fill" style="width:${pct(active.currentPage,active.pages)}%;"></div></div></div>
      <input type="number" value="${active.currentPage}" min="0" max="${active.pages}" onchange="updateBookPage(${active.id},this.value)"
        style="width:62px;background:var(--bg-elevated);border:1px solid var(--border-soft);border-radius:4px;color:var(--text-primary);padding:3px 6px;font-size:12px;text-align:center;outline:none;">
      <span style="font-size:11px;color:var(--text-muted);">/ ${active.pages} pages (${pct(active.currentPage,active.pages)}%)</span>
    </div>
  </div>`:''}
  <div class="sec-title" style="margin-bottom:6px;">Notes</div>
  <textarea class="input-field" rows="3" style="resize:vertical;margin-bottom:14px;" placeholder="Your thoughts on this book..."
    onchange="saveBookNotes(${active.id},this.value)">${esc(active.notes||'')}</textarea>
  <div class="sec-head"><span class="sec-title">Quotes (${(active.quotes||[]).length})</span>
    <button class="card-action" onclick="addBookQuote(${active.id})">+ Quote</button></div>
  ${(active.quotes||[]).length?(active.quotes||[]).map((q,i)=>{
    const text=typeof q==='string'?q:q.text, page=typeof q==='object'?q.page:null;
    return `<div style="display:flex;gap:8px;padding:9px 11px;background:var(--bg-elevated);border-left:3px solid var(--accent);border-radius:var(--radius-sm);margin-bottom:7px;">
      <div style="flex:1;font-size:12.5px;font-style:italic;color:var(--text-secondary);line-height:1.5;">"${esc(text)}"${page?`<span style="font-style:normal;font-size:10px;color:var(--text-ghost);"> — p.${page}</span>`:''}</div>
      <button class="todo-icon-btn" onclick="delBookQuote(${active.id},${i})">✕</button>
    </div>`;
  }).join(''):'<div style="font-size:11px;color:var(--text-muted);padding:8px 0;">No quotes saved yet</div>'}`
  :'<div class="empty-state"><div class="empty-icon">📚</div><div class="empty-text">Select a book, or <span style="color:var(--accent);cursor:pointer;" onclick="openModal(\'book\')">add a new one →</span></div></div>'}
</div>

</div></div>`;
}

export function filterBooks(s) { DB.bookFilter=s; DB.activeBook=null; save(); rBooks(); }
export function selectBook(id) { DB.activeBook=id; save(); rBooks(); }

export function updateBookPage(id, p) {
  const b=DB.books.find(x=>x.id==id); if(!b)return;
  b.currentPage=clamp(parseInt(p)||0,0,b.pages);
  if(b.currentPage>=b.pages){ b.status='done'; b.finishedDate=today(); showToast(`🎉 Finished "${b.title}"!`); }
  save(); rBooks();
}

export function saveBookNotes(id, v) { const b=DB.books.find(x=>x.id==id); if(b){b.notes=v;save();} }

export function addBookQuote(id) {
  const b=DB.books.find(x=>x.id==id); if(!b)return;
  const text=prompt('Quote text:'); if(!text)return;
  const page=prompt('Page number (optional):');
  (b.quotes=b.quotes||[]).push(page?{text,page:parseInt(page)||page}:{text});
  save(); rBooks(); showToast('Quote saved');
}

export function delBookQuote(bid, i) {
  const b=DB.books.find(x=>x.id==bid); if(!b)return;
  b.quotes.splice(i,1); save(); rBooks();
}
