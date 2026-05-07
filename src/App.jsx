import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  setDoc 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
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
 * Canvas 환경과 Vercel 배포 환경을 모두 지원하도록 수정되었습니다.
 */
const getFirebaseConfig = () => {
  // 1. Canvas 환경 변수 체크 (우선순위)
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    try {
      return JSON.parse(__firebase_config);
    } catch (e) {
      console.error("Firebase 설정 파싱 오류:", e);
    }
  }
  
  // 2. 외부 배포 환경 (Vite/Vercel)
  // Canvas 프리뷰어의 ES2015 타겟 오류를 방지하기 위해 런타임 체크를 적용합니다.
  const isVite = typeof process === 'undefined' && typeof window !== 'undefined';
  
  // 독립 배포 시에는 Vercel의 Environment Variables에 설정한 값들이 주입됩니다.
  // 에러를 방지하기 위해 기본 빈 객체를 반환하는 구조를 가집니다.
  try {
    const env = (import.meta && import.meta.env) ? import.meta.env : {};
    return {
      apiKey: env.VITE_FIREBASE_API_KEY || "",
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "",
      projectId: env.VITE_FIREBASE_PROJECT_ID || "",
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: env.VITE_FIREBASE_APP_ID || ""
    };
  } catch (e) {
    return { apiKey: "", authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "" };
  }
};

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 동아리 고유 ID (Canvas 환경 변수 또는 기본값 사용)
const appId = typeof __app_id !== 'undefined' ? __app_id : "msg-club-2026-production";

const MEMBERS = [
  { name: '정원화', school: '서천초', role: '회장' },
  { name: '김주민', school: '옥천초', role: '총무' },
  { name: '김희원', school: '서천초', role: '회원' },
  { name: '전보경', school: '신연초', role: '회원' },
  { name: '김미정', school: '백양초', role: '회원' }
];

const AI_RECOMMENDATIONS = [
  { name: "Claude 3.5", category: "연구/시각화", desc: "Artifacts 기반 데이터 시각화 최적", iconName: "Sparkles", color: "bg-orange-50" },
  { name: "ChatGPT Plus", category: "데이터 분석", desc: "ADA를 통한 정교한 통계 분석 가능", iconName: "BarChart3", color: "bg-emerald-50" },
  { name: "Perplexity", category: "자료 조사", desc: "최신 사회 통계 실시간 검색 및 출처 제공", iconName: "Search", color: "bg-blue-50" },
  { name: "Gamma", category: "성과 공유", desc: "AI 기반 발표 자료 및 보고서 레이아웃", iconName: "PenTool", color: "bg-purple-50" }
];

const DRIVE_URL = "https://drive.google.com/drive/folders/1brw2rjM3Le451HcMzD0K33bF1hqsvdaJ?usp=sharing";

