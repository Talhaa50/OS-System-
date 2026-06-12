import { DB } from '../core/db.js';
import { save } from '../core/save.js';
import { $, esc, clamp } from '../core/utils.js';
import { showToast } from '../core/utils.js';
import { gpaFromPct, normCourse, calcCourseGrade } from '../core/helpers.js';
import { statCard } from '../widgets/statcard.js';

let _openCourses = {};

function semCourses() { return (DB.courses||[]).filter(c=>(c.semester||1)==DB.activeSem); }

function calcCGPA() {
  const hist=DB.semesterHistory||[];
  if(!hist.length) return null;
  return (hist.reduce((s,h)=>s+h.gpa,0)/hist.length).toFixed(2);
}

export function rUniversity() {
  const pg=$('page-university'); if(!pg) return;
  const cs=semCourses(); cs.forEach(normCourse);
  const sems=[...new Set((DB.courses||[]).map(c=>c.semester||1))].sort((a,b)=>a-b);
  if(!sems.includes(DB.activeSem)) DB.activeSem=sems[0]||1;
  const cgpa=calcCGPA();
  const gradeCount=k=>cs.reduce((s,c)=>s+(c.grades[k]||[]).filter(x=>!x.done).length,0);
  const GCOL={blue:'var(--blue)',green:'var(--accent)',amber:'var(--amber)',purple:'var(--purple)',red:'var(--red)',orange:'var(--orange)'};

  pg.innerHTML=`<div style="max-width:1100px;margin:0 auto;width:100%;">

<div class="grid grid-cols-4 gap-2.5 max-[1100px]:grid-cols-2 max-[780px]:grid-cols-1" style="margin-bottom:14px;">
  ${statCard('📚','Subjects',cs.length,'cyan')}
  ${statCard('🎓','CGPA',cgpa||'—','green')}
  ${statCard('📝','Assignments Due',gradeCount('assignments'),'amber')}
  ${statCard('❓','Quizzes Left',gradeCount('quizzes'),'cyan')}
</div>

<div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;">
  ${sems.map(s=>`<button class="sem-tab${s==DB.activeSem?' active':''}" onclick="DB.activeSem=${s};save();rUniversity()">Semester ${s}</button>`).join('')}
  <button class="sem-tab" onclick="DB.activeSem=${(Math.max(...sems,0))+1};save();rUniversity();showToast('New semester started — add courses!')">+ New Semester</button>
</div>

<div class="card" style="margin-bottom:12px;">
  <div class="card-header"><span class="card-title">Subjects This Semester</span><button class="card-action" onclick="openModal('course')">+ Add Course</button></div>
  ${cs.length?cs.map(c=>{
    const grade=calcCourseGrade(c), open=!!_openCourses[c.id];
    const tab=DB.openCourseTab[c.id]||'overview';
    const col=GCOL[c.color]||'var(--blue)';
    const tabs=['overview','marks','assignments','quizzes','notes'];
    const g=c.grades;
    const avgOf=arr=>{ const d=arr.filter(x=>x.done&&x.total>0); return d.length?Math.round(d.reduce((s,x)=>s+x.marks/x.total*100,0)/d.length):null; };
    const needOnFinal=t=>{ const cur=[[g.midterm,30],[avgOf(g.assignments),20],[avgOf(g.quizzes),10]]; let sum=0; cur.forEach(([v,w])=>{ if(v!=null)sum+=v*w/100; }); return Math.round((t-sum)/0.4); };

    let body='';
    if(open){
      if(tab==='overview') body=`
        <div class="grid grid-cols-4 gap-2.5 max-[1100px]:grid-cols-2 max-[780px]:grid-cols-1" style="margin-bottom:10px;">
          ${[['Grade',grade!=null?grade+'%':'—'],['GPA',grade!=null?gpaFromPct(grade).toFixed(1):'—'],['Credits',c.credits],['Attendance',(c.attendance||0)+'%']].map(([l,v])=>
            `<div class="quick-stat" style="padding:7px;"><div class="quick-stat-label">${l}</div><div class="quick-stat-value" style="font-size:14px;">${v}</div></div>`).join('')}
        </div>
        <div class="grid grid-cols-2 gap-3 max-[780px]:grid-cols-1">
          <div class="input-group" style="margin:0;"><label class="input-label">Instructor</label>
            <input class="input-field" value="${esc(c.instructor||'')}" onchange="c_upd(${c.id},'instructor',this.value)"></div>
          <div class="input-group" style="margin:0;"><label class="input-label">Attendance %</label>
            <input type="number" class="input-field" value="${c.attendance||0}" min="0" max="100" onchange="c_upd(${c.id},'attendance',parseInt(this.value)||0)"></div>
        </div>`;
      if(tab==='marks'){
        const tg=85;
        body=`
        <div class="grid grid-cols-2 gap-3 max-[780px]:grid-cols-1" style="margin-bottom:10px;">
          <div class="input-group" style="margin:0;"><label class="input-label">Midterm % (30%)</label>
            <input type="number" class="input-field" value="${g.midterm??''}" placeholder="—" onchange="c_updGrade(${c.id},'midterm',this.value)"></div>
          <div class="input-group" style="margin:0;"><label class="input-label">Final Exam % (40%)</label>
            <input type="number" class="input-field" value="${g.finalExam??''}" placeholder="—" onchange="c_updGrade(${c.id},'finalExam',this.value)"></div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">Formula: Midterm 30% + Final 40% + Assignments 20% + Quizzes 10%</div>
        ${g.finalExam==null?`<div style="padding:8px 10px;background:var(--accent-glow);border:1px solid var(--border-soft);border-radius:var(--radius-sm);font-size:12px;color:var(--accent);">
          🎯 Need <strong>${clamp(needOnFinal(tg),0,200)}%</strong> on the final to reach <strong>${tg}%</strong> overall (A grade)</div>`:''}`;
      }
      if(tab==='assignments'||tab==='quizzes'){
        const k=tab, items=g[k]||[];
        body=`<table class="mini-table"><thead><tr><th style="width:40%;">Title</th><th>Marks</th><th>Total</th><th>%</th><th>Done</th><th></th></tr></thead><tbody>
        ${items.map((a,i)=>`<tr>
          <td><input value="${esc(a.title)}" onchange="c_updItem(${c.id},'${k}',${i},'title',this.value)"></td>
          <td><input type="number" value="${a.marks}" onchange="c_updItem(${c.id},'${k}',${i},'marks',parseFloat(this.value)||0)"></td>
          <td><input type="number" value="${a.total}" onchange="c_updItem(${c.id},'${k}',${i},'total',parseFloat(this.value)||100)"></td>
          <td style="font-family:var(--font-mono);">${a.total?Math.round(a.marks/a.total*100):0}%</td>
          <td><input type="checkbox" ${a.done?'checked':''} onchange="c_updItem(${c.id},'${k}',${i},'done',this.checked)"></td>
          <td><button class="todo-icon-btn" onclick="c_delItem(${c.id},'${k}',${i})">✕</button></td>
        </tr>`).join('')}</tbody></table>
        <button class="card-action" style="margin-top:8px;" onclick="c_addItem(${c.id},'${k}')">+ Add ${k==='assignments'?'Assignment':'Quiz'}</button>`;
      }
      if(tab==='notes') body=`<textarea class="input-field" rows="4" style="resize:vertical;" placeholder="Lecture notes..."
        onchange="c_upd(${c.id},'notes',this.value)">${esc(c.notes||'')}</textarea>`;
    }

    return `
    <div style="border:1px solid var(--border);border-left:4px solid ${col};border-radius:var(--radius-md);margin-bottom:10px;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:10px;padding:11px 12px;cursor:pointer;background:var(--bg-card);" onclick="toggleCourse(${c.id})">
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:13.5px;font-weight:600;">${esc(c.name)}</span>
            <span style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono);">${esc(c.code||'')}</span>
            ${grade!=null?`<span class="tag tag-${grade>=75?'green':grade>=60?'amber':'red'}">${grade}%</span>`:''}
            <span class="tag tag-blue">${c.credits} cr</span>
          </div>
          <div style="font-size:10.5px;color:var(--text-muted);margin-top:2px;">${esc(c.instructor||'—')} · Attendance ${c.attendance||0}%</div>
          <div class="progress-track" style="margin-top:6px;height:4px;"><div class="progress-fill ${c.color}" style="width:${grade||0}%;"></div></div>
        </div>
        <span style="color:var(--text-muted);font-size:12px;transform:rotate(${open?90:0}deg);transition:transform 0.2s;">▶</span>
      </div>
      ${open?`<div style="padding:12px;border-top:1px solid var(--border);background:var(--bg-surface);">
        <div style="display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap;">
          ${tabs.map(t=>`<button class="sem-tab${tab===t?' active':''}" style="padding:4px 10px;font-size:11px;" onclick="setCourseTab(${c.id},'${t}')">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`).join('')}
        </div>${body}</div>`:''}
    </div>`;
  }).join(''):'<div class="empty-state"><div class="empty-icon">🎓</div><div class="empty-text">No courses this semester. <span style="color:var(--accent);cursor:pointer;" onclick="openModal(\'course\')">Add your first course →</span></div></div>'}
</div>

<div class="grid grid-cols-2 gap-3 max-[780px]:grid-cols-1">
  <div class="card">
    <div class="card-header"><span class="card-title">Timetable</span><button class="card-action" onclick="openModal('timetable')">+ Add Class</button></div>
    <div id="uni-timetable"></div>
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title">Semester Results</span><button class="card-action" onclick="openModal('semHistory')">+ Add Past Semester</button></div>
    <div id="uni-results"></div>
  </div>
</div>

</div>`;

  rTimetable(); rDegreeResult();
}

