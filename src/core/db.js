export const DEFAULTS = {
  habits: [
    {id:1,icon:'🏋️',name:'Gym / Workout', streak:55,doneHistory:{},target:1,color:'green'},
    {id:2,icon:'📖',name:'Reading',        streak:50,doneHistory:{},target:1,color:'blue'},
    {id:3,icon:'💧',name:'Water (3L)',      streak:28,doneHistory:{},target:1,color:'blue'},
    {id:4,icon:'😴',name:'Sleep 8h',        streak:22,doneHistory:{},target:1,color:'purple'},
    {id:5,icon:'🧘',name:'Meditation',      streak:15,doneHistory:{},target:1,color:'amber'}
  ],
  todoWeek: {
    monday:    [{id:101,text:'Review CS101 lecture notes',done:false},{id:102,text:'Complete math assignment #3',done:true},{id:103,text:'Push client project updates',done:false}],
    tuesday:   [{id:104,text:'Attend Software Engineering lab',done:false},{id:105,text:'Read chapter 5 of Clean Code',done:false}],
    wednesday: [{id:106,text:'Work on freelance client UI',done:false},{id:107,text:'Study for database quiz',done:false},{id:108,text:'Review weekly budget',done:true}],
    thursday:  [{id:109,text:'Submit assignment via LMS',done:false},{id:110,text:'Research new project tech stack',done:false}],
    friday:    [{id:111,text:'Weekly code review',done:false},{id:112,text:'Update portfolio website',done:false}],
    saturday:  [{id:113,text:'Deep focus session (2h)',done:false},{id:114,text:'Plan next week goals',done:false}],
    sunday:    [{id:115,text:'Family time / rest day',done:false},{id:116,text:'Review weekly progress',done:false}]
  },
  ntfItems: [
    {id:1,text:'Lock the front door before leaving'},
    {id:2,text:'Turn off the gas stove after cooking'},
    {id:3,text:'Plug out chargers when not in use'},
    {id:4,text:'Set phone to DND before deep work'}
  ],
  transactions: [
    {id:1,icon:'💼',name:'Freelance Project — UI Design',date:'2026-06-01',cat:'Income',   catColor:'green', amount:45000,type:'inc'},
    {id:2,icon:'🍔',name:'Lunch & Dinner (week)',        date:'2026-06-02',cat:'Food',     catColor:'orange',amount:2800, type:'exp'},
    {id:3,icon:'🚌',name:'Bus / Uber rides',             date:'2026-06-03',cat:'Transport',catColor:'blue',  amount:1200, type:'exp'},
    {id:4,icon:'📺',name:'Netflix Subscription',         date:'2026-06-04',cat:'Subs',     catColor:'red',   amount:1100, type:'exp'},
    {id:5,icon:'📚',name:'University Books',             date:'2026-06-04',cat:'Shopping', catColor:'purple',amount:3500, type:'exp'},
    {id:6,icon:'💰',name:'Part-time tutoring',           date:'2026-06-05',cat:'Income',   catColor:'green', amount:8000, type:'inc'}
  ],
  subscriptions: [
    {id:1,icon:'📺',name:'Netflix',              amount:1100,status:'active'},
    {id:2,icon:'🎨',name:'Adobe Creative Cloud', amount:4500,status:'active'},
    {id:3,icon:'🎵',name:'Spotify',              amount:380, status:'active'},
    {id:4,icon:'🏦',name:'Emergency Fund SIP',    amount:5000,status:'active'}
  ],
  goals: [
    {id:1,icon:'🎓',title:'Maintain 3.5+ GPA this semester',cat:'Academic',pct:72,status:'on-track',deadline:'2026-12-20',note:'Need 85%+ in final exams'},
    {id:2,icon:'💪',title:'Run 5km without stopping',         cat:'Fitness', pct:60,status:'on-track',deadline:'2026-07-15',currentVal:3,  targetVal:5},
    {id:3,icon:'💰',title:'Save ₨50,000 emergency fund',      cat:'Finance', pct:45,status:'at-risk', deadline:'2026-08-01',currentVal:22500,targetVal:50000},
    {id:4,icon:'🚀',title:'Launch personal portfolio v2',      cat:'Tech',    pct:80,status:'on-track',deadline:'2026-06-30'},
    {id:5,icon:'📖',title:'Read 12 books this year',           cat:'Personal',pct:50,status:'on-track',deadline:'2026-12-31',currentVal:6,  targetVal:12}
  ],
  projects: [
    {id:1,icon:'🌐',name:'E-commerce Dashboard',client:'TechRetail PK',projectType:'Web App',
     contractValue:120000,paidAmount:60000,hoursLogged:42,deadline:'2026-07-15',
     desc:'Full-stack admin dashboard for an e-commerce platform with analytics and inventory management.',
     status:'in-progress',progress:65,tech:'React',techStack:['React','Node.js','MongoDB','Tailwind'],
     notes:'Client wants dark theme. Mobile responsive needed.',
     todos:[{id:1,text:'Complete product listing page',done:true},{id:2,text:'Integrate payment API',done:false},{id:3,text:'Build analytics charts',done:false}],
     links:'github.com/Zyrax/ecom-dash',timeline:'2026-04-01 to 2026-07-15'},
    {id:2,icon:'📱',name:'Fitness App UI Kit',client:'FitPro Studios',projectType:'UI Design',
     contractValue:45000,paidAmount:45000,hoursLogged:28,deadline:'2026-05-30',
     desc:'Complete Figma UI kit for a fitness tracking mobile app with 60+ components.',
     status:'done',progress:100,tech:'Figma',techStack:['Figma','Illustrator'],
     notes:'Delivered. Client very happy.',todos:[],links:'figma.com/file/fitpro',timeline:'2026-03-01 to 2026-05-30'},
    {id:3,icon:'🔧',name:'Restaurant POS System',client:'Karachi Eats',projectType:'Desktop App',
     contractValue:200000,paidAmount:50000,hoursLogged:18,deadline:'2026-09-01',
     desc:'Point of sale system with order management, billing, and inventory tracking.',
     status:'in-progress',progress:20,tech:'Electron',techStack:['Electron','Vue.js','SQLite'],
     notes:'In early stages. Need to finalize requirements.',
     todos:[{id:1,text:'Finalize feature requirements',done:false},{id:2,text:'Design DB schema',done:false}],
     links:'',timeline:'2026-06-01 to 2026-09-01'}
  ],
  courses: [
    {id:1,name:'Data Structures & Algorithms',code:'CS201',color:'blue',  credits:3,semester:1,
     grades:{midterm:78,finalExam:null,assignments:[85,90,76,88],quizzes:[72,80,85,78]},
     attendance:88,totalClasses:30,notes:'Red-Black trees coming up. Review sorting algorithms.',instructor:'Dr. Ahmed Khan'},
    {id:2,name:'Software Engineering',         code:'SE301',color:'green', credits:3,semester:1,
     grades:{midterm:82,finalExam:null,assignments:[88,92,85],   quizzes:[80,85,90]},
     attendance:93,totalClasses:28,notes:'Group project due end of month.',instructor:'Dr. Sara Malik'},
    {id:3,name:'Database Systems',             code:'CS302',color:'amber', credits:3,semester:1,
     grades:{midterm:74,finalExam:null,assignments:[70,78,82,75],quizzes:[68,75,72]},
     attendance:80,totalClasses:32,notes:'SQL queries and normalization.',instructor:'Prof. Imran Butt'},
    {id:4,name:'Computer Networks',            code:'CS401',color:'purple',credits:3,semester:1,
     grades:{midterm:68,finalExam:null,assignments:[72,65,80],   quizzes:[70,65,75,68]},
     attendance:75,totalClasses:26,notes:'TCP/IP model and OSI layers.',instructor:'Dr. Zara Hussain'}
  ],
  timetable: [
    {id:1,subject:'Data Structures & Algorithms',day:'Monday',   time:'09:00 - 10:30',room:'CS-301'},
    {id:2,subject:'Software Engineering',         day:'Monday',   time:'11:00 - 12:30',room:'SE-Lab'},
    {id:3,subject:'Database Systems',             day:'Tuesday',  time:'09:00 - 10:30',room:'CS-201'},
    {id:4,subject:'Computer Networks',            day:'Wednesday',time:'14:00 - 15:30',room:'CS-401'},
    {id:5,subject:'Data Structures & Algorithms',day:'Thursday', time:'09:00 - 10:30',room:'CS-301'},
    {id:6,subject:'Software Engineering Lab',     day:'Friday',   time:'10:00 - 12:00',room:'SE-Lab2'}
  ],
  semesterHistory: [
    {sem:1,gpa:3.2,courses:4,year:'2024'},
    {sem:2,gpa:3.5,courses:4,year:'2024'},
    {sem:3,gpa:3.4,courses:5,year:'2025'}
  ],
  calEvents: (()=>{
    const y=new Date().getFullYear(), m=new Date().getMonth()+1;
    const p=n=>String(n).padStart(2,'0');
    const nm=m<12?m+1:1, ny=m<12?y:y+1;
    return [
      {id:1,date:`${y}-${p(m)}-10`,title:'DS&A Mid Exam',      color:'red',   time:'09:00',location:'Exam Hall A',category:'Academic'},
      {id:2,date:`${y}-${p(m)}-15`,title:'Project Deadline',   color:'amber', time:'23:59',                       category:'Work'},
      {id:3,date:`${y}-${p(m)}-18`,title:'Gym — PR Attempt',   color:'green', time:'07:00',                       category:'Fitness'},
      {id:4,date:`${y}-${p(m)}-22`,title:'Client Meeting',     color:'blue',  time:'15:00',location:'Online',     category:'Work'},
      {id:5,date:`${ny}-${p(nm)}-05`,title:'Semester Registration',color:'purple',time:'09:00',                   category:'Academic'},
      {id:6,date:`${ny}-${p(nm)}-12`,title:'Portfolio Launch', color:'green', time:'00:00',                       category:'Work'}
    ];
  })(),
  notes: [
    {id:1,title:'Productivity Framework',tag:'productivity',
     content:'# My System\n\n## Morning Routine (7am)\n- Review goals\n- Plan 3 MITs\n- 25min deep work block\n\n## Evening Review\n- Done list review\n- Prepare tomorrow\n\n> "The key is not to prioritize what\'s on your schedule, but to schedule your priorities."'},
    {id:2,title:'DSA Study Notes — Trees',tag:'study',
     content:'# Binary Trees\n\n## Types\n- BST: left < root < right\n- AVL: self-balancing, height diff ≤ 1\n- Red-Black: 5 properties\n\n## Traversals\n- Inorder: L → Root → R\n- Preorder: Root → L → R\n- Postorder: L → R → Root'},
    {id:3,title:'Freelance Finance Notes',tag:'finance',
     content:'# Rates & Invoicing\n\n## Current Rates\n- UI Design: ₨3,500/hr\n- Full Stack: ₨4,500/hr\n\n## Monthly Target\n- Minimum: ₨40,000\n- Stretch: ₨70,000'}
  ],
  books: [
    {id:1,title:'Deep Work',               author:'Cal Newport',     year:2016,pages:304,currentPage:210,status:'reading',genre:'Productivity',rating:5,spineColor:'#1e3a5f',quotes:['Clarity about what matters provides clarity about what does not.'],notes:'Life-changing approach to focused work.',finishedDate:null},
    {id:2,title:'Atomic Habits',           author:'James Clear',     year:2018,pages:320,currentPage:320,status:'done',   genre:'Self-Help',   rating:5,spineColor:'#3b1f5e',quotes:["You don't rise to the level of your goals, you fall to the level of your systems."],notes:'Applied 1% better every day to coding habits.',finishedDate:'2026-03-15'},
    {id:3,title:'Clean Code',              author:'Robert C. Martin',year:2008,pages:431,currentPage:180,status:'reading',genre:'Programming', rating:4,spineColor:'#1a1a1a',quotes:['Truth can only be found in one place: the code.'],notes:'Essential reading for any dev.',finishedDate:null},
    {id:4,title:'The Pragmatic Programmer',author:'Hunt & Thomas',   year:2019,pages:352,currentPage:352,status:'done',   genre:'Programming', rating:5,spineColor:'#2d4a1e',quotes:["Don't live with broken windows."],notes:'Career-defining book.',finishedDate:'2026-01-20'},
    {id:5,title:'Rich Dad Poor Dad',       author:'Robert Kiyosaki', year:1997,pages:336,currentPage:0,  status:'want',   genre:'Finance',     rating:0,spineColor:'#4a2c1a',quotes:[],notes:'',finishedDate:null},
    {id:6,title:'The Psychology of Money', author:'Morgan Housel',   year:2020,pages:256,currentPage:256,status:'done',   genre:'Finance',     rating:5,spineColor:'#1f3d2e',quotes:["Wealth is what you don't see."],notes:'Changed how I think about money.',finishedDate:'2026-04-08'},
    {id:7,title:'Zero to One',             author:'Peter Thiel',     year:2014,pages:224,currentPage:0,  status:'want',   genre:'Business',    rating:0,spineColor:'#1e1e3a',quotes:[],notes:'Recommended by mentor.',finishedDate:null}
  ],
  quotes: [
    {text:'The secret of getting ahead is getting started.',                   author:'Mark Twain'},
    {text:'It does not matter how slowly you go as long as you do not stop.',  author:'Confucius'},
    {text:'Success is the sum of small efforts, repeated day in and day out.', author:'Robert Collier'},
    {text:"Hard work beats talent when talent doesn't work hard.",             author:'Tim Notke'},
    {text:'Focus on being productive instead of busy.',                        author:'Tim Ferriss'}
  ]
};