const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [reflections, setReflections] = useState([]);
  const [memberSubs, setMemberSubs] = useState({});
  const [loading, setLoading] = useState(true);

  const [newLog, setNewLog] = useState({ date: '', title: '', members: [], content: '' });
  const [newReflection, setNewReflection] = useState({ author: '', content: '', mood: '😊' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const renderAIIcon = (iconName) => {
    switch(iconName) {
      case "Sparkles": return <Sparkles size={16} className="text-orange-500" />;
      case "BarChart3": return <BarChart3 size={16} className="text-emerald-500" />;
      case "Search": return <Search size={16} className="text-blue-500" />;
      case "PenTool": return <PenTool size={16} className="text-purple-500" />;
      default: return <Zap size={16} />;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 익명 로그인을 먼저 수행하여 데이터 접근 권한을 획득합니다.
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Firebase 인증 실패:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Firestore 실시간 데이터 리스너 설정 (경로 규칙 준수)
    const logsPath = collection(db, 'artifacts', appId, 'public', 'data', 'meetingLogs');
    const reflectionsPath = collection(db, 'artifacts', appId, 'public', 'data', 'reflections');
    const subsPath = collection(db, 'artifacts', appId, 'public', 'data', 'aiSubscriptions');

    const unsubLogs = onSnapshot(logsPath, (s) => {
      setLogs(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.date) - new Date(a.date)));
    }, (err) => console.error("회의록 로드 실패:", err));

    const unsubReflections = onSnapshot(reflectionsPath, (s) => {
      setReflections(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp - a.timestamp));
    }, (err) => console.error("소감 로드 실패:", err));

    const unsubSubs = onSnapshot(subsPath, (s) => {
      const data = {};
      s.docs.forEach(d => data[d.id] = d.data().tool);
      setMemberSubs(data);
    }, (err) => console.error("구독 정보 로드 실패:", err));

    return () => { unsubLogs(); unsubReflections(); unsubSubs(); };
  }, [user, appId]);

  const handleSaveLog = async (e) => {
    e.preventDefault();
    if (isSubmitting || !user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'meetingLogs'), { 
        ...newLog, timestamp: Date.now(), createdBy: user.uid 
      });
      setNewLog({ date: '', title: '', members: [], content: '' });
      setActiveTab('logs');
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleSaveReflection = async (e) => {
    e.preventDefault();
    if (isSubmitting || !user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'reflections'), { 
        ...newReflection, timestamp: Date.now(), userId: user.uid 
      });
      setNewReflection({ author: '', content: '', mood: '😊' });
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
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-slate-500 font-bold">M.S.G 플랫폼 로딩 중...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* 사이드바 */}
      <nav className="w-full md:w-72 bg-indigo-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-white p-1 rounded-lg"><Sparkles className="text-indigo-900" size={24} /></div>
            <h1 className="text-3xl font-black tracking-tight italic">M.S.G</h1>
          </div>
          <p className="text-indigo-300 text-[10px] font-bold tracking-[0.2em]">MATH SOCIAL GEN-AI</p>
        </div>

        <div className="flex-1 px-4 space-y-1">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20}/>} label="대시보드" />
          <NavItem active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<FileText size={20}/>} label="회의록 & 연수" />
          <NavItem active={activeTab === 'reflections'} onClick={() => setActiveTab('reflections')} icon={<MessageSquare size={20}/>} label="연구 소감록" />
          <NavItem active={activeTab === 'outputs'} onClick={() => setActiveTab('outputs')} icon={<FolderOpen size={20}/>} label="연구 산출물" />
          <NavItem active={activeTab === 'ai-recomm'} onClick={() => setActiveTab('ai-recomm')} icon={<Zap size={20}/>} label="AI 구독 관리" />
        </div>

        <div className="p-6 mt-auto border-t border-indigo-800">
          <a href={DRIVE_URL} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 p-4 rounded-2xl border border-white/10 transition-all text-indigo-100 mb-4">
            <Database size={18} /><span className="font-bold text-sm">공동 드라이브</span><ExternalLink size={14} className="ml-auto" />
          </a>
          <div className="text-[10px] text-indigo-400 font-medium">Production v1.0.1</div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto p-4 md:p-12">
        <header className="mb-10">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight capitalize">{activeTab.replace('-', ' ')}</h2>
          <p className="text-slate-500 font-medium mt-1">2026 AI-디지털 교사 동아리 (M.S.G)</p>
        </header>

        <div className="max-w-5xl mx-auto space-y-10">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-500">
              <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black mb-3">공동 연구 아카이브</h3>
                    <p className="text-indigo-100 font-medium leading-relaxed">모든 기록은 Firebase를 통해 실시간으로 저장되며 동아리원 전체와 공유됩니다.</p>
                  </div>
                  <a href={DRIVE_URL} target="_blank" className="bg-white text-indigo-700 px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:scale-105 transition-all shadow-xl">드라이브 열기 <ExternalLink size={20} /></a>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                  <h4 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Calendar size={20} className="text-indigo-500" /> 연간 로드맵</h4>
                  <div className="space-y-2">
                    <TimelineItem month="5월" desc="AI·디지털 기반 교육혁신 필수 연수" done />
                    <TimelineItem month="7월" desc="L.E.N.S 모델 정립 및 교육과정 분석" done />
                    <TimelineItem month="9월" desc="융합 수업 비법서 초안 제작" />
                    <TimelineItem month="10월" desc="수업 적용 및 영상 기록" />
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                  <h4 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Users size={20} className="text-indigo-500" /> 동아리 회원</h4>
                  <div className="space-y-4">{MEMBERS.map(m => (
                    <div key={m.name} className="flex justify-between items-center p-4 bg-slate-50 hover:bg-indigo-50 rounded-2xl transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center font-black text-indigo-600 group-hover:bg-white transition-all">{m.name[0]}</div>
                        <div><p className="font-black text-slate-800 text-sm">{m.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{m.school}</p></div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${m.role === '회장' ? 'bg-amber-100 text-amber-700' : 'bg-white shadow-sm text-slate-500'}`}>{m.role}</span>
                    </div>
                  ))}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai-recomm' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {AI_RECOMMENDATIONS.map((ai, idx) => (
                   <div key={idx} className={`p-5 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md ${ai.color}`}>
                     <div className="flex items-center gap-2 mb-2">{renderAIIcon(ai.iconName)}<h4 className="font-black text-slate-800 text-xs">{ai.name}</h4></div>
                     <p className="text-[9px] text-slate-500 font-bold mb-1">{ai.category}</p>
                     <p className="text-[10px] text-slate-600 leading-tight italic">"{ai.desc}"</p>
                   </div>
                 ))}
               </div>

               <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-8">
                     <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><CreditCard size={24} /></div>
                     <div><h3 className="text-xl font-black text-slate-800">멤버별 AI 구독 계획</h3><p className="text-sm text-slate-500 font-medium">연구비를 활용하여 각자 구독할 도구를 결정해 주세요.</p></div>
                  </div>
                  <div className="overflow-hidden border border-slate-100 rounded-3xl">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                           <tr><th className="p-4 text-xs font-black text-slate-600 uppercase">선생님</th><th className="p-4 text-xs font-black text-slate-600 uppercase">구독 예정 AI 도구</th><th className="p-4 text-xs font-black text-slate-600 text-right uppercase">상태</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {MEMBERS.map(m => (
                              <tr key={m.name} className="hover:bg-slate-50 transition-colors">
                                 <td className="p-4"><div className="flex items-center gap-3"><div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-700">{m.name[0]}</div><span className="font-bold text-slate-700 text-sm">{m.name}</span></div></td>
                                 <td className="p-4"><input type="text" placeholder="입력하세요..." value={memberSubs[m.name] || ''} onChange={(e) => handleUpdateSub(m.name, e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none p-1 font-medium text-slate-600 text-sm" /></td>
                                 <td className="p-4 text-right">{memberSubs[m.name] ? <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><UserCheck size={8} /> 확정</span> : <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-full">미정</span>}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-indigo-700"><PlusCircle size={24} /> 새 회의록 작성</h3>
                <form onSubmit={handleSaveLog} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2"><label className="text-xs font-black text-slate-500 uppercase px-1">날짜</label><input type="date" required value={newLog.date} onChange={e => setNewLog({...newLog, date: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none" /></div>
                  <div className="space-y-2"><label className="text-xs font-black text-slate-500 uppercase px-1">회의 제목</label><input type="text" required value={newLog.title} onChange={e => setNewLog({...newLog, title: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="제목을 입력하세요" /></div>
                  <div className="md:col-span-2 space-y-2"><label className="text-xs font-black text-slate-500 uppercase px-1">참석 멤버</label><div className="flex flex-wrap gap-2">{MEMBERS.map(m => (<button key={m.name} type="button" onClick={() => {const newMems = newLog.members.includes(m.name) ? newLog.members.filter(nm => nm !== m.name) : [...newLog.members, m.name]; setNewLog({...newLog, members: newMems});}} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${newLog.members.includes(m.name) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>{m.name}</button>))}</div></div>
                  <div className="md:col-span-2 space-y-2"><label className="text-xs font-black text-slate-500 uppercase px-1">회의 내용</label><textarea rows="5" required value={newLog.content} onChange={e => setNewLog({...newLog, content: e.target.value})} className="w-full p-5 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none text-sm" placeholder="내용을 기록하세요."></textarea></div>
                  <button disabled={isSubmitting} className="md:col-span-2 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 shadow-xl transition-all">회의록 저장하기</button>
                </form>
              </div>
              <div className="space-y-6">
                {logs.map(log => (
                  <div key={log.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-start mb-4">
                      <div><span className="text-indigo-600 font-black text-[10px] mb-1 block">{log.date}</span><h4 className="text-xl font-black text-slate-800">{log.title}</h4></div>
                      <div className="flex flex-wrap justify-end gap-1 max-w-[200px]">{log.members.map(m => (<span key={m} className="bg-indigo-50 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-indigo-100">@{m}</span>))}</div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl text-slate-700 whitespace-pre-wrap text-sm border border-slate-100 italic">"{log.content}"</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reflections' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200">
                <h3 className="text-2xl font-black mb-8 text-indigo-700">오늘의 소감 한마디</h3>
                <form onSubmit={handleSaveReflection} className="space-y-6">
                   <div className="flex flex-col md:flex-row gap-6">
                    <select className="flex-1 p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 outline-none font-black text-slate-700" value={newReflection.author} onChange={e => setNewReflection({...newReflection, author: e.target.value})} required><option value="">작성자 선택</option>{MEMBERS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}</select>
                    <select className="w-full md:w-48 p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 outline-none font-black" value={newReflection.mood} onChange={e => setNewReflection({...newReflection, mood: e.target.value})}><option value="😊">😊 즐거움</option><option value="💡">💡 아이디어</option><option value="🔥">🔥 열정</option><option value="🚀">🚀 도약</option></select>
                   </div>
                   <textarea className="w-full p-6 border-2 border-slate-100 rounded-[2rem] outline-none min-h-[120px] font-medium" placeholder="활동 중 느낀 생각을 자유롭게 기록하세요." required value={newReflection.content} onChange={e => setNewReflection({...newReflection, content: e.target.value})}></textarea>
                   <button disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-black py-4 rounded-3xl hover:bg-indigo-700 shadow-xl transition-all">공유하기</button>
                </form>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reflections.map(ref => (
                  <div key={ref.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex gap-6 hover:scale-105 transition-all">
                    <div className="text-5xl flex-shrink-0 pt-2">{ref.mood}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2"><span className="font-black text-indigo-700 text-sm">{ref.author}</span><span className="text-[9px] text-slate-300 font-bold">{new Date(ref.timestamp).toLocaleDateString()}</span></div>
                      <p className="text-xs text-slate-600 font-semibold italic leading-relaxed">"{ref.content}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'outputs' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 w-40 h-40 bg-indigo-50 rounded-bl-full opacity-60"></div>
                <div className="flex items-center gap-4 mb-8 text-indigo-700 relative z-10"><div className="bg-indigo-600 p-3 rounded-2xl text-white"><BookOpen size={32} /></div><h3 className="text-3xl font-black tracking-tighter uppercase">L.E.N.S Project Kit</h3></div>
                <p className="text-slate-600 mb-10 leading-relaxed font-bold text-lg italic">"데이터로 분석하고 AI로 해결하는 미래형 융합 수업"</p>
                 <div className="space-y-5">
                   <OutputStep num="01" title="Link" desc="성취기준과 수학적 데이터의 연계" status="진행 중" />
                   <OutputStep num="02" title="Explore" desc="AI 시각화 도구 활용 실습" status="진행 중" />
                   <OutputStep num="03" title="Narrow" desc="객관적 데이터를 통한 문제 해결" status="준비 중" />
                   <OutputStep num="04" title="Share" desc="수업 사례 및 영상 아카이브" status="준비 중" />
                 </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 저장 로딩 오버레이 */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white p-10 rounded-[2rem] shadow-2xl flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-600 mb-4"></div>
            <p className="font-black text-slate-800">기록 저장 중...</p>
          </div>
        </div>
      )}
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${active ? 'bg-white text-indigo-900 font-black shadow-lg' : 'text-indigo-200 hover:text-white hover:bg-white/5 font-bold'}`}><div className={`p-1.5 rounded-lg ${active ? 'bg-indigo-50' : ''}`}>{icon}</div><span className="text-sm">{label}</span></button>
);

const TimelineItem = ({ month, desc, done }) => (
  <div className="flex gap-6 items-start group"><div className="flex flex-col items-center"><div className={`w-3.5 h-3.5 rounded-full mt-1.5 ${done ? 'bg-indigo-600 ring-4 ring-indigo-50' : 'bg-slate-200'}`}></div><div className="w-px h-12 bg-slate-100 my-1 group-last:hidden"></div></div><div className="flex-1 pb-4"><div className="flex items-center gap-3"><span className={`text-[10px] font-black px-3 py-1 rounded-full ${done ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>{month}</span></div><p className={`text-xs mt-1.5 ${done ? 'text-slate-800 font-bold' : 'text-slate-400 font-medium'}`}>{desc}</p></div></div>
);

const OutputStep = ({ num, title, desc, status }) => (
    <div className="group flex items-start gap-6 p-6 hover:bg-indigo-50 rounded-[2rem] transition-all border border-transparent hover:border-indigo-100 cursor-pointer"><div className="text-4xl font-black text-indigo-100 group-hover:text-indigo-200 transition-colors italic">{num}</div><div className="flex-1"><div className="flex items-center gap-3 mb-1"><h5 className="font-black text-slate-800 group-hover:text-indigo-700 transition-colors">{title}</h5><span className={`text-[8px] px-2 py-0.5 rounded-full font-black border ${status === '진행 중' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>{status}</span></div><p className="text-xs text-slate-500 font-bold leading-relaxed">{desc}</p></div><ArrowRight size={24} className="self-center text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" /></div>
);

export default App;
