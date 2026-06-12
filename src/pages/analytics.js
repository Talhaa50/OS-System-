import { DB } from '../core/db.js';
import { $, esc, pkr, pct, clamp, dayName, localISO } from '../core/utils.js';
import { isDoneToday, habitMonthPct, totalIncome, totalExpenses } from '../core/helpers.js';
import { calcCourseGrade } from '../core/helpers.js';
import { statCard } from '../widgets/statcard.js';

export function rAnalytics() {
  const pg=$('page-analytics'); if(!pg) return;
  const hs=DB.habits||[];
  const habitScore=hs.length?Math.round(hs.reduce((s,h)=>s+habitMonthPct(h),0)/hs.length):0;
  const weekH=Math.round((DB.dw.weekMins||0)/60*10)/10;
  const net=totalIncome()-totalExpenses();
  const gs=(DB.goals||[]).filter(g=>g.status!=='done');
  const goalAvg=gs.length?Math.round(gs.reduce((s,g)=>s+(g.pct||0),0)/gs.length):0;

  const days14=[];
  for(let i=13;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    const ds=localISO(d);
    days14.push({mins:DB.dw.dailyMins[ds]||0,lbl:'SMTWTFS'[d.getDay()],isToday:i===0});
  }
  const maxF=Math.max(...days14.map(x=>x.mins),60);

  // Pirsch-style deltas: this period vs previous period
  const deltaPct=(cur,prev)=>prev>0?Math.round((cur-prev)/prev*1000)/10:null;
  const dateStr=off=>{ const d=new Date(); d.setDate(d.getDate()-off); return localISO(d); };
  let focusCur=0,focusPrev=0,habitCur=0,habitPrev=0;
  for(let i=0;i<7;i++){
    focusCur +=DB.dw.dailyMins[dateStr(i)]||0;
    focusPrev+=DB.dw.dailyMins[dateStr(i+7)]||0;
    hs.forEach(h=>{
      if(h.doneHistory&&h.doneHistory[dateStr(i)])   habitCur++;
      if(h.doneHistory&&h.doneHistory[dateStr(i+7)]) habitPrev++;
    });
  }
  const now0=new Date();
  const monthKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  const thisM=monthKey(now0), lastM=monthKey(new Date(now0.getFullYear(),now0.getMonth()-1,1));
  const netOf=mk=>(DB.transactions||[]).filter(t=>t.date&&t.date.startsWith(mk))
    .reduce((s,t)=>s+(t.type==='inc'?t.amount:-t.amount),0);
  const netCur=netOf(thisM), netPrev=netOf(lastM);
  const focusDelta=deltaPct(focusCur,focusPrev);
  const habitDelta=deltaPct(habitCur,habitPrev);
  const netDelta=netPrev!==0?Math.round((netCur-netPrev)/Math.abs(netPrev)*1000)/10:null;

  const dn=dayName(), tt=DB.todoWeek[dn]||[];
  const taskScore=tt.length?pct(tt.filter(t=>t.done).length,tt.length):0;
  const dwScore=clamp(Math.round((DB.dw.todayMins||0)/((DB.dw.focusMin||25)*(DB.dw.sessions||4))*100),0,100);
  const todayHabitScore=hs.length?pct(hs.filter(h=>isDoneToday(h)).length,hs.length):0;
  const courses=DB.courses||[];
  const studyScore=courses.length?Math.round(courses.reduce((s,c)=>s+(calcCourseGrade(c)||0),0)/courses.length):0;
  const budTotal=Object.values(DB.budgets||{}).reduce((s,v)=>s+v,0);
  const finScore=budTotal?clamp(100-Math.round(totalExpenses()/budTotal*100)+100,0,100):50;
  const domains=[['Deep Work',dwScore,'green'],['Habits',todayHabitScore,'blue'],['Study',studyScore,'purple'],['Finance',clamp(finScore,0,100),'amber'],['Tasks',taskScore,'green']];

  const prod7=[];
  for(let i=6;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    const ds=localISO(d);
    const hd=hs.length?pct(hs.filter(h=>h.doneHistory&&h.doneHistory[ds]).length,hs.length):0;
    const fm=clamp(Math.round((DB.dw.dailyMins[ds]||0)/120*100),0,100);
    prod7.push({score:Math.round((hd+fm)/2),lbl:'SMTWTFS'[d.getDay()],isToday:i===0});
  }

  // 30-day trend — blends habits + focus, and task completion from the
  // daily history snapshots once they accumulate
  const trend=[];
  for(let i=29;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    const ds=localISO(d);
    const snap=(DB.history||{})[ds];
    const hd=hs.length?pct(hs.filter(h=>h.doneHistory&&h.doneHistory[ds]).length,hs.length):0;
    const fm=clamp(Math.round((DB.dw.dailyMins[ds]||0)/120*100),0,100);
    const parts=[hd,fm];
    if(snap&&snap.tasksTotal) parts.push(pct(snap.tasksDone,snap.tasksTotal));
    trend.push({score:Math.round(parts.reduce((a,b)=>a+b,0)/parts.length),day:d.getDate(),isToday:i===0});
  }
  const trendAvg=Math.round(trend.reduce((s,x)=>s+x.score,0)/trend.length);

  pg.innerHTML=`<div style="max-width:1100px;margin:0 auto;width:100%;">

<div class="grid grid-cols-4 gap-2.5 max-[1100px]:grid-cols-2 max-[780px]:grid-cols-1" style="margin-bottom:14px;">
  ${statCard('','Habit Score',habitScore+'%','green',{ring:habitScore,delta:habitDelta,prev:habitPrev+' last wk'})}
  ${statCard('⏱','Focused This Week',Math.round(focusCur/60*10)/10+'h','cyan',{delta:focusDelta,prev:Math.round(focusPrev/60*10)/10+'h'})}
  ${statCard('💰','Net Savings',pkr(net),net>=0?'green':'red',{small:true,delta:netDelta})}
  ${statCard('','Goal Avg',goalAvg+'%','cyan',{ring:goalAvg})}
</div>

<div class="grid grid-cols-2 gap-3 max-[780px]:grid-cols-1" style="margin-bottom:12px;">
  <div class="card">
    <div class="card-header"><span class="card-title">Focus Hours — Last 14 Days</span></div>
    <div class="bar-chart" style="height:90px;">
      ${days14.map(d=>`<div class="bar-wrap">
        <div class="bar${d.isToday?' highlighted':''}" style="height:${Math.round(d.mins/maxF*70)+4}px;" title="${Math.round(d.mins/60*10)/10}h"></div>
        <div class="bar-lbl">${d.lbl}</div></div>`).join('')}
    </div>
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title">Domain Performance</span></div>
    ${domains.map(([l,v,c])=>`
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;">
          <span style="color:var(--text-secondary);">${l}</span><span style="font-family:var(--font-mono);color:var(--text-muted);">${v}%</span>
        </div>
        <div class="progress-track"><div class="progress-fill ${c}" style="width:${v}%;"></div></div>
      </div>`).join('')}
  </div>
</div>

<div class="card" style="margin-bottom:12px;">
  <div class="card-header"><span class="card-title">Productivity Trend — 30 Days</span><span style="font-size:11px;font-family:var(--font-mono);color:var(--accent);">avg ${trendAvg}%</span></div>
  <div class="bar-chart" style="height:80px;gap:3px;">
    ${trend.map(t=>`<div class="bar-wrap">
      <div class="bar${t.isToday?' highlighted':''}" style="height:${Math.round(t.score*0.62)+4}px;" title="Day ${t.day}: ${t.score}%"></div>
      ${t.day===1||t.isToday||t.day%5===0?`<div class="bar-lbl">${t.day}</div>`:'<div class="bar-lbl" style="opacity:0;">·</div>'}
    </div>`).join('')}
  </div>
</div>

<div class="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-2 max-[780px]:grid-cols-1">
  <div class="card">
    <div class="card-header"><span class="card-title">Habit Completion Rate</span></div>
    ${hs.map(h=>{ const mp=habitMonthPct(h); return `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px;">
        <span style="font-size:14px;">${h.icon}</span>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(h.name)}</span><span style="color:var(--text-muted);">${mp}%</span>
          </div>
          <div class="progress-track" style="height:4px;"><div class="progress-fill ${h.color}" style="width:${mp}%;"></div></div>
        </div></div>`; }).join('')||'<div style="font-size:11px;color:var(--text-muted);">No habits tracked</div>'}
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title">Productivity Score</span></div>
    <div class="bar-chart" style="height:90px;">
      ${prod7.map(d=>`<div class="bar-wrap">
        <div style="font-size:9px;color:var(--text-muted);">${d.score}</div>
        <div class="bar${d.isToday?' highlighted':''}" style="height:${Math.round(d.score*0.6)+4}px;"></div>
        <div class="bar-lbl">${d.lbl}</div></div>`).join('')}
    </div>
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title">Weekly Summary</span></div>
    ${[['⏱','Deep Work',weekH+'h'],['🔥','Habits Done',hs.filter(h=>isDoneToday(h)).length+'/'+hs.length],['💰','Net PKR',pkr(net)],['🎯','Goal Avg',goalAvg+'%'],['📚','Study Sessions',(DB.dw.log||[]).filter(s=>s.date>=localISO(new Date(Date.now()-6*86400000))).length]].map(([i,l,v])=>`
      <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);">
        <span>${i}</span><span style="flex:1;font-size:12px;color:var(--text-secondary);">${l}</span>
        <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-primary);">${v}</span>
      </div>`).join('')}
  </div>
</div>

</div>`;
}
