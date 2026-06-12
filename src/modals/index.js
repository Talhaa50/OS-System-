import { DB } from '../core/db.js';
import { save } from '../core/save.js';
import { $, html, esc, uid, val, pct, today, showToast } from '../core/utils.js';

const MODALS = {
  habit: {
    title:'Add Habit',
    fields:[
      {id:'m_icon', label:'Icon (emoji)',type:'text',   placeholder:'🏋️'},
      {id:'m_name', label:'Habit Name',  type:'text',   placeholder:'e.g. Morning Run'},
      {id:'m_color',label:'Color',       type:'select', options:['green','blue','amber','purple','red','orange']}
    ],
    save() {
      const name = val('m_name'); if(!name){showToast('Enter a habit name');return;}
      DB.habits.push({id:uid(),icon:val('m_icon')||'✅',name,streak:0,doneHistory:{},target:1,color:val('m_color')||'green'});
      save(); closeModalDirect(); window.rHabits?.(); showToast('Habit added!');
    }
  },
  task: {
    title:'Add Task',
    fields:[
      {id:'m_text',label:'Task',type:'text',placeholder:'What needs to be done?'},
      {id:'m_day', label:'Day', type:'select',options:['monday','tuesday','wednesday','thursday','friday','saturday','sunday']}
    ],
    save() {
      const text=val('m_text'); if(!text){showToast('Enter a task');return;}
      const day=val('m_day')||'monday';
      if(!DB.todoWeek[day])DB.todoWeek[day]=[];
      DB.todoNextId=(DB.todoNextId||200)+1;
      DB.todoWeek[day].push({id:DB.todoNextId,text,done:false});
      save(); closeModalDirect(); window.rTodo?.(); showToast('Task added!');
    }
  },
  expense: {
    title:'Add Transaction',
    fields:[
      {id:'m_tname',  label:'Description',    type:'text',  placeholder:'e.g. Lunch'},
      {id:'m_tamount',label:'Amount (₨)',      type:'number',placeholder:'0'},
      {id:'m_ttype',  label:'Type',            type:'select',options:['exp','inc']},
      {id:'m_tcat',   label:'Category',        type:'select',options:['Food','Transport','Shopping','Health','Personal','Subs','Education','Other','Income']},
      {id:'m_tdate',  label:'Date',            type:'date'}
    ],
    save() {
      const name=val('m_tname'),amount=parseFloat(val('m_tamount'));
      if(!name||!amount){showToast('Fill required fields');return;}
      const type=val('m_ttype')||'exp';
      DB.transactions.unshift({id:uid(),icon:type==='inc'?'💰':'💸',name,
        date:val('m_tdate')||today(),cat:val('m_tcat')||'Other',catColor:type==='inc'?'green':'red',amount,type});
      save(); closeModalDirect(); window.rFinance?.(); showToast('Transaction saved!');
    }
  },
  goal: {
    title:'Add Goal',
    fields:[
      {id:'m_gicon',    label:'Icon',           type:'text',  placeholder:'🎯'},
      {id:'m_gtitle',   label:'Goal',           type:'text',  placeholder:'What do you want to achieve?'},
      {id:'m_gcat',     label:'Category',       type:'select',options:['Academic','Fitness','Finance','Tech','Personal','Health','Career']},
      {id:'m_gdeadline',label:'Deadline',       type:'date'},
      {id:'m_gtarget',  label:'Target Value',   type:'number',placeholder:'e.g. 50000'},
      {id:'m_gcurrent', label:'Current Value',  type:'number',placeholder:'0'}
    ],
    save() {
      const title=val('m_gtitle'); if(!title){showToast('Enter a goal');return;}
      const tv=parseFloat(val('m_gtarget'))||null, cv=parseFloat(val('m_gcurrent'))||0;
      DB.goals.push({id:uid(),icon:val('m_gicon')||'🎯',title,cat:val('m_gcat')||'Personal',
        pct:tv?pct(cv,tv):0,status:'on-track',deadline:val('m_gdeadline')||'',
        currentVal:tv?cv:null,targetVal:tv});
      save(); closeModalDirect(); window.rGoals?.(); showToast('Goal added!');
    }
  },
  project: {
    title:'Add Project',
    fields:[
      {id:'m_picon',    label:'Icon',           type:'text',  placeholder:'🚀'},
      {id:'m_pname',    label:'Project Name',   type:'text',  placeholder:'Project name'},
      {id:'m_pclient',  label:'Client',         type:'text',  placeholder:'Client name'},
      {id:'m_ptype',    label:'Type',           type:'select',options:['Web App','Mobile App','UI Design','Desktop App','API','Consulting','Other']},
      {id:'m_pvalue',   label:'Contract (₨)',   type:'number',placeholder:'0'},
      {id:'m_pdeadline',label:'Deadline',       type:'date'}
    ],
    save() {
      const name=val('m_pname'); if(!name){showToast('Enter project name');return;}
      DB.projects.push({id:uid(),icon:val('m_picon')||'🚀',name,client:val('m_pclient')||'Personal',
        projectType:val('m_ptype')||'Web App',contractValue:parseFloat(val('m_pvalue'))||0,
        paidAmount:0,hoursLogged:0,deadline:val('m_pdeadline')||'',desc:'',status:'in-progress',
        progress:0,tech:'',techStack:[],notes:'',todos:[],links:'',timeline:''});
      save(); closeModalDirect(); window.rProjects?.(); showToast('Project created!');
    }
  },
  course: {
    title:'Add Course',
    fields:[
      {id:'m_cname',       label:'Course Name', type:'text',  placeholder:'e.g. Data Structures'},
      {id:'m_ccode',       label:'Course Code', type:'text',  placeholder:'e.g. CS201'},
      {id:'m_ccredits',    label:'Credits',     type:'number',placeholder:'3'},
      {id:'m_ccolor',      label:'Color',       type:'select',options:['blue','green','amber','purple','red','orange']},
      {id:'m_cinstructor', label:'Instructor',  type:'text',  placeholder:'Dr. Name'}
    ],
    save() {
      const name=val('m_cname'); if(!name){showToast('Enter course name');return;}
      DB.courses.push({id:uid(),name,code:val('m_ccode'),color:val('m_ccolor')||'blue',
        credits:parseInt(val('m_ccredits'))||3,semester:DB.activeSem||1,
        grades:{midterm:null,finalExam:null,assignments:[],quizzes:[]},
        attendance:0,totalClasses:0,notes:'',instructor:val('m_cinstructor')||''});
      save(); closeModalDirect(); window.rUniversity?.(); showToast('Course added!');
    }
  },
  timetable: {
    title:'Add Timetable Entry',
    fields:[
      {id:'m_ttsub', label:'Subject',type:'text',  placeholder:'Subject name'},
      {id:'m_ttday', label:'Day',    type:'select',options:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']},
      {id:'m_tttime',label:'Time',   type:'text',  placeholder:'09:00 - 10:30'},
      {id:'m_ttroom',label:'Room',   type:'text',  placeholder:'CS-301'}
    ],
    save() {
      const sub=val('m_ttsub'); if(!sub){showToast('Enter subject');return;}
      DB.timetable.push({id:uid(),subject:sub,day:val('m_ttday')||'Monday',time:val('m_tttime'),room:val('m_ttroom')});
      save(); closeModalDirect(); window.rUniversity?.(); showToast('Timetable updated!');
    }
  },
  calEvent: {
    title:'Add Event',
    fields:[
      {id:'m_etitle',label:'Event Title',   type:'text', placeholder:'Event name'},
      {id:'m_edate', label:'Date',          type:'date'},
      {id:'m_etime', label:'Time',          type:'text', placeholder:'09:00'},
      {id:'m_eloc',  label:'Location',      type:'text', placeholder:'Location (optional)'},
      {id:'m_ecolor',label:'Color',         type:'select',options:['green','blue','red','amber','purple','orange']}
    ],
    save() {
      const title=val('m_etitle'),date=val('m_edate'); if(!title||!date){showToast('Fill required fields');return;}
      DB.calEvents.push({id:uid(),title,date,time:val('m_etime'),location:val('m_eloc'),color:val('m_ecolor')||'blue',category:'Other'});
      save(); closeModalDirect(); window.rCalendar?.(); showToast('Event added!');
    }
  },
  semHistory: {
    title:'Add Semester',
    fields:[
      {id:'m_ssem',    label:'Semester #',type:'number',placeholder:'4'},
      {id:'m_sgpa',    label:'GPA',       type:'number',placeholder:'3.5'},
      {id:'m_scourses',label:'Courses',   type:'number',placeholder:'5'},
      {id:'m_syear',   label:'Year',      type:'text',  placeholder:'2025'}
    ],
    save() {
      const sem=parseInt(val('m_ssem')),gpa=parseFloat(val('m_sgpa')); if(!sem||!gpa){showToast('Fill required fields');return;}
      DB.semesterHistory.push({sem,gpa,courses:parseInt(val('m_scourses'))||4,year:val('m_syear')||String(new Date().getFullYear())});
      save(); closeModalDirect(); window.rUniversity?.(); showToast('Semester added!');
    }
  },
  book: {
    title:'Add Book',
    fields:[
      {id:'m_btitle', label:'Title',  type:'text',  placeholder:'Book title'},
      {id:'m_bauthor',label:'Author', type:'text',  placeholder:'Author name'},
      {id:'m_bpages', label:'Pages',  type:'number',placeholder:'300'},
      {id:'m_bgenre', label:'Genre',  type:'select',options:['Productivity','Programming','Self-Help','Finance','Business','Fiction','Science','History','Philosophy','Other']},
      {id:'m_bstatus',label:'Status', type:'select',options:['want','reading','done']},
      {id:'m_byear',  label:'Year',   type:'number',placeholder:'2024'}
    ],
    save() {
      const title=val('m_btitle'); if(!title){showToast('Enter book title');return;}
      DB.books.push({id:uid(),title,author:val('m_bauthor')||'Unknown',year:parseInt(val('m_byear'))||new Date().getFullYear(),
        pages:parseInt(val('m_bpages'))||200,currentPage:0,status:val('m_bstatus')||'want',
        genre:val('m_bgenre')||'Other',rating:0,spineColor:'#1a231a',quotes:[],notes:'',finishedDate:null});
      save(); closeModalDirect(); window.rBooks?.(); showToast('Book added!');
    }
  }
};

export function openModal(type) {
  const cfg = MODALS[type]; if (!cfg) return;
  DB.curModal = type;
  html('modal-title', esc(cfg.title));
  html('modal-body', cfg.fields.map(f => {
    let inp = f.type==='select'
      ? `<select class="input-field" id="${f.id}">${f.options.map(o=>`<option value="${esc(o)}">${esc(o.charAt(0).toUpperCase()+o.slice(1))}</option>`).join('')}</select>`
      : `<input type="${f.type}" class="input-field" id="${f.id}" placeholder="${esc(f.placeholder||'')}">`;
    return `<div class="input-group"><label class="input-label" for="${f.id}">${esc(f.label)}</label>${inp}</div>`;
  }).join(''));
  $('modalOverlay').classList.add('open');
  setTimeout(()=>{ const fi=$('modal-body').querySelector('input,select'); if(fi)fi.focus(); }, 60);
}

export function saveModal() { if(DB.curModal&&MODALS[DB.curModal])MODALS[DB.curModal].save(); }
export function closeModalDirect() { $('modalOverlay').classList.remove('open'); DB.curModal=null; }
export function closeEditModal()   { $('editModalOverlay').classList.remove('open'); DB.editCtx={type:null,id:null,extra:null}; }
export function saveEdit()         { document.dispatchEvent(new CustomEvent('pos:saveEdit',   {detail:DB.editCtx})); }
export function confirmDelete()    { document.dispatchEvent(new CustomEvent('pos:deleteItem', {detail:DB.editCtx})); closeEditModal(); }
