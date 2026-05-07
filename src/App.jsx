import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  setDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Users, 
  FileText, 
  PlusCircle, 
  LayoutDashboard, 
  MessageSquare,
  Calendar,
  Database,
  ExternalLink,
  Sparkles,
  Zap,
  CreditCard,
  UserCheck,
  ArrowRight,
  Check
} from 'lucide-react';

/**
 * [환경 설정 로드]
 * Canvas 미리보기 환경의 ES2015 경고를 피하면서 
 * Vercel 배포 시 환경 변수를 정상적으로 읽어오도록 설계했습니다.
 */
const getFirebaseConfig = () => {
  // 1. Canvas 시스템 전역 설정 우선 확인
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    try {
      return JSON.parse(__firebase_config);
    } catch (e) { }
  }

  // 2. Vercel 배포 환경 변수 (Vite)
  // 컴파일러 경고를 방지하기 위해 런타임 체크 방식을 사용합니다.
  const env = {};
  try {
    // @ts-ignore
    const viteEnv = import.meta.env;
    if (viteEnv) Object.assign(env, viteEnv);
  } catch (e) { }
  
  const clean = (val) => (val && typeof val === 'string') ? val.trim() : "";

  return {
    apiKey: clean(env.VITE_FIREBASE_API_KEY),
    authDomain: clean(env.VITE_FIREBASE_AUTH_DOMAIN),
    projectId: clean(env.VITE_FIREBASE_PROJECT_ID),
    storageBucket: clean(env.VITE_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: clean(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    appId: clean(env.VITE_FIREBASE_APP_ID)
  };
};

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 연구 멤버 데이터
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

  const [newLog, setNewLog] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    title: '', 
    members: [], 
    content: '' 
  });

  // 1. Firebase 익명 로그인
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("인증 실패:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. 실시간 데이터 동기화 (가장 확실한 경로인 msg_logs 사용)
  useEffect(() => {
    if (!user) return;

    // 기록 및 구독 정보 경로 설정
    const logsPath = collection(db, "msg_logs");
    const subsPath = collection(db, "msg_subs");

    const unsubLogs = onSnapshot(logsPath, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // 날짜순 정렬
      setLogs(data.sort((a, b) => new Date(String(b.date || '')) - new Date(String(a.date || ''))));
    }, (err) => console.error("데이터 수신 에러:", err));

    const unsubSubs = onSnapshot(subsPath, (snapshot) => {
      const data = {};
      snapshot.docs.forEach(doc => { data[doc.id] = doc.data().tool; });
      setMemberSubs(data);
    });

    return () => { unsubLogs(); unsubSubs(); };
  }, [user]);

  // 기록 저장
  const handleSaveLog = async (e) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    if (newLog.members.length === 0) {
      alert("참석 회원을 최소 한 명 선택해 주세요.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "msg_logs"), {
        ...newLog,
        timestamp: Date.now(),
        createdBy: user.uid
      });
      setNewLog({ 
        date: new Date().toISOString().split('T')[0], 
        title: '', 
        members: [], 
        content: '' 
      });
      alert("연구 활동 기록이 저장되었습니다!");
      setActiveTab('logs');
    } catch (err) { 
      console.error("저장 실패:", err); 
      alert("저장에 실패했습니다. Firebase 규칙을 다시 확인해 주세요.");
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const toggleMember = (name) => {
    setNewLog(prev => ({
      ...prev,
      members: prev.members.includes(name) 
        ? prev.members.filter(m => m !== name)
        : [...prev.members, name]
    }));
  };

  const handleUpdateSub = async (memberName, tool) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "msg_subs", memberName), { tool, updatedAt: Date.now() });
    } catch (err) { console.error(err); }
  };

  const NavItem = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl transition-all duration-300 ${active ? 'bg-white text-indigo-900 font-black shadow-xl scale-105' : 'text-indigo-200 hover:text-white hover:bg-white/5 font-bold hover:translate-x-1'}`}><div className={`p-2 rounded-xl transition-colors ${active ? 'bg-indigo-50' : ''}`}>{icon}</div><span className="text-sm tracking-tight">{label}</span></button>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50 font-black text-indigo-600 animate-pulse">
      M.S.G 클라우드 연결 중...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900 overflow-x-hidden">
      {/* 사이드바 */}
      <nav className="w-full md:w-72 bg-indigo-900 text-white flex-shrink-0 flex flex-col shadow-2xl">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white p-2 rounded-xl shadow-lg"><Sparkles className="text-indigo-900" size={24} /></div>
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
            <p className="text-[10px] text-indigo-400 font-bold uppercase text-center tracking-widest opacity-50">Stable Build v3.5.1</p>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <header className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <h2 className="text-4xl font-black text-slate-800 tracking-tight capitalize">
              {activeTab === 'dashboard' ? '대시보드' : activeTab === 'logs' ? '연구 활동 기록' : 'AI 구독 관리'}
            </h2>
            <p className="text-slate-500 font-semibold mt-1 italic">"수학으로 분석하고 사회를 혁신하며 AI로 동행하다"</p>
        </header>

        <div className="max-w-5xl mx-auto space-y-10">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 gap-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-3xl font-black mb-4 italic leading-tight">동아리 데이터 아카이브</h3>
                    <p className="text-indigo-100 font-medium text-lg leading-relaxed">활동 내용을 기록하면 Firebase 클라우드에 실시간으로 저장되고 공유됩니다.</p>
                  </div>
                  <a href={DRIVE_URL} target="_blank" className="bg-white text-indigo-700 px-10 py-5 rounded-[2rem] font-black shadow-xl hover:scale-105 transition-all shrink-0 flex items-center gap-3 text-lg">자료실 열기 <ArrowRight size={24}/></a>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                 <h4 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Users size={20} className="text-indigo-600" /> 연구 멤버</h4>
                 <div className="divide-y divide-slate-100">{MEMBERS.map(m => (<div key={m.name} className="flex justify-between items-center py-4 px-2 hover:bg-slate-50 transition-colors rounded-xl"><p className="font-black text-slate-800 text-sm">{m.name}</p><span className="text-[9px] font-black px-3 py-1 bg-white border rounded-full text-slate-400 uppercase shadow-sm">{m.role}</span></div>))}</div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="bg-white p-10 md:p-16 rounded-[3rem] shadow-sm border space-y-12 animate-in slide-in-from-bottom-8 duration-500">
               <h3 className="text-3xl font-black text-slate-800 flex items-center gap-4"><CreditCard size={32} className="text-indigo-600"/> 멤버별 AI 구독 도구 관리</h3>
               <div className="space-y-4">
                  {MEMBERS.map(m => (
                     <div key={m.name} className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border transition-all hover:bg-white hover:border-indigo-100">
                        <span className="font-black text-slate-700 w-24 shrink-0 text-lg">{m.name}</span>
                        <input className="flex-1 bg-white p-5 rounded-2xl outline-none text-sm font-bold border-2 border-transparent focus:border-indigo-200 shadow-sm transition-all" placeholder="구독 중인 AI 도구를 입력하세요..." value={memberSubs[m.name] || ''} onChange={(e) => handleUpdateSub(m.name, e.target.value)} />
                        <div className="w-24 text-right">{memberSubs[m.name] ? <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1 border border-emerald-100"><UserCheck size={10}/> 등록완료</span> : <span className="text-[10px] font-black text-slate-300 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">미등록</span>}</div>
                     </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-500 pb-32">
              {/* 입력 폼 */}
              <form onSubmit={handleSaveLog} className="bg-white p-10 md:p-12 rounded-[3rem] border shadow-sm space-y-8 transition-all hover:shadow-md">
                <div className="flex items-center gap-4 text-indigo-600 border-b border-slate-50 pb-6"><PlusCircle size={32}/><h3 className="text-2xl font-black tracking-tight uppercase text-indigo-900">새 활동 기록 작성</h3></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 px-1 uppercase tracking-widest">연구 일시</label>
                    <input type="date" required className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold shadow-inner" value={newLog.date} onChange={e => setNewLog({...newLog, date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 px-1 uppercase tracking-widest">연구 주제</label>
                    <input type="text" required placeholder="회의 또는 연수의 주제" className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold shadow-inner" value={newLog.title} onChange={e => setNewLog({...newLog, title: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 px-1 uppercase tracking-widest">참석 회원 선택</label>
                  <div className="flex flex-wrap gap-3">
                    {MEMBERS.map(m => (
                      <button 
                        key={m.name} 
                        type="button" 
                        onClick={() => toggleMember(m.name)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all border-2 ${newLog.members.includes(m.name) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200'}`}
                      >
                        {newLog.members.includes(m.name) && <Check size={16}/>}
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 px-1 uppercase tracking-widest">상세 활동 내용</label>
                  <textarea required rows="6" placeholder="기록할 내용을 상세히 입력하세요." className="w-full p-8 bg-slate-50 rounded-[2.5rem] border-2 border-transparent focus:border-indigo-500 outline-none text-[15px] font-medium leading-relaxed shadow-inner" value={newLog.content} onChange={e => setNewLog({...newLog, content: e.target.value})}></textarea>
                </div>

                <button disabled={isSubmitting} className="w-full bg-indigo-600 text-white p-7 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-[0.98] disabled:bg-slate-300 flex items-center justify-center gap-3">
                  {isSubmitting ? '데이터 보관 중...' : '연구 아카이브에 기록하기'} <ArrowRight size={20}/>
                </button>
              </form>

              {/* 목록 표시 */}
              <div className="space-y-8">
                <h4 className="text-xl font-black text-slate-800 flex items-center gap-2 px-2"><FileText className="text-indigo-600"/> 저장된 활동 기록 ({logs.length})</h4>
                {logs.map(log => (
                  <div key={log.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-100 transition-all duration-500 animate-in fade-in">
                     <div className="absolute left-0 top-0 w-2 h-full bg-indigo-600"></div>
                     <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full uppercase tracking-tighter shadow-sm">{String(log.date || '')}</span>
                            <div className="flex gap-1 flex-wrap">
                              {log.members?.map(m => (<span key={m} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-50">@{String(m)}</span>))}
                            </div>
                          </div>
                          <h4 className="text-3xl font-black text-slate-900 mt-5 tracking-tight group-hover:text-indigo-600 transition-colors leading-snug">{String(log.title || '')}</h4>
                        </div>
                        <FileText className="text-slate-100 group-hover:text-indigo-50 transition-colors shrink-0 hidden md:block" size={48} />
                     </div>
                     <div className="p-10 bg-slate-50 rounded-[2.5rem] text-slate-700 whitespace-pre-wrap text-[16px] leading-relaxed font-medium italic border border-slate-100 shadow-inner group-hover:bg-white transition-colors">
                       "{String(log.content || '')}"
                     </div>
                  </div>
                ))}
                {logs.length === 0 && (
                   <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 animate-in fade-in">
                     <MessageSquare className="mx-auto text-slate-200 mb-4" size={64}/>
                     <p className="text-slate-400 font-bold text-xl">등록된 연구 기록이 아직 없습니다.</p>
                   </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 로딩 오버레이 */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in">
          <div className="bg-white p-16 rounded-[3rem] shadow-2xl flex flex-col items-center">
            <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-indigo-600 mb-8"></div>
            <p className="font-black text-slate-800 text-2xl tracking-tight text-center leading-relaxed text-indigo-900">연구 기록을<br/>안전하게 저장 중입니다...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
