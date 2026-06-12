import { DB } from '../core/db.js';
import { save } from '../core/save.js';
import { $ } from '../core/utils.js';

const MODES = [['day','Day'],['month','Month'],['year','Year']];

function bounds() {
  const now = new Date(), mode = DB.countdownMode || 'month';
  if (mode === 'day') return {
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    end:   new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
    label: 'of today gone'
  };
  if (mode === 'year') return {
    start: new Date(now.getFullYear(), 0, 1),
    end:   new Date(now.getFullYear() + 1, 0, 1),
    label: `of ${now.getFullYear()} gone`
  };
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end:   new Date(now.getFullYear(), now.getMonth() + 1, 1),
    label: `of ${now.toLocaleDateString('en-US',{month:'long'})} gone`
  };
}

export function renderCountdown(containerId) {
  const el = $(containerId); if (!el) return;
  const mode = DB.countdownMode || 'month';
  const showDays = mode !== 'day';
  const blocks = [];
  if (showDays) blocks.push(['cd-d','Days']);
  blocks.push(['cd-h','Hours'], ['cd-m','Mins'], ['cd-s','Secs']);

  el.innerHTML = `
    <div style="display:flex;gap:4px;justify-content:flex-end;margin-bottom:2px;">
      ${MODES.map(([k,l]) => `<button class="sem-tab${mode===k?' active':''}" style="font-size:10px;padding:3px 10px;" onclick="setCountdownMode('${k}')">${l}</button>`).join('')}
    </div>
    <div class="cd-wrap">
      ${blocks.map(([id,lbl],i) => `${i ? '<div class="cd-sep">:</div>' : ''}
        <div class="cd-block"><div class="cd-num" id="${id}">00</div><div class="cd-lbl">${lbl}</div></div>`).join('')}
    </div>
    <div class="cd-foot">
      <div class="progress-track" style="height:4px;"><div class="progress-fill" id="cd-bar" style="width:0%;"></div></div>
      <span class="cd-pct" id="cd-pct"></span>
    </div>`;
  updateCountdown();
}

export function updateCountdown() {
  const sEl = $('cd-s'); if (!sEl) return;
  const { start, end, label } = bounds();
  const now = new Date();
  let ms = Math.max(0, end - now);
  const d = Math.floor(ms / 86400000);  ms -= d * 86400000;
  const h = Math.floor(ms / 3600000);   ms -= h * 3600000;
  const m = Math.floor(ms / 60000);     ms -= m * 60000;
  const s = Math.floor(ms / 1000);
  const p2 = n => String(n).padStart(2, '0');
  const dEl = $('cd-d'); if (dEl) dEl.textContent = p2(d);
  const hEl = $('cd-h'); if (hEl) hEl.textContent = p2(h);
  const mEl = $('cd-m'); if (mEl) mEl.textContent = p2(m);
  sEl.textContent = p2(s);
  const pctDone = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  const bar = $('cd-bar'); if (bar) bar.style.width = pctDone.toFixed(1) + '%';
  const pl = $('cd-pct'); if (pl) pl.textContent = `${pctDone.toFixed(1)}% ${label}`;
}

export function setCountdownMode(m) {
  DB.countdownMode = m; save();
  renderCountdown('dash-countdown');
}
