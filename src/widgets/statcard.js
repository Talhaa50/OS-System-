// Stat card 2.0 — neon glow stat tiles for top-of-page stat rows.
// color: 'green' | 'cyan' | 'amber' | 'red'
// opts.ring  — render a conic progress ring (0–100) instead of the icon chip
// opts.small — smaller value font for long strings (currency etc.)
// opts.valueId — id on the value element for live updates
// opts.delta — % change vs previous period (Pirsch-style ▲/▼ arrow)
// opts.prev  — previous period value shown next to the delta
export function statCard(icon, label, value, color = 'green', opts = {}) {
  const lead = opts.ring != null
    ? `<div class="sc-ring" style="--p:${Math.max(0, Math.min(100, opts.ring))};"><span>${opts.ring}%</span></div>`
    : `<div class="sc-icon">${icon}</div>`;
  const idAttr = opts.valueId ? ` id="${opts.valueId}"` : '';
  let delta = '';
  if (opts.delta != null && isFinite(opts.delta)) {
    const up = opts.delta >= 0;
    delta = `<span class="sc-delta ${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${Math.abs(opts.delta).toFixed(1)}%</span>`;
    if (opts.prev != null) delta += `<span class="sc-prev">${opts.prev}</span>`;
  }
  return `<div class="stat-card sc-${color}">${lead}
    <div class="sc-body">
      <div class="sc-label">${label}</div>
      <div class="sc-value${opts.small ? ' sm' : ''}"${idAttr}>${value}${delta}</div>
    </div></div>`;
}