export function c_upd(id,k,v) { const c=DB.courses.find(x=>x.id==id); if(!c)return; c[k]=v; save(); rUniversity(); }
export function c_updGrade(id,k,v) { const c=DB.courses.find(x=>x.id==id); if(!c)return; c.grades[k]=v===''?null:parseFloat(v); save(); rUniversity(); }
export function c_updItem(id,k,i,f,v) { const c=DB.courses.find(x=>x.id==id); if(!c)return; c.grades[k][i][f]=v; save(); rUniversity(); }
export function c_addItem(id,k) { const c=DB.courses.find(x=>x.id==id); if(!c)return; c.grades[k].push({title:(k==='assignments'?'Assignment ':'Quiz ')+(c.grades[k].length+1),marks:0,total:k==='assignments'?100:20,done:false}); save(); rUniversity(); }
export function c_delItem(id,k,i) { const c=DB.courses.find(x=>x.id==id); if(!c)return; c.grades[k].splice(i,1); save(); rUniversity(); }
export function toggleCourse(id) { _openCourses[id]=!_openCourses[id]; rUniversity(); }
export function setCourseTab(id,t) { DB.openCourseTab[id]=t; save(); rUniversity(); }

function rTimetable() {
  const el=$('uni-timetable'); if(!el)return;
  const tt=DB.timetable||[];
  el.innerHTML=tt.length?`<table class="mini-table"><thead><tr><th>Day</th><th>Time</th><th>Subject</th><th>Room</th><th></th></tr></thead><tbody>
    ${tt.map(t=>`<tr><td>${esc(t.day)}</td><td style="font-family:var(--font-mono);font-size:11px;">${esc(t.time)}</td><td style="color:var(--text-primary);">${esc(t.subject)}</td><td>${esc(t.room||'')}</td>
      <td><button class="todo-icon-btn" onclick="delTT(${t.id})">✕</button></td></tr>`).join('')}</tbody></table>`
    :'<div style="padding:14px 0;text-align:center;color:var(--text-muted);font-size:12px;">No classes scheduled</div>';
}

