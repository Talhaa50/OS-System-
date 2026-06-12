import { DB } from './db.js';
import { today, pct, clamp } from './utils.js';

export function isDoneToday(h) {
  return !!(h.doneHistory && h.doneHistory[today()]);
}

export function habitMonthPct(h) {
  const now=new Date(), y=now.getFullYear(), m=now.getMonth();
  const days=new Date(y,m+1,0).getDate(); let done=0;
  for(let d=1;d<=days;d++){
    const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    if(h.doneHistory&&h.doneHistory[ds]) done++;
  }
  return pct(done,days);
}

export function totalIncome()   { return (DB.transactions||[]).filter(t=>t.type==='inc').reduce((s,t)=>s+t.amount,0); }
export function totalExpenses() { return (DB.transactions||[]).filter(t=>t.type==='exp').reduce((s,t)=>s+t.amount,0); }

export function computeExpDonut() {
  const CAT_COL={Food:'#fb923c',Transport:'#60a5fa',Shopping:'#a78bfa',Health:'#34d399',
    Personal:'#fbbf24',Subs:'#f87171',Education:'#c084fc',Other:'#6b7280'};
  const cats={};
  (DB.transactions||[]).filter(t=>t.type==='exp').forEach(t=>{ cats[t.cat]=(cats[t.cat]||0)+t.amount; });
  return Object.entries(cats).map(([k,v])=>({label:k,value:v,color:CAT_COL[k]||'#6b7280'}));
}

export function fmtTxnDate(d) {
  if(!d) return '';
  return new Date(d).toLocaleDateString('en-PK',{month:'short',day:'numeric'});
}

export function gpaFromPct(p) {
  if(p==null) return null;
  if(p>=85)return 4.0; if(p>=80)return 3.7; if(p>=75)return 3.3; if(p>=70)return 3.0;
  if(p>=65)return 2.7; if(p>=60)return 2.3; if(p>=55)return 2.0; if(p>=50)return 1.0; return 0;
}

export function normCourse(c) {
  if(!c.grades)c.grades={midterm:null,finalExam:null,assignments:[],quizzes:[]};
  ['assignments','quizzes'].forEach(k=>{
    c.grades[k]=(c.grades[k]||[]).map((a,i)=>typeof a==='number'
      ?{title:(k==='assignments'?'Assignment ':'Quiz ')+(i+1),marks:a,total:100,done:true}:a);
  });
}

export function calcCourseGrade(c) {
  normCourse(c);
  const g=c.grades;
  const avg=arr=>{ const d=arr.filter(x=>x.done&&x.total>0); return d.length?d.reduce((s,x)=>s+x.marks/x.total*100,0)/d.length:null; };
  const parts=[[g.midterm,30],[g.finalExam,40],[avg(g.assignments),20],[avg(g.quizzes),10]];
  let sum=0,w=0;
  parts.forEach(([v,wt])=>{ if(v!=null&&!isNaN(v)){sum+=v*wt;w+=wt;} });
  return w?Math.round(sum/w):null;
}
