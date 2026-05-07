import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  Users, FileText, PlusCircle, LayoutDashboard, MessageSquare, 
  Calendar, Database, ExternalLink, Sparkles, Zap, BarChart3, 
  Search, PenTool, CreditCard, UserCheck, ArrowRight 
} from 'lucide-react';

/**
 * Firebase 설정을 로드합니다.
 * Canvas 미리보기 환경과 Vercel/Vite 배포 환경을 모두 지원합니다.
 */
const getFirebaseConfig = () => {
  // 1. Canvas 미리보기 환경 전역 변수 확인
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    try {
      return JSON.parse(__firebase_config);
    } catch (e) {
      console.error("Firebase config parse error:", e);
    }
  }

  // 2. 배포 환경 변수 확인 (Vite 빌드 타임 주입)
  // 컴파일러 경고를 방지하기 위해 런타임 존재 여부를 확인합니다.
  const getEnvValue = (key) => {
    try {
      // Vite 환경 변수 접근 (배포 시 필수)
      // eslint-disable-next-line no-undef
      const metaEnv = import.meta.env;
      return metaEnv ? metaEnv[key] || "" : "";
    } catch (e) {
      return "";
    }
  };

  return {
    apiKey: getEnvValue('VITE_FIREBASE_API_KEY'),
    authDomain: getEnvValue('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnvValue('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: getEnvValue('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnvValue('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnvValue('VITE_FIREBASE_APP_ID')
  };
};

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : "msg-club-2026-vFinal-Dashboard";

const MEMBERS = [
  { name: '정원화', school: '서천초', role: '회장' },
  { name: '김주민', school: '옥천초', role: '총무' },
  { name: '김희원', school: '서천초', role: '회원' },
  { name: '전보경', school: '신연초', role: '회원' },
  { name: '김미정', school: '백양초', role: '회원' }
];

const DRIVE_URL = "https://drive.google.com/drive/folders/1brw2rjM3Le451HcMzD0K33bF1hqsvdaJ?usp=sharing";

const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [memberSubs, setMemberSubs] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newLog, setNewLog] = useState({ date: '', title: '', content: '' });

  useEffect(() => {
    const login = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth failed:", err);
      }
    };
    login();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const logsPath = collection(db, 'artifacts', appId, 'public', 'data', 'meetingLogs');
    const subsPath = collection(db, 'artifacts', appId, 'public', 'data', 'aiSubscriptions');

    const unsubLogs = onSnapshot(logsPath, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    });

    const unsubSubs = onSnapshot(subsPath, (snapshot) => {
      const data = {};
      snapshot.docs.forEach(doc => { data[doc.id] = doc.data().tool; });
      setMemberSubs(data);
    });

    return () => { unsubLogs(); unsubSubs(); };
  }, [user]);

  const handleSaveLog = async (e) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'meetingLogs'), {
        ...newLog, timestamp: Date.now(), createdBy: user.uid
      });
      setNewLog({ date: '', title: '', content: '' });
      setActiveTab('logs');
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleUpdateSub = async (memberName, tool) => {
    if (!user) return;
    try {
      const subDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'aiSubscriptions', memberName);
      await setDoc(subDocRef, { tool, updatedAt: Date.now() });
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50 font-black text-indigo-600 animate-pulse">
      M.S.G 연결 중...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900 overflow-x-hidden">
      {/* 사이드바 */}
      <nav className="w-full md:w-72 bg-indigo-900 text-white flex-shrink-0 flex flex-col shadow-2xl">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white p-2 rounded-xl shadow-lg transition-transform hover:scale-110"><Sparkles className="text-indigo-900" size={24} /></div>
            <h1 className="text-3xl font-black italic tracking-tighter leading-none">M.S.G</h1>
          </div>
          <p className="text-indigo-300 text-[10px] font-bold tracking-widest uppercase mt-1">2026 Social AI Platform</p>
        </div>

        <div className="flex-1 px-4 space-y-1">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20}/>} label="대시보드" />
          <NavItem active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<FileText size={20}/>} label="연구 활동 기록" />
          <NavItem active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<Zap size={20}/>} label="AI 구독 관리" />
        </div>

        <div className="p-6 mt-auto border-t border-indigo-800">
            <a href={DRIVE_URL} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all mb-4 group border border-white/5">
                <Database size={16} className="group-hover:rotate-12 transition-transform"/><span className="font-bold text-sm">공동 드라이브</span>
            </a>
            <p className="text-[10px] text-indigo-400 font-bold uppercase text-center tracking-widest opacity-50">Stable Build v2.1.0</p>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <header className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <h2 className="text-4xl font-black text-slate-800 tracking-tight capitalize">{activeTab.replace('-', ' ')}</h2>
            <p className="text-slate-500 font-semibold mt-1 italic">"수학으로 분석하고 사회를 혁신하며 AI로 동행하다"</p>
        </header>

        <div className="max-w-5xl mx-auto space-y-10">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 gap-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-3xl font-black mb-4 italic leading-tight">2026 AI-디지털 교사 연구회<br/>M.S.G 통합 아카이브</h3>
                    <p className="text-indigo-100 font-medium text-lg leading-relaxed">선생님들의 모든 연구 데이터는 Firebase 클라우드 시스템을 통해 실시간으로 안전하게 보관됩니다.</p>
                  </div>
                  <a href={DRIVE_URL} target="_blank" className="bg-white text-indigo-700 px-10 py-5 rounded-[2rem] font-black shadow-xl hover:scale-105 transition-all shrink-0 flex items-center gap-3 text-lg">자료실 입장 <ArrowRight size={24}/></a>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all hover:shadow-xl">
                  <h4 className="font-black text-xl mb-8 flex items-center gap-3 text-indigo-600"><Users size={24}/> 동아리 회원 명단</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {MEMBERS.map(m => (
                      <div key={m.name} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center font-black text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">{m.name[0]}</div>
                          <div><p className="font-black text-slate-800 text-sm">{m.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{m.school}</p></div>
                        </div>
                        <span className="text-[9px] font-black px-3 py-1 bg-white border rounded-full text-slate-500 uppercase shadow-sm">{m.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all hover:shadow-xl">
                  <h4 className="font-black text-xl mb-8 flex items-center gap-3 text-indigo-600"><Calendar size={24}/> 연구 마일스톤</h4>
                  <div className="space-y-6">
                     <TimelineItem month="5월" task="AI·디지털 기반 교육과정 재구성 연수" done />
                     <TimelineItem month="7월" task="L.E.N.S 융합 모델 현장 적용 및 실증" done />
                     <TimelineItem month="9월" task="데이터 시각화 프로젝트 수업 사례집 제작" />
                     <TimelineItem month="11월" task="최종 성과 보고 및 아카이빙 공유회" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="bg-white p-10 md:p-16 rounded-[3rem] shadow-sm border space-y-12 animate-in slide-in-from-bottom-8 duration-500">
               <div className="max-w-2xl">
                  <h3 className="text-3xl font-black flex items-center gap-4 mb-3 text-slate-800"><CreditCard size={32} className="text-indigo-600"/> AI 도구 구독 현황</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">연구회 예산을 활용하여 구독 중이거나 활용 예정인 AI 도구들을 기록하고 관리합니다.</p>
               </div>
               <div className="space-y-4">
                  {MEMBERS.map(m => (
                    <div key={m.name} className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border transition-all hover:bg-white hover:border-indigo-100 hover:shadow-lg">
                      <div className="flex items-center gap-4 w-40 shrink-0">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-indigo-700 shadow-sm">{m.name[0]}</div>
                          <span className="font-black text-slate-800 text-lg">{m.name}</span>
                      </div>
                      <input className="flex-1 bg-white p-5 rounded-2xl outline-none text-sm font-bold border-2 border-transparent focus:border-indigo-200 shadow-sm transition-all placeholder:text-slate-300" placeholder="구독 도구(예: Claude 3.5, GPT-4o)를 입력하세요..." value={memberSubs[m.name] || ''} onChange={(e) => handleUpdateSub(m.name, e.target.value)} />
                      <div className="w-24 text-right shrink-0">{memberSubs[m.name] ? <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 flex items-center gap-1 justify-center"><UserCheck size={12}/> 등록완료</span> : <span className="text-[10px] font-black text-slate-300">미등록</span>}</div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-500">
              <form onSubmit={handleSaveLog} className="bg-white p-10 md:p-12 rounded-[3rem] border shadow-sm space-y-8 transition-all hover:shadow-md">
                <div className="flex items-center gap-4 text-indigo-600 border-b border-slate-50 pb-6"><PlusCircle size={32}/><h3 className="text-2xl font-black tracking-tight uppercase">New Research Log</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 px-1 uppercase tracking-widest">Date</label><input type="date" required className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold shadow-inner transition-all" value={newLog.date} onChange={e => setNewLog({...newLog, date: e.target.value})} /></div>
                  <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 px-1 uppercase tracking-widest">Subject</label><input type="text" required placeholder="회의 또는 연수의 핵심 주제" className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold shadow-inner transition-all placeholder:text-slate-300" value={newLog.title} onChange={e => setNewLog({...newLog, title: e.target.value})} /></div>
                </div>
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 px-1 uppercase tracking-widest">Activity Detail</label><textarea required rows="8" placeholder="오늘의 협의 내용과 연구 진행 상황을 상세히 기록하세요." className="w-full p-8 bg-slate-50 rounded-[2.5rem] border-2 border-transparent focus:border-indigo-500 outline-none text-[15px] font-medium leading-relaxed shadow-inner transition-all" value={newLog.content} onChange={e => setNewLog({...newLog, content: e.target.value})}></textarea></div>
                <button disabled={isSubmitting} className="w-full bg-indigo-600 text-white p-7 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-[0.98] disabled:bg-slate-300 group flex items-center justify-center gap-3">연구 아카이브에 기록하기 <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/></button>
              </form>

              <div className="space-y-8 pb-20">
                {logs.map(log => (
                  <div key={log.id} className="bg-white p-12 rounded-[3rem] border shadow-md relative overflow-hidden group hover:border-indigo-200 transition-all duration-500">
                    <div className="absolute left-0 top-0 w-2 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-start mb-8">
                      <div>
                          <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full uppercase tracking-tighter shadow-sm">{log.date}</span>
                          <h4 className="text-3xl font-black text-slate-900 mt-5 tracking-tight group-hover:text-indigo-600 transition-colors leading-snug">{log.title}</h4>
                      </div>
                      <FileText className="text-slate-100 group-hover:text-indigo-100 transition-colors shrink-0" size={56} />
                    </div>
                    <div className="p-10 bg-slate-50 rounded-[2.5rem] text-slate-700 whitespace-pre-wrap text-[16px] leading-relaxed font-medium italic border border-slate-100 shadow-inner group-hover:bg-white transition-colors">"{log.content}"</div>
                  </div>
                ))}
                {logs.length === 0 && (
                   <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                     <MessageSquare className="mx-auto text-slate-200 mb-4" size={64}/>
                     <p className="text-slate-400 font-bold text-xl">등록된 연구 기록이 아직 없습니다.</p>
                   </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 동기화 오버레이 */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in">
          <div className="bg-white p-16 rounded-[3rem] shadow-2xl flex flex-col items-center">
            <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-indigo-600 mb-8"></div>
            <p className="font-black text-slate-800 text-2xl tracking-tight text-center leading-relaxed">연구 데이터를<br/>클라우드에 안전하게 보관 중...</p>
          </div>
        </div>
      )}
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl transition-all duration-300 ${active ? 'bg-white text-indigo-900 font-black shadow-xl scale-105' : 'text-indigo-200 hover:text-white hover:bg-white/5 font-bold hover:translate-x-1'}`}><div className={`p-2 rounded-xl transition-colors ${active ? 'bg-indigo-50' : ''}`}>{icon}</div><span className="text-sm tracking-tight">{label}</span></button>
);

const TimelineItem = ({ month, task, done }) => (
  <div className="flex gap-6 items-start group">
    <div className="flex flex-col items-center shrink-0">
      <div className={`w-4 h-4 rounded-full mt-1.5 transition-all duration-500 ${done ? 'bg-indigo-600 ring-4 ring-indigo-50 scale-110 shadow-lg' : 'bg-slate-200 shadow-inner'}`}></div>
      <div className={`w-px h-12 my-1 group-last:hidden transition-colors ${done ? 'bg-indigo-200' : 'bg-slate-100'}`}></div>
    </div>
    <div className="pb-6">
      <span className={`text-[10px] font-black px-2 py-1 rounded-md transition-all uppercase ${done ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'bg-slate-100 text-slate-400'}`}>{month}</span>
      <p className={`text-sm mt-2 transition-all ${done ? 'text-slate-800 font-extrabold' : 'text-slate-400 font-medium'}`}>{task}</p>
    </div>
  </div>
);

export default App;