function rDegreeResult() {
  const el=$('uni-results'); if(!el)return;
  const hist=DB.semesterHistory||[];
  el.innerHTML=(hist.length?`<table class="mini-table"><thead><tr><th>Semester</th><th>Year</th><th>Courses</th><th>GPA</th><th></th></tr></thead><tbody>
    ${hist.map((h,i)=>`<tr><td style="color:var(--text-primary);">Semester ${h.sem}</td><td>${esc(h.year)}</td><td>${h.courses}</td>
      <td><span class="tag tag-${h.gpa>=3.5?'green':h.gpa>=3?'blue':'amber'}">${h.gpa.toFixed(2)}</span></td>
      <td><button class="todo-icon-btn" onclick="delSemHist(${i})">✕</button></td></tr>`).join('')}</tbody></table>`
    :'<div style="padding:14px 0;text-align:center;color:var(--text-muted);font-size:12px;">No past semesters recorded</div>')
    +(calcCGPA()?`<div style="margin-top:10px;text-align:right;"><span class="tag tag-green" style="font-size:12px;padding:4px 12px;">CGPA: ${calcCGPA()}</span></div>`:'');
}

export function delTT(id) { DB.timetable=DB.timetable.filter(t=>t.id!=id); save(); rTimetable(); showToast('Class removed'); }
export function delSemHist(i) { DB.semesterHistory.splice(i,1); save(); rDegreeResult(); rUniversity(); }