export let DB = {};

export function loadDB() {
  const get = (k, def) => {
    try { const v = localStorage.getItem('pos4_'+k); return v !== null ? JSON.parse(v) : def; }
    catch(e) { return def; }
  };
  DB = {
    habits:          get('habits',          DEFAULTS.habits),
    water:           get('water',           3),
    todoWeek:        get('todoWeek',        DEFAULTS.todoWeek),
    ntfItems:        get('ntfItems',        DEFAULTS.ntfItems),
    transactions:    get('transactions',    DEFAULTS.transactions),
    subscriptions:   get('subscriptions',   DEFAULTS.subscriptions),
    goals:           get('goals',           DEFAULTS.goals),
    projects:        get('projects',        DEFAULTS.projects),
    courses:         get('courses',         DEFAULTS.courses),
    timetable:       get('timetable',       DEFAULTS.timetable),
    semesterHistory: get('semesterHistory', DEFAULTS.semesterHistory),
    calEvents:       get('calEvents',       DEFAULTS.calEvents),
    notes:           get('notes',           DEFAULTS.notes),
    books:           get('books',           DEFAULTS.books),
    quotes:          get('quotes',          DEFAULTS.quotes),
    dw: get('dw', {focusMin:25,shortMin:5,longMin:15,sessions:4,running:false,secs:1500,mode:'focus',sessCount:0,todayMins:0,weekMins:0,allMins:0,log:[],dailyMins:{}}),
    calYear:         get('calYear',         new Date().getFullYear()),
    calMonth:        get('calMonth',        new Date().getMonth()),
    activeNote:      get('activeNote',      1),
    editCtx:         {type:null,id:null,extra:null},
    curModal:        null,
    quoteIdx:        get('quoteIdx',        0),
    todoNextId:      get('todoNextId',      200),
    ntfNextId:       get('ntfNextId',       20),
    openProjectId:   get('openProjectId',   null),
    openCourseId:    get('openCourseId',    null),
    activeSem:       get('activeSem',       1),
    openCourseTab:   get('openCourseTab',   {}),
    activeBook:      get('activeBook',      null),
    bookFilter:      get('bookFilter',      'reading'),
    recurringTasks:  get('recurringTasks',  {}),
    journal:         get('journal',         {}),
    budgets:         get('budgets',         {Food:15000,Transport:5000,Personal:5000,Subs:5000,Other:5000,Shopping:10000,Health:5000}),
    username:        get('username',        'Zyrax'),
    userStatus:      get('userStatus',      'Deep Work Active'),
    lastPage:        get('lastPage',        'dashboard'),
    lastDate:        get('lastDate',        ''),
    lastWeek:        get('lastWeek',        -1),
    projView:        get('projView',        'board'),
    theme:           get('theme',           'dark'),
    countdownMode:   get('countdownMode',   'month'),
    history:         get('history',         {}),
    pacHigh:         get('pacHigh',         0),
    lastBackup:      get('lastBackup',      0)
  };
  DB.dw.todayMins = get('dwTodayMins', 0);
  DB.dw.weekMins  = get('dwWeekMins',  0);
  DB.dw.allMins   = get('dwAllMins',   0);
  DB.dw.log       = get('dwLog',       []);
  DB.dw.dailyMins = get('dwDailyMins', {});
}

export function runMigrations() {
  (DB.goals||[]).forEach(g=>{
    if(g.status==='in-progress') g.status='on-track';
    if(g.status==='complete')    g.status='done';
    if(g.status==='danger')      g.status='at-risk';
  });
  (DB.projects||[]).forEach(p=>{ if(!p.todos)p.todos=[]; if(!p.techStack)p.techStack=[]; });
  (DB.habits||[]).forEach(h=>{ if(!h.doneHistory)h.doneHistory={}; });
}
