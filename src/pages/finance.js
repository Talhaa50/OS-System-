import { DB } from '../core/db.js';
import { save } from '../core/save.js';
import { $, esc, pkr, pct, today, html, val, clamp } from '../core/utils.js';
import { showToast } from '../core/utils.js';
import { totalIncome, totalExpenses, computeExpDonut, fmtTxnDate } from '../core/helpers.js';
import { renderDonut } from '../widgets/donut.js';
import { statCard } from '../widgets/statcard.js';

export function rFinance() {
  const pg=$('page-finance'); if(!pg) return;
  const txns=DB.transactions||[];
  const inc=totalIncome(), exp=totalExpenses(), bal=inc-exp;
  const budgets=DB.budgets||{};
  const spent={};
  txns.filter(t=>t.type==='exp').forEach(t=>{ spent[t.cat]=(spent[t.cat]||0)+t.amount; });

  const now=new Date();
  const months=[];
  for(let i=6;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const mExp=txns.filter(t=>t.type==='exp'&&t.date&&t.date.startsWith(key)).reduce((s,t)=>s+t.amount,0);
    months.push({label:d.toLocaleDateString('en-US',{month:'short'}),value:mExp,isNow:i===0});
  }
  const maxM=Math.max(...months.map(x=>x.value),1);
  const segs=computeExpDonut();
  const catList=Object.keys(budgets);

  pg.innerHTML=`<div style="max-width:1100px;margin:0 auto;width:100%;">

<div class="grid grid-cols-4 gap-2.5 max-[1100px]:grid-cols-2 max-[780px]:grid-cols-1" style="margin-bottom:16px;">
  ${statCard('📈','Income',pkr(inc),'green',{small:true})}
  ${statCard('📉','Expenses',pkr(exp),'red',{small:true})}
  ${statCard('💰','Balance',pkr(bal),bal>=0?'green':'red',{small:true})}
  ${statCard('🧾','Transactions',txns.length,'cyan')}
</div>

<div class="grid grid-cols-2 gap-3 max-[780px]:grid-cols-1" style="margin-bottom:12px;">
  <div class="card">
    <div class="card-header"><span class="card-title">Monthly Spending</span><button class="card-action" onclick="openModal('expense')">+ Add</button></div>
    <div class="bar-chart" style="height:100px;align-items:flex-end;gap:4px;">
      ${months.map(m=>`
        <div class="bar-wrap">
          <div style="font-size:9px;color:var(--text-muted);margin-bottom:2px;">${m.value>0?pkr(m.value).replace('₨ ',''):''}</div>
          <div class="bar${m.isNow?' highlighted':''}" style="height:${Math.round((m.value/maxM)*60)+8}px;"></div>
          <div class="bar-lbl">${m.label}</div>
        </div>`).join('')}
    </div>
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title">Spending Breakdown</span></div>
    <div style="display:flex;gap:16px;align-items:center;">
      <canvas id="fin-donut" width="100" height="100"></canvas>
      <div style="flex:1;min-width:0;">
        ${segs.map(s=>`
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;font-size:11px;">
            <div style="width:8px;height:8px;border-radius:50%;background:${s.color};flex-shrink:0;"></div>
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(s.label)}</span>
            <span style="color:var(--text-muted);">${pkr(s.value)}</span>
          </div>`).join('')}
        ${!segs.length?'<div style="color:var(--text-muted);font-size:12px;">No expenses yet</div>':''}
      </div>
    </div>
  </div>
</div>

<div class="card" style="margin-bottom:12px;">
  <div class="card-header"><span class="card-title">Budget Tracker</span></div>
  ${catList.map(cat=>{
    const bud=budgets[cat]||0, sp=spent[cat]||0, over=sp>bud;
    return `
    <div class="budget-row">
      <span style="width:90px;font-size:12px;flex-shrink:0;">${esc(cat)}</span>
      <div style="flex:1;min-width:0;margin:0 10px;">
        <div class="progress-track"><div class="progress-fill${over?' red':''}" style="width:${Math.min(pct(sp,bud),100)}%;"></div></div>
      </div>
      <span style="font-size:11px;color:${over?'var(--red)':'var(--text-secondary)'};width:85px;text-align:right;">${pkr(sp)}</span>
      <span style="font-size:10px;color:var(--text-muted);width:70px;text-align:right;">/ ${pkr(bud)}</span>
      <button class="todo-icon-btn" style="font-size:11px;margin-left:4px;" onclick="editBudget('${esc(cat)}')">✏️</button>
    </div>`;
  }).join('')}
</div>

<div class="card" style="margin-bottom:12px;">
  <div class="card-header"><span class="card-title">Subscriptions</span>
    <span style="font-size:11px;color:var(--text-secondary);">${pkr((DB.subscriptions||[]).reduce((s,x)=>s+x.amount,0))}/mo</span></div>
  <div class="grid grid-cols-2 gap-3 max-[780px]:grid-cols-1">
    ${(DB.subscriptions||[]).map(s=>`
      <div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--bg-elevated);border-radius:var(--radius-sm);">
        <span style="font-size:18px;">${s.icon}</span>
        <span style="flex:1;font-size:12.5px;">${esc(s.name)}</span>
        <span style="font-size:12px;font-family:var(--font-mono);color:var(--red);">${pkr(s.amount)}</span>
      </div>`).join('')}
  </div>
</div>

<div class="card">
  <div class="card-header"><span class="card-title">Recent Transactions</span><button class="card-action" onclick="openModal('expense')">+ Add</button></div>
  ${txns.slice(0,15).map(t=>`
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
      <span style="font-size:18px;">${t.icon||'💸'}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:12.5px;font-weight:500;">${esc(t.name)}</div>
        <div style="font-size:10px;color:var(--text-muted);">${esc(t.cat)} · ${fmtTxnDate(t.date)}</div>
      </div>
      <span style="font-family:var(--font-mono);font-size:13px;font-weight:600;color:${t.type==='inc'?'var(--accent)':'var(--red)'};">${t.type==='inc'?'+':'-'}${pkr(t.amount)}</span>
      <button class="todo-icon-btn" onclick="editExpense(${t.id})">✏️</button>
      <button class="todo-icon-btn" onclick="delExpense(${t.id})">🗑️</button>
    </div>`).join('')}
</div>

</div>`;

  renderDonut('fin-donut',segs,100);
}

