import { DB } from '../core/db.js';
import { save } from '../core/save.js';
import { $, esc, pkr, clamp, today, val } from '../core/utils.js';
import { showToast } from '../core/utils.js';
import { isDoneToday, habitMonthPct, totalIncome, totalExpenses } from '../core/helpers.js';

export function rSettings() {
  const pg=$('page-settings'); if(!pg) return;
  const info=getStorageInfo();

  pg.innerHTML=`<div style="max-width:900px;margin:0 auto;width:100%;">

<div class="page-head"><div><div class="page-title">System Settings</div><div class="page-subtitle">Profile, data & exports</div></div></div>

<div class="grid grid-cols-2 gap-3 max-[780px]:grid-cols-1">
  <div class="card">
    <div class="card-header"><span class="card-title">User Profile</span></div>
    <div class="input-group"><label class="input-label">Display Name</label>
      <input class="input-field" id="set-name" value="${esc(DB.username||'Zyrax')}" autocomplete="off" oninput="updateUserName()"></div>
    <div class="input-group"><label class="input-label">Status Message</label>
      <input class="input-field" id="set-status" value="${esc(DB.userStatus||'Deep Work Active')}" autocomplete="off" oninput="updateUserStatus()"></div>
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title">Data Management</span></div>
    <div style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;">
        <span style="color:var(--text-secondary);">Storage Used</span>
        <span style="font-family:var(--font-mono);color:var(--text-muted);">${info.kb} KB / 5 MB</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${info.pct}%;"></div></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:7px;">
      <button class="btn-ghost" style="text-align:left;" onclick="expAll()">📦 Export All Data (JSON)</button>
      <button class="btn-ghost" style="text-align:left;" onclick="impAll()">📥 Import Backup (JSON)</button>
      <button class="btn-ghost" style="text-align:left;" onclick="expCSV()">🔥 Export Habits CSV</button>
      <button class="btn-ghost" style="text-align:left;" onclick="expFin()">💰 Export Finance CSV</button>
      <button class="btn-ghost" style="text-align:left;" onclick="printWeeklySummary()">🖨 Print Weekly Summary</button>
      <button class="btn-danger" style="text-align:left;" onclick="clearAll()">🗑 Clear All Data</button>
    </div>
  </div>
</div>

</div>`;
}

export function updateUserName() {
  const n=val('set-name')||'Zyrax';
  DB.username=n; save();
  const i=n.charAt(0).toUpperCase();
  const sn=$('sb-name'); if(sn)sn.textContent=n;
  const sa=$('sb-avatar'); if(sa)sa.textContent=i;
  const ta=$('tb-avatar'); if(ta)ta.textContent=i;
  const hn=$('hero-name'); if(hn)hn.textContent=n;
}

export function updateUserStatus() {
  DB.userStatus=val('set-status'); save();
  const us=document.querySelector('.u-status'); if(us)us.textContent=DB.userStatus;
}

function getStorageInfo() {
  let bytes=0;
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&k.startsWith('pos4_')) bytes+=(localStorage.getItem(k)||'').length+k.length;
  }
  return {kb:Math.round(bytes/1024*10)/10, pct:clamp(Math.round(bytes/(5*1024*1024)*100),1,100)};
}

function _download(name, content, mime) {
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([content],{type:mime}));
  a.download=name; a.click(); URL.revokeObjectURL(a.href);
}

export function expAll() {
  const out={};
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&k.startsWith('pos4_')){ try{out[k]=JSON.parse(localStorage.getItem(k));}catch(e){} }
  }
  _download('personal-os-backup-'+today()+'.json', JSON.stringify(out,null,2), 'application/json');
  DB.lastBackup=Date.now(); save();
  showToast('Backup downloaded');
}

