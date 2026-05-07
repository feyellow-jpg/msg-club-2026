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
  getDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Users, 
  FileText, 
  Image as ImageIcon, 
  PlusCircle, 
  Save, 
  LayoutDashboard, 
  MessageSquare,
  Calendar,
  CheckCircle2,
  FolderOpen,
  ExternalLink,
  BookOpen,
  Database,
  ArrowRight,
  Sparkles,
  Zap,
  BarChart3,
  Search,
  PenTool,
  CreditCard,
  UserCheck
} from 'lucide-react';

/**
 * [환경 설정]
 * Canvas 미리보기 환경(ES2015)과 Vercel 배포 환경(Vite)을 모두 지원합니다.
 */
const getFirebaseConfig = () => {
  // 1. Canvas 시스템이 제공하는 전역 변수 우선 확인
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    try {
      return JSON.parse(__firebase_config);
    } catch (e) {
      console.error("Firebase config parse error:", e);
    }
  }

  // 2. 외부 배포(Vercel/Vite) 환경 변수 확인
  // Canvas 컴파일러 에러를 방지하기 위해 런타임 체크 구조를 사용합니다.
  const getEnv = (key) => {
    try {
      // Vite는 빌드 시 import.meta.env.KEY를 실제 값으로 치환합니다.
      // 이 구문이 ES2015 환경에서 경고를 발생시킬 수 있으나 실 배포 시에는 정상 작동합니다.
      const env = import.meta.env;
      return env[key] || "";
    } catch (e) {
      return "";
    }
  };

  return {
    apiKey: getEnv('VITE_FIREBASE_API_KEY'),
    authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnv('VITE_FIREBASE_APP_ID')
  };
};

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 동아리 고유 식별값 (Canvas 제공 변수 또는 기본값)
const appId = typeof __app_id !== 'undefined' ? __app_id : "msg-club-platform-2026";

// --- 상수 데이터 ---
const MEMBERS = [
  { name: '정원화', school: '서천초', role: '회장' },
  { name: '김주민', school: '옥천초', role: '총무' },
  { name: '김희원', school: '서천초', role: '회원' },
  { name: '전보경', school: '신연초', role: '회원' },
  { name: '김미정', school: '백양초', role: '회원' }
];

const AI_RECOMMENDATIONS = [
  { name: "Claude 3.5", category: "연구/시각화", desc: "Artifacts 기반 데이터 시각화 최적", icon: <Sparkles size={16} className="text-orange-500" />, color: "bg-orange-50" },
  { name: "ChatGPT Plus", category: "데이터 분석", desc: "ADA를 통한 정교한 통계 분석 가능", icon: <BarChart3 size={16} className="text-emerald-500" />, color: "bg-emerald-50" },
  { name: "Perplexity", category: "자료 조사", desc: "최신 사회 통계 실시간 검색 및 출처 제공", icon: <Search size={16} className="text-blue-500" />, color: "bg-blue-50" },
  { name: "Gamma", category: "성과 공유", desc: "AI 기반 발표 자료 및 보고서 레이아웃", icon: <PenTool size={16} className="text-purple-500" />, color: "bg-purple-50" }
];

const DRIVE_URL = "https://drive.google.com/drive/folders/1brw2rjM3Le451HcMzD0K33bF1hqsvdaJ?usp=sharing";