export function editBudget(cat) {
  const cur=DB.budgets[cat]||0;
  const nv=prompt(`Budget for ${cat} (current: ${pkr(cur)}):`, cur);
  if(nv!==null&&!isNaN(parseFloat(nv))){ DB.budgets[cat]=parseFloat(nv); save(); rFinance(); showToast(`Budget updated`); }
}

export function editExpense(id) {
  const t=DB.transactions.find(x=>x.id==id); if(!t) return;
  DB.editCtx={type:'expense',id};
  html('edit-modal-title','Edit Transaction');
  html('edit-modal-body',`
    <div class="input-group"><label class="input-label">Description</label>
      <input class="input-field" id="ee_name" value="${esc(t.name)}"></div>
    <div class="input-group"><label class="input-label">Amount (₨)</label>
      <input type="number" class="input-field" id="ee_amount" value="${t.amount}"></div>
    <div class="input-group"><label class="input-label">Category</label>
      <select class="input-field" id="ee_cat">${['Food','Transport','Shopping','Health','Personal','Subs','Education','Other','Income'].map(c=>`<option value="${c}"${t.cat===c?' selected':''}>${c}</option>`).join('')}</select></div>
    <div class="input-group"><label class="input-label">Date</label>
      <input type="date" class="input-field" id="ee_date" value="${t.date||today()}"></div>`);
  $('editModalOverlay').classList.add('open');
}

export function delExpense(id) {
  if(!confirm('Delete transaction?')) return;
  DB.transactions=DB.transactions.filter(x=>x.id!=id); save(); rFinance(); showToast('Transaction deleted');
}
