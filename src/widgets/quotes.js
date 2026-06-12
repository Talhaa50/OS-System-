import { DB, DEFAULTS } from '../core/db.js';
import { $, esc } from '../core/utils.js';
import { save } from '../core/save.js';

let _quoteTimer = null;

export function renderQuotes(containerId) {
  const el=$(containerId); if(!el) return;
  const qs=DB.quotes||DEFAULTS.quotes; if(!qs.length) return;
  const idx=(DB.quoteIdx||0)%qs.length, q=qs[idx];
  el.innerHTML=`
    <div style="font-size:13px;font-style:italic;color:var(--text-secondary);line-height:1.6;margin-bottom:6px;">"${esc(q.text)}"</div>
    <div style="font-size:11px;color:var(--text-muted);font-weight:500;">— ${esc(q.author)}</div>`;
  if(_quoteTimer)clearInterval(_quoteTimer);
  _quoteTimer=setInterval(()=>{ DB.quoteIdx=((DB.quoteIdx||0)+1)%(qs.length); save(); renderQuotes(containerId); },8000);
}
