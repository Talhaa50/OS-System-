export const uid      = () => Date.now() + Math.floor(Math.random() * 10000);
export const pkr      = n  => '₨ ' + Number(n||0).toLocaleString('en-PK');
export const pct      = (a,b) => b ? Math.round(a/b*100) : 0;
export const clamp    = (v,mn,mx) => Math.max(mn, Math.min(mx, v));
export const esc      = s  => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
export const $        = id => document.getElementById(id);
export const val      = id => { const e=$(id); return e ? e.value.trim() : ''; };
// Local-timezone date string (YYYY-MM-DD). Never use toISOString() for dates:
// it returns UTC, which shifts the day boundary by the timezone offset.
export const localISO = d => {
  const x = d || new Date();
  return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
};
export const today    = () => localISO();
export const dayName  = () => new Date().toLocaleDateString('en-US',{weekday:'long'}).toLowerCase();

export function html(id, h) { const e = $(id); if (e) e.innerHTML = h; }

export function isoWeek(d) {
  const date = d ? new Date(d) : new Date();
  const thu  = new Date(date); thu.setDate(date.getDate() - ((date.getDay()+6)%7) + 3);
  const y1   = new Date(thu.getFullYear(), 0, 4);
  return 1 + Math.round((thu - y1) / 604800000);
}

export const DAYS      = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
export const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

let _toastTimer = null;
// showToast('Deleted', { label:'Undo', fn:()=>{...} }) renders an action button.
export function showToast(msg, action) {
  const t = $('toast'); if (!t) return;
  t.innerHTML = esc(msg);
  t.classList.toggle('actionable', !!action);
  if (action) {
    const btn = document.createElement('button');
    btn.className = 'toast-action';
    btn.textContent = action.label || 'Undo';
    btn.onclick = () => { t.classList.remove('show','actionable'); action.fn(); };
    t.appendChild(btn);
  }
  t.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(()=>t.classList.remove('show','actionable'), action ? 5200 : 2600);
}