export function impAll() {
  const input=document.createElement('input');
  input.type='file'; input.accept='.json,application/json';
  input.onchange=()=>{
    const f=input.files&&input.files[0]; if(!f) return;
    const reader=new FileReader();
    reader.onload=()=>{
      let data;
      try { data=JSON.parse(reader.result); }
      catch(e){ showToast('⚠ Not a valid JSON file'); return; }
      const keys=Object.keys(data||{}).filter(k=>k.startsWith('pos4_'));
      if(!keys.length){ showToast('⚠ Not a Personal OS backup file'); return; }
      if(!confirm(`Import backup with ${keys.length} data entries?\nThis OVERWRITES all current data in this browser.`)) return;
      keys.forEach(k=>{ try{ localStorage.setItem(k, JSON.stringify(data[k])); }catch(e){} });
      location.reload();
    };
    reader.readAsText(f);
  };
  input.click();
}

export function expCSV() {
  let csv='Habit,Streak,Done Today,Month %\n';
  (DB.habits||[]).forEach(h=>{ csv+=`"${h.name}",${h.streak},${isDoneToday(h)?'yes':'no'},${habitMonthPct(h)}\n`; });
  _download('habits-'+today()+'.csv', csv, 'text/csv'); showToast('Habits CSV downloaded');
}

export function expFin() {
  let csv='Date,Description,Category,Type,Amount\n';
  (DB.transactions||[]).forEach(t=>{ csv+=`${t.date},"${t.name}",${t.cat},${t.type},${t.amount}\n`; });
  _download('finance-'+today()+'.csv', csv, 'text/csv'); showToast('Finance CSV downloaded');
}

export function printWeeklySummary() {
  const hs=DB.habits||[];
  const weekH=Math.round((DB.dw.weekMins||0)/60*10)/10;
  const net=totalIncome()-totalExpenses();
  const gs=(DB.goals||[]).filter(g=>g.status!=='done');
  const w=window.open('','_blank');
  if(!w){ showToast('⚠ Popup blocked'); return; }
  w.document.write(`<!DOCTYPE html><html><head><title>Weekly Summary</title>
  <style>body{font-family:Georgia,serif;max-width:640px;margin:40px auto;color:#1a1a1a;line-height:1.6;}
  h1{font-size:22px;border-bottom:2px solid #22c55e;padding-bottom:8px;}h2{font-size:15px;margin-top:24px;}
  table{width:100%;border-collapse:collapse;font-size:13px;}td,th{padding:6px 8px;border-bottom:1px solid #ddd;text-align:left;}</style></head><body>
  <h1>Personal OS — Weekly Summary</h1>
  <p>${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})} · ${esc(DB.username||'Zyrax')}</p>
  <h2>Focus</h2><p>Deep work this week: <strong>${weekH}h</strong> · Sessions today: ${DB.dw.sessCount||0} · All-time: ${Math.round((DB.dw.allMins||0)/60)}h</p>
  <h2>Habits</h2><table><tr><th>Habit</th><th>Streak</th><th>Month</th></tr>
  ${hs.map(h=>`<tr><td>${h.icon} ${esc(h.name)}</td><td>${h.streak} days</td><td>${habitMonthPct(h)}%</td></tr>`).join('')}</table>
  <h2>Goals</h2><table><tr><th>Goal</th><th>Progress</th><th>Status</th></tr>
  ${gs.map(g=>`<tr><td>${esc(g.title)}</td><td>${g.pct||0}%</td><td>${g.status}</td></tr>`).join('')}</table>
  <h2>Finance</h2><p>Income: ${pkr(totalIncome())} · Expenses: ${pkr(totalExpenses())} · Net: <strong>${pkr(net)}</strong></p>
  <script>window.print()<\/script></body></html>`);
  w.document.close();
}

export function clearAll() {
  if(!confirm('⚠ This permanently deletes ALL Personal OS data. Continue?'))return;
  if(!confirm('Really sure? This cannot be undone.'))return;
  Object.keys(localStorage).filter(k=>k.startsWith('pos4_')).forEach(k=>localStorage.removeItem(k));
  location.reload();
}