const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [memberSubs, setMemberSubs] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newLog, setNewLog] = useState({ date: '', title: '', members: [], content: '' });

  // 1. 인증 초기화
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
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

  // 2. 실시간 데이터 동기화
  useEffect(() => {
    if (!user) return;

    // 경로 규칙 준수: /artifacts/{appId}/public/data/{collectionName}
    const logsPath = collection(db, 'artifacts', appId, 'public', 'data', 'meetingLogs');
    const subsPath = collection(db, 'artifacts', appId, 'public', 'data', 'aiSubscriptions');

    const unsubLogs = onSnapshot(logsPath, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }, (error) => {
      console.error("로그 수신 에러:", error);
    });

    const unsubSubs = onSnapshot(subsPath, (snapshot) => {
      const data = {};
      snapshot.docs.forEach(doc => { data[doc.id] = doc.data().tool; });
      setMemberSubs(data);
    }, (error) => {
      console.error("구독 수신 에러:", error);
    });

    return () => { unsubLogs(); unsubSubs(); };
  }, [user, appId]);

  const handleSaveLog = async (e) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'meetingLogs'), {
        ...newLog, timestamp: Date.now(), createdBy: user.uid
      });
      setNewLog({ date: '', title: '', members: [], content: '' });
      setActiveTab('logs');
    } catch (err) { 
      console.error("저장 실패:", err); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleUpdateSub = async (memberName, tool) => {
    if (!user) return;
    try {
      const subDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'aiSubscriptions', memberName);
      await setDoc(subDocRef, { tool, updatedAt: Date.now() });
    } catch (err) { 
      console.error("업데이트 실패:", err); 
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600"></div>
        <p className="text-slate-500 font-bold tracking-tight">MSG 플랫폼 로딩 중...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* 사이드바 */}
      <nav className="w-full md:w-72 bg-indigo-900 text-white flex-shrink-0 flex flex-col shadow-2xl">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white p-2 rounded-xl shadow-lg"><Sparkles className="text-indigo-900" size={24} /></div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter italic leading-none">M.S.G</h1>
              <p className="text-indigo-300 text-[10px] font-bold tracking-[0.2em] uppercase mt-1">Social AI Platform</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 space-y-1">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20}/>} label="대시보드" />
          <NavItem active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<FileText size={20}/>} label="회의 및 연수 기록" />
          <NavItem active={activeTab === 'ai-recomm'} onClick={() => setActiveTab('ai-recomm')} icon={<Zap size={20}/>} label="AI 구독 관리" />
        </div>

        <div className="p-6 mt-auto border-t border-indigo-800">
            <a href={DRIVE_URL} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 p-4 rounded-2xl border border-white/10 transition-all text-indigo-100 mb-4 group">
                <Database size={18} className="group-hover:rotate-12 transition-transform"/><span className="font-bold text-sm">공동 드라이브</span><ExternalLink size={14} className="ml-auto opacity-50" />
            </a>
            <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter">Production Build v1.1.1</div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <header className="mb-10 animate-in fade-in slide-in-from-top-2">
            <h2 className="text-4xl font-black text-slate-800 tracking-tight capitalize">{activeTab.replace('-', ' ')}</h2>
            <p className="text-slate-500 font-semibold mt-1">2026 AI-디지털 교사 연구회 M.S.G</p>
        </header>

        <div className="max-w-5xl mx-auto space-y-10">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-500">
              <div className="bg-indigo-600 rounded-[2.5rem] p-12 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50 transition-all group-hover:scale-125"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black mb-4 italic">"수학으로 분석하고 사회를 혁신하며 AI로 동행하다"</h3>
                    <p className="text-indigo-100 font-medium leading-relaxed">선생님들의 모든 협의 기록과 연수 자료는 Firebase를 통해 실시간으로 보관되며 동아리 아카이브로 남습니다.</p>
                  </div>
                  <a href={DRIVE_URL} target="_blank" className="bg-white text-indigo-700 px-10 py-5 rounded-3xl font-black flex items-center gap-3 hover:scale-105 transition-all shadow-xl shrink-0">자료실 열기 <ExternalLink size={24} /></a>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                   <h4 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Users size={20} className="text-indigo-600" /> 동아리 멤버</h4>
                   <div className="space-y-3">{MEMBERS.map(m => (
                    <div key={m.name} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-indigo-50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center font-black text-indigo-600 group-hover:bg-white">{m.name[0]}</div>
                        <div><p className="font-black text-slate-800 text-sm">{m.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{m.school}</p></div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${m.role === '회장' ? 'bg-amber-100 text-amber-700' : 'bg-white shadow-sm text-slate-500'}`}>{m.role}</span>
                    </div>
                  ))}</div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                   <h4 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Calendar size={20} className="text-indigo-600" /> 연구 로드맵</h4>
                   <div className="space-y-4">
                      <TimelineItem month="5월" task="AI·디지털 기반 교육과정 재구성 연수" done />
                      <TimelineItem month="7월" task="L.E.N.S 융합 모델 현장 적용" done />
                      <TimelineItem month="9월" task="데이터 시각화 프로젝트 비법서 제작" />
                      <TimelineItem month="11월" task="최종 성과 공유 및 수업 영상 아카이브" />
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai-recomm' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {AI_RECOMMENDATIONS.map((ai, idx) => (
                   <div key={idx} className={`p-6 rounded-[2rem] border border-slate-100 shadow-sm ${ai.color}`}>
                     <div className="flex items-center gap-2 mb-3">{ai.icon}<h4 className="font-black text-slate-800 text-sm">{ai.name}</h4></div>
                     <p className="text-[11px] text-slate-600 leading-tight italic font-medium">"{ai.desc}"</p>
                   </div>
                 ))}
               </div>
               <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200">
                  <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3"><CreditCard size={24} className="text-indigo-600"/> 멤버별 AI 구독 계획</h3>
                  <div className="space-y-4">
                     {MEMBERS.map(m => (
                        <div key={m.name} className="flex flex-col md:flex-row md:items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 transition-all hover:bg-white hover:border-indigo-100">
                           <div className="flex items-center gap-3 w-32 shrink-0">
                              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-indigo-700 shadow-sm border border-slate-50">{m.name[0]}</div>
                              <span className="font-black text-slate-700">{m.name}</span>
                           </div>
                           <input className="flex-1 bg-white p-4 rounded-2xl outline-none text-sm font-semibold border-2 border-transparent focus:border-indigo-200 shadow-sm transition-all" placeholder="구독 예정 도구를 입력하세요..." value={memberSubs[m.name] || ''} onChange={(e) => handleUpdateSub(m.name, e.target.value)} />
                           <div className="w-24 text-right">{memberSubs[m.name] ? <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 inline-flex items-center gap-1"><UserCheck size={10}/> 완료</span> : <span className="text-[10px] font-black text-slate-400">미입력</span>}</div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
              <form onSubmit={handleSaveLog} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-4 text-indigo-700"><PlusCircle size={28}/><h3 className="text-2xl font-black tracking-tight">새 연구 기록 작성</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 px-1 uppercase tracking-widest">일시</label><input type="date" required className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold" value={newLog.date} onChange={e => setNewLog({...newLog, date: e.target.value})} /></div>
                  <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 px-1 uppercase tracking-widest">주제</label><input type="text" required placeholder="주제를 입력하세요" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold" value={newLog.title} onChange={e => setNewLog({...newLog, title: e.target.value})} /></div>
                </div>
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 px-1 uppercase tracking-widest">참석 멤버</label><div className="flex flex-wrap gap-2">{MEMBERS.map(m => (<button key={m.name} type="button" onClick={() => {const current = newLog.members.includes(m.name) ? newLog.members.filter(v => v !== m.name) : [...newLog.members, m.name]; setNewLog({...newLog, members: current});}} className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${newLog.members.includes(m.name) ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{m.name}</button>))}</div></div>
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 px-1 uppercase tracking-widest">상세 내용</label><textarea required rows="6" placeholder="기록할 내용을 상세히 입력하세요." className="w-full p-6 bg-slate-50 rounded-[2rem] border-2 border-transparent focus:border-indigo-500 outline-none text-sm font-medium leading-relaxed" value={newLog.content} onChange={e => setNewLog({...newLog, content: e.target.value})}></textarea></div>
                <button disabled={isSubmitting} className="w-full bg-indigo-600 text-white p-6 rounded-3xl font-black text-xl shadow-xl hover:bg-indigo-700 hover:shadow-indigo-200 transition-all active:scale-[0.98] disabled:bg-slate-300">저장하기</button>
              </form>
              <div className="space-y-6">
                {logs.map(log => (
                  <div key={log.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-100 transition-all">
                     <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <div className="flex justify-between items-start mb-6">
                        <div><span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">{log.date}</span><h4 className="text-2xl font-black text-slate-900 mt-3 tracking-tight">{log.title}</h4></div>
                        <div className="flex flex-wrap justify-end gap-1.5 max-w-[240px]">{log.members.map(m => (<span key={m} className="bg-slate-100 text-slate-600 text-[10px] font-black px-3 py-1 rounded-lg border border-slate-200">@{m}</span>))}</div>
                     </div>
                     <div className="p-8 bg-slate-50 rounded-[2rem] text-slate-700 whitespace-pre-wrap text-[15px] leading-relaxed font-medium italic border border-slate-100">"{log.content}"</div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold">등록된 연구 기록이 없습니다.</p>
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
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 mb-6"></div>
            <p className="font-black text-slate-800 text-xl tracking-tight">클라우드에 동기화 중...</p>
          </div>
        </div>
      )}
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl transition-all duration-300 ${active ? 'bg-white text-indigo-900 font-black shadow-xl scale-105' : 'text-indigo-200 hover:text-white hover:bg-white/5 font-bold hover:translate-x-1'}`}><div className={`p-2 rounded-xl ${active ? 'bg-indigo-50' : ''}`}>{icon}</div><span className="text-sm tracking-tight">{label}</span></button>
);

const TimelineItem = ({ month, task, done }) => (
  <div className="flex gap-4 items-start group">
    <div className="flex flex-col items-center shrink-0">
      <div className={`w-3.5 h-3.5 rounded-full mt-1.5 ${done ? 'bg-indigo-600 ring-4 ring-indigo-50' : 'bg-slate-200 shadow-inner'}`}></div>
      <div className="w-px h-10 bg-slate-100 my-1 group-last:hidden"></div>
    </div>
    <div className="pb-4">
      <span className={`text-[10px] font-black px-2 py-1 rounded-md ${done ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>{month}</span>
      <p className={`text-xs mt-1.5 ${done ? 'text-slate-800 font-bold' : 'text-slate-400 font-medium'}`}>{task}</p>
    </div>
  </div>
);

export default App;
