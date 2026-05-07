/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  ExternalLink, 
  Calendar, 
  Clock, 
  FileText, 
  Menu, 
  X,
  ChevronRight,
  Info,
  Bell,
  Trash2,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Notice {
  id: string;
  title: string;
  date: string;
  important: boolean;
}

interface TrainingRecord {
  id: string;
  title: string;
  date: string;
  hours: number;
  content: string;
  memberName?: string;
  status: 'completed' | 'planned';
}

// --- Constants & Data ---
const CLUB_NAME = "M.S.G (Math-Social-GenAI)";
const SHARED_DRIVE_URL = "https://drive.google.com/drive/folders/1brw2rjM3Le451HcMzD0K33bF1hqsvdaJ";

const INITIAL_NOTICES: Notice[] = [
  { id: '1', title: '2026년 AI·디지털 교사 동아리 사전 설명회 안내', date: '2026-05-07', important: true },
  { id: '2', title: '5월 필수 연수(1차) 장소 및 준비물 안내', date: '2026-05-10', important: false },
  { id: '3', title: 'L.E.N.S 모델 기반 융합 수업 설계 프로젝트 시작', date: '2026-05-15', important: true },
];

const INITIAL_VISITING_TRAINING: TrainingRecord[] = [
  { id: 'v1', title: '필수 연수(1차): AI·디지털 기반 교육 혁신', date: '2026-05-20', hours: 3, content: '교수·학습 및 평가 설계 이해', status: 'planned' },
  { id: 'v2', title: '필수 연수(2차): 평가의 실행 및 환류', date: '2026-07-15', hours: 3, content: '과정 중심 평가 모델 설계', status: 'planned' },
];

const INITIAL_SELF_TRAINING: TrainingRecord[] = [
  { id: 's1', title: '자체 연수(1차): L.E.N.S 모델 내실화', date: '2026-07-05', hours: 2, content: '2022 개정 교육과정 분석', status: 'planned' },
  { id: 's2', title: '자체 연수(2차): 융합 수업 비법서 제작', date: '2026-09-10', hours: 2, content: '학년별 성치기준 매핑 및 AI 활용', status: 'planned' },
  { id: 's3', title: '자체 연수(3차): 수업 현장 적용 및 피드포워드', date: '2026-10-15', hours: 2, content: '영상 기록 공유플랫폼 탑재 및 비평', status: 'planned' },
  { id: 's4', title: '자체 연수(4차): 최종 편집 및 발간', date: '2026-11-20', hours: 3, content: '부산교수학습샘터 등 공유 플랫폼 탑재', status: 'planned' },
];

const MEMBERS = [
  { name: '정원화', school: '서천초', role: '회장', tasks: '자료 개발, 편집, 검토' },
  { name: '김희원', school: '서천초', role: '교사', tasks: '자료 개발, 편집, 검토' },
  { name: '김주민', school: '옥천초', role: '총무', tasks: '총무, 자료 개발, 편집, 검토' },
  { name: '전보경', school: '신연초', role: '교사', tasks: '공모계획서 작성, 자료 개발' },
  { name: '김미정', school: '백양초', role: '교사', tasks: '자료 개발, 협의회 진행' },
];

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-2 py-4 transition-all duration-200 border-b border-transparent ${
      active 
        ? 'text-[#1A1A1A] border-[#1A1A1A]' 
        : 'text-[#6B6862] hover:text-[#1A1A1A] hover:bg-[#F5F2ED]'
    }`}
  >
    <Icon size={24} strokeWidth={1.5} />
    <span className="font-sans text-lg font-black uppercase tracking-widest">{label}</span>
  </button>
);

const Card = ({ title, children, icon: Icon, className = "" }: { title: string, children: React.ReactNode, icon?: any, className?: string }) => (
  <div className={`bg-white rounded-none border border-[#D1CEC7] shadow-none overflow-hidden ${className}`}>
    <div className="px-6 py-3 border-b border-[#D1CEC7] flex items-center justify-between bg-[#FDFCFB]">
      <h3 className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A1A] flex items-center gap-2">
        {Icon && <Icon size={14} className="text-[#D14F33]" />}
        {title}
      </h3>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'visiting' | 'self' | 'resources' | 'members' | 'ai-subs'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- AI Subscriptions State ---
  const [aiSubs, setAiSubs] = useState<Record<string, string>>({
    '이OO': 'ChatGPT Plus (수업안 설계 및 분석)',
    '정OO': 'Claude Pro (데이터 정제 및 요약)',
    '김OO': 'Perplexity Pro (학술 정보 실시간 검색)',
    '박OO': 'ChatGPT Plus (프롬프트 엔지니어링)',
    '함OO': 'Claude Pro (코드 생성 및 검토)'
  });
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // --- States for Dynamic Data ---
  const [visitingRecords, setVisitingRecords] = useState<TrainingRecord[]>([]);
  const [selfRecords, setSelfRecords] = useState<TrainingRecord[]>([]);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, date: string, size: string}[]>([
    { name: '2026_MSG_연구회_운영계획서.pdf', date: '2026-05-01', size: '1.2MB' }
  ]);
  const [showVisitingForm, setShowVisitingForm] = useState(false);
  const [showSelfForm, setShowSelfForm] = useState(false);

  // --- Form States ---
  const [newRecord, setNewRecord] = useState({ title: '', date: '', hours: 2, content: '', memberName: '' });

  const totalVisitingHours = useMemo(() => visitingRecords.reduce((acc, curr) => acc + curr.hours, 0), [visitingRecords]);
  const totalSelfHours = useMemo(() => selfRecords.reduce((acc, curr) => acc + curr.hours, 0), [selfRecords]);

  const handleAddRecord = (type: 'visiting' | 'self') => {
    if (!newRecord.title || !newRecord.date || !newRecord.memberName) {
      alert('회원명, 주제, 날짜를 모두 입력해주세요.');
      return;
    }
    
    if (editingRecordId) {
      // 수정 모드
      const updateFn = (records: TrainingRecord[]) => 
        records.map(r => r.id === editingRecordId ? { ...r, ...newRecord } : r);
      
      if (type === 'visiting') setVisitingRecords(updateFn(visitingRecords));
      else setSelfRecords(updateFn(selfRecords));
      
      setEditingRecordId(null);
    } else {
      // 신규 등록 모드
      const record: TrainingRecord = {
        id: `${type}-${Date.now()}`,
        ...newRecord,
        status: 'completed'
      };

      if (type === 'visiting') setVisitingRecords([...visitingRecords, record]);
      else setSelfRecords([...selfRecords, record]);
    }

    if (type === 'visiting') setShowVisitingForm(false);
    else setShowSelfForm(false);
    
    setNewRecord({ title: '', date: '', hours: 2, content: '', memberName: '' });
  };

  const handleEditStart = (record: TrainingRecord, type: 'visiting' | 'self') => {
    setNewRecord({
      title: record.title,
      date: record.date,
      hours: record.hours,
      content: record.content,
      memberName: record.memberName || ''
    });
    setEditingRecordId(record.id);
    if (type === 'visiting') setShowVisitingForm(true);
    else setShowSelfForm(true);
  };

  const handleDeleteRecord = (id: string, type: 'visiting' | 'self') => {
    if (window.confirm('기록을 삭제하시겠습니까?')) {
      if (type === 'visiting') {
        setVisitingRecords(visitingRecords.filter(r => r.id !== id));
      } else {
        setSelfRecords(selfRecords.filter(r => r.id !== id));
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const newFile = {
        name: file.name,
        date: new Date().toISOString().split('T')[0],
        size: `${(file.size / (1024 * 1024)).toFixed(1)}MB`
      };
      setUploadedFiles([newFile, ...uploadedFiles]);
    } else if (file) {
      alert('PDF 파일만 업로드 가능합니다.');
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-12">
            <header className="border-b border-[#D1CEC7] pb-8">
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-[#D14F33] mb-4 block">혁신과 실천 • 2026</span>
              <h1 className="text-7xl font-serif font-black tracking-tighter uppercase leading-none text-[#1A1A1A] mb-4">
                M.S.G 교원<br />연구회
              </h1>
              <p className="text-[#6B6862] max-w-3xl text-xl font-serif leading-relaxed">
                L.E.N.S 모델과 멀티모달 AI를 활용한 '데이터 기반 사회 문제 해결' 융합 수업 설계 및 실천
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#D1CEC7] divide-y md:divide-y-0 md:divide-x divide-[#D1CEC7]">
              <div className="bg-[#FDFCFB] p-10 flex flex-col items-center text-center">
                <h4 className="text-[#A3A099] text-xs font-sans font-black uppercase tracking-[0.2em] mb-4">총 연수 시간</h4>
                <p className="text-6xl font-serif font-light text-[#1A1A1A] tracking-tighter">{totalVisitingHours + totalSelfHours}</p>
                <span className="text-xs font-serif text-[#A3A099] mt-2">시간 기록됨</span>
              </div>
              <div className="bg-[#1A1A1A] p-10 flex flex-col items-center text-center text-white">
                <h4 className="text-[#6B6862] text-xs font-sans font-black uppercase tracking-[0.2em] mb-4">핵심 연구원</h4>
                <p className="text-6xl font-serif font-light tracking-tighter">{MEMBERS.length}</p>
                <span className="text-xs font-serif text-white/40 mt-2">4개 학교 소속</span>
              </div>
              <div className="bg-[#FDFCFB] p-10 flex flex-col items-center text-center">
                <h4 className="text-[#A3A099] text-xs font-sans font-black uppercase tracking-[0.2em] mb-4">연구 핵심 모델</h4>
                <p className="text-4xl font-serif font-bold text-[#1A1A1A] tracking-tighter uppercase leading-tight pt-2">L.E.N.S</p>
                <span className="text-xs font-serif text-[#A3A099] mt-2">데이터 기반 융합</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <section>
                  <h2 className="text-xs font-sans font-bold uppercase tracking-widest border-b border-[#1A1A1A] pb-1 mb-6">최근 공지사항</h2>
                  <div className="space-y-6">
                    {INITIAL_NOTICES.map((notice) => (
                      <div key={notice.id} className="group cursor-pointer border-b border-[#E5E2DB] pb-4 last:border-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="text-2xl font-serif font-medium text-[#1A1A1A] group-hover:text-[#D14F33] transition-colors leading-tight">
                            {notice.title}
                          </h3>
                          <span className="text-xs font-sans text-[#A3A099] font-bold uppercase tracking-widest flex-shrink-0 ml-4">{notice.date}</span>
                        </div>
                        {notice.important && (
                          <span className="text-[9px] font-sans font-black uppercase tracking-widest border border-red-200 text-red-600 px-2 py-0.5 inline-block">중요 공지</span>
                        )}
                      </div>
                    ))}
                    <button className="text-[11px] font-sans font-bold uppercase tracking-widest text-[#A3A099] hover:text-[#1A1A1A] transition-colors mt-4 block mx-auto py-2 border border-[#D1CEC7] px-8">
                      전체 아카이브 보기
                    </button>
                  </div>
                </section>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <div className="border-2 border-[#1A1A1A] p-8 flex flex-col items-center text-center bg-white">
                  <BookOpen size={32} className="text-[#1A1A1A] mb-4" strokeWidth={1} />
                  <h3 className="text-lg font-serif font-black mb-2 uppercase tracking-tighter">연구 자료 보관소</h3>
                  <p className="text-xs font-sans text-[#6B6862] mb-6 leading-relaxed">공유 데이터셋, 회의록, 연구 논문을 보안 포털을 통해 확인하세요.</p>
                  <a 
                    href={SHARED_DRIVE_URL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block px-8 py-3 bg-[#1A1A1A] text-white text-[10px] font-sans font-black uppercase tracking-[0.2em] hover:bg-[#333] transition-all shadow-lg"
                  >
                    구글 드라이브 접속
                  </a>
                </div>

                <div className="bg-[#F5F2ED] p-6 rounded-sm border border-[#D1CEC7]">
                   <h4 className="text-[10px] font-sans font-black uppercase tracking-widest text-[#1A1A1A] mb-4 border-b border-[#D1CEC7] pb-1">AI 도구 구독 관리</h4>
                   <div className="space-y-3">
                     {[
                       { name: 'ChatGPT Plus', purpose: '수업안 설계 및 분석', level: '사용 중' },
                       { name: 'Claude Pro', purpose: '데이터 요약 및 정제', level: '검토 중' },
                       { name: 'Perplexity Pro', purpose: '학술 정보 실시간 검색', level: '사용 중' }
                     ].map((ai, idx) => (
                       <div key={idx} className="flex justify-between items-center text-xs">
                         <div className="flex flex-col">
                           <span className="font-bold text-[#1A1A1A]">{ai.name}</span>
                           <span className="text-[10px] text-[#A3A099]">{ai.purpose}</span>
                         </div>
                         <span className="text-[9px] font-black uppercase bg-[#1A1A1A] text-white px-1.5 py-0.5">{ai.level}</span>
                       </div>
                     ))}
                   </div>
                </div>

                <div className="bg-[#1A1A1A] p-6 rounded-sm text-white">
                   <h4 className="text-[10px] font-sans font-black uppercase tracking-widest mb-4 border-b border-white/20 pb-1">시스템 상태</h4>
                   <div className="flex items-center gap-3 text-white/60">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#D14F33]" />
                     <span className="text-xs font-sans">L.E.N.S 모델 V2.1 가동 중</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'visiting':
        return (
          <div className="space-y-12">
            <header className="border-b border-[#D1CEC7] pb-8">
              <span className="text-xs font-sans font-bold uppercase tracking-[0.3em] text-[#D14F33] mb-4 block">전문성 개발 및 역량 강화</span>
              <h2 className="text-6xl font-serif font-black tracking-tighter uppercase leading-none text-[#1A1A1A] mb-4">찾아가는 연수</h2>
              <p className="text-[#6B6862] text-xl font-serif leading-relaxed">교육청 및 외부 전문가 초빙 연수 기록 (총 6시간 필수)</p>
            </header>
            
            <div className="grid grid-cols-1 gap-px bg-[#D1CEC7] border border-[#D1CEC7]">
              {visitingRecords.map((item) => (
                <div key={item.id} className="bg-white p-8 group transition-all flex flex-col md:flex-row md:items-start gap-8 relative">
                  <div className="flex-shrink-0 w-20 h-20 bg-[#1A1A1A] text-white flex flex-col items-center justify-center font-serif">
                    <span className="text-3xl font-light">{item.hours}</span>
                    <span className="text-[9px] uppercase tracking-widest opacity-50">시간</span>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-[10px] font-sans font-black px-2 py-0.5 bg-[#F5F2ED] text-[#1A1A1A] border border-[#D1CEC7] uppercase tracking-widest">
                        {item.memberName || '미지정'}
                      </span>
                      <div className="w-1 h-1 rounded-full bg-[#D1CEC7]" />
                      <span className="text-xs font-sans font-bold text-[#A3A099] uppercase tracking-widest">{item.date}</span>
                    </div>
                    <h4 className="text-3xl font-serif font-medium text-[#1A1A1A] group-hover:text-[#D14F33] transition-colors mb-2 leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-[#6B6862] text-xl font-sans leading-relaxed max-w-2xl mb-4">
                      {item.content}
                    </p>
                    <button 
                      onClick={() => handleEditStart(item, 'visiting')}
                      className="text-xs font-sans font-black uppercase tracking-widest text-[#D14F33] hover:underline"
                    >
                      기록 수정하기
                    </button>
                  </div>
                  {item.id.includes('-') && (
                    <button 
                      onClick={() => handleDeleteRecord(item.id, 'visiting')}
                      className="absolute top-8 right-8 p-2 text-[#A3A099] hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {showVisitingForm && (
              <div className="bg-[#F5F2ED] p-10 border border-[#D1CEC7] space-y-6">
                <h3 className="text-sm font-sans font-black uppercase tracking-widest mb-6">
                  {editingRecordId ? '연수 기록 수정' : '새 연수 기록 등록'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-sans font-black uppercase tracking-widest text-[#A3A099]">연구원 선택 (Member)</label>
                    <select 
                      className="w-full bg-white border border-[#D1CEC7] p-4 text-base focus:outline-none focus:border-[#1A1A1A]"
                      value={newRecord.memberName}
                      onChange={e => setNewRecord({...newRecord, memberName: e.target.value})}
                    >
                      <option value="">연구원을 선택하세요</option>
                      {MEMBERS.map((m, i) => (
                        <option key={i} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-sans font-black uppercase tracking-widest text-[#A3A099]">연수 일자 (Date)</label>
                    <input type="date" className="w-full bg-white border border-[#D1CEC7] p-4 text-base focus:outline-none focus:border-[#1A1A1A]" 
                           value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-sans font-black uppercase tracking-widest text-[#A3A099]">연수 주제 (Subject)</label>
                    <input type="text" placeholder="예: AI 비서 활용 교육" className="w-full bg-white border border-[#D1CEC7] p-4 text-base focus:outline-none focus:border-[#1A1A1A]" 
                           value={newRecord.title} onChange={e => setNewRecord({...newRecord, title: e.target.value})} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-sans font-black uppercase tracking-widest text-[#A3A099]">연수 내용 (Content)</label>
                    <textarea 
                      placeholder="주요 내용 요약" 
                      rows={3}
                      className="w-full bg-white border border-[#D1CEC7] p-4 text-base focus:outline-none focus:border-[#1A1A1A]" 
                      value={newRecord.content} 
                      onChange={e => setNewRecord({...newRecord, content: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-sans font-black uppercase tracking-widest text-[#A3A099]">이수 시간 (Hours)</label>
                    <input type="number" placeholder="이수 시간" className="w-full bg-white border border-[#D1CEC7] p-4 text-base focus:outline-none focus:border-[#1A1A1A]" 
                           value={newRecord.hours} onChange={e => setNewRecord({...newRecord, hours: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div className="flex gap-4 justify-end pt-4">
                  <button onClick={() => {
                    setShowVisitingForm(false);
                    setEditingRecordId(null);
                    setNewRecord({ title: '', date: '', hours: 2, content: '', memberName: '' });
                  }} className="px-8 py-3 text-xs font-sans font-black uppercase tracking-widest text-[#A3A099]">취소</button>
                  <button onClick={() => handleAddRecord('visiting')} className="px-10 py-3 bg-[#1A1A1A] text-white text-xs font-sans font-black uppercase tracking-widest shadow-lg">
                    {editingRecordId ? '기록 업데이트' : '기록 저장'}
                  </button>
                </div>
              </div>
            )}
            
            {!showVisitingForm && (
              <button 
                onClick={() => setShowVisitingForm(true)}
                className="w-full py-12 border-2 border-dashed border-[#D1CEC7] text-[#A3A099] font-sans font-black uppercase tracking-[0.3em] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-all flex flex-col items-center justify-center gap-4"
              >
                <Users size={32} strokeWidth={1} />
                새로운 외부 연수 기록하기
              </button>
            )}
          </div>
        );
      case 'self':
        return (
          <div className="space-y-12">
            <header className="border-b border-[#D1CEC7] pb-8">
              <span className="text-xs font-sans font-bold uppercase tracking-[0.3em] text-[#D14F33] mb-4 block">자체 연구 및 내부 역량 강화</span>
              <h2 className="text-6xl font-serif font-black tracking-tighter uppercase leading-none text-[#1A1A1A] mb-4">자체 연구 연수</h2>
              <p className="text-[#6B6862] text-xl font-serif leading-relaxed">동아리 자체 연구 및 협의회 기록 (총 9시간 필수)</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#D1CEC7] border border-[#D1CEC7]">
              {selfRecords.map((item) => (
                <div key={item.id} className="bg-white p-8 hover:bg-[#FDFCFB] transition-all group relative">
                   <div className="flex items-start justify-between mb-6">
                    <div className="text-4xl font-serif font-light text-[#1A1A1A]">
                      {item.hours}<span className="text-sm font-sans font-black uppercase tracking-widest ml-1 opacity-30">시간</span>
                    </div>
                    <span className="text-[10px] font-sans font-bold text-[#A3A099] uppercase tracking-widest">{item.date}</span>
                  </div>
                  <div className="mb-4">
                    <span className="text-[9px] font-sans font-black px-2 py-1 bg-[#F5F2ED] text-[#1A1A1A] border border-[#D1CEC7] uppercase tracking-widest">
                      {item.memberName || '미지정'}
                    </span>
                  </div>
                  <h4 className="text-3xl font-serif font-medium text-[#1A1A1A] mb-3 group-hover:text-[#D14F33] transition-colors leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-[#6B6862] text-xl font-sans leading-relaxed mb-6 line-clamp-3">
                    {item.content}
                  </p>
                  <div className="pt-6 border-t border-[#E5E2DB] flex items-center justify-between">
                    <button 
                      onClick={() => handleEditStart(item, 'self')}
                      className="text-[10px] font-sans font-black text-[#1A1A1A] uppercase tracking-widest hover:underline decoration-[#D14F33]"
                    >
                      상세 수정
                    </button>
                    <div className="flex items-center gap-2">
                       <Clock size={12} className="text-[#A3A099]" />
                       <span className="text-[9px] font-sans font-black text-[#A3A099] uppercase tracking-widest">{item.status === 'completed' ? '기록 완료' : '진행 중'}</span>
                    </div>
                    {item.id.includes('-') && (
                      <button 
                        onClick={() => handleDeleteRecord(item.id, 'self')}
                        className="p-2 text-[#A3A099] hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {showSelfForm && (
              <div className="bg-[#FDFCFB] p-10 border-2 border-[#1A1A1A] space-y-6">
                <h3 className="text-sm font-sans font-black uppercase tracking-widest mb-6">
                  {editingRecordId ? '연구 기록 수정' : '새 연구 기록 등록'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-sans font-black uppercase tracking-widest text-[#A3A099]">연구원 선택 (Member)</label>
                    <select 
                      className="w-full bg-white border border-[#D1CEC7] p-4 text-base focus:outline-none focus:border-[#1A1A1A]"
                      value={newRecord.memberName}
                      onChange={e => setNewRecord({...newRecord, memberName: e.target.value})}
                    >
                      <option value="">연구원을 선택하세요</option>
                      {MEMBERS.map((m, i) => (
                        <option key={i} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-sans font-black uppercase tracking-widest text-[#A3A099]">연구 일자 (Date)</label>
                    <input type="date" className="w-full bg-white border border-[#D1CEC7] p-4 text-base focus:outline-none focus:border-[#1A1A1A]" 
                           value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-sans font-black uppercase tracking-widest text-[#A3A099]">연구 주제 (Topic)</label>
                    <input type="text" placeholder="예: L.E.N.S 모델 적용 사례 연구" className="w-full bg-white border border-[#D1CEC7] p-4 text-base focus:outline-none focus:border-[#1A1A1A]" 
                           value={newRecord.title} onChange={e => setNewRecord({...newRecord, title: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-sans font-black uppercase tracking-widest text-[#A3A099]">연구 시간 (Hours)</label>
                    <input type="number" placeholder="연구 시간" className="w-full bg-white border border-[#D1CEC7] p-4 text-base focus:outline-none focus:border-[#1A1A1A]" 
                           value={newRecord.hours} onChange={e => setNewRecord({...newRecord, hours: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-sans font-black uppercase tracking-widest text-[#A3A099]">연구 및 회의 내용 (Content)</label>
                    <textarea 
                      placeholder="핵심 연구 내용 요약" 
                      rows={3}
                      className="w-full bg-white border border-[#D1CEC7] p-4 text-base focus:outline-none focus:border-[#1A1A1A]" 
                      value={newRecord.content} 
                      onChange={e => setNewRecord({...newRecord, content: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="flex gap-4 justify-end pt-4">
                  <button onClick={() => {
                    setShowSelfForm(false);
                    setEditingRecordId(null);
                    setNewRecord({ title: '', date: '', hours: 2, content: '', memberName: '' });
                  }} className="px-8 py-3 text-xs font-sans font-black uppercase tracking-widest text-[#A3A099]">취소</button>
                  <button onClick={() => handleAddRecord('self')} className="px-10 py-3 bg-[#1A1A1A] text-white text-xs font-sans font-black uppercase tracking-widest shadow-lg">
                    {editingRecordId ? '연구 업데이트' : '저장하기'}
                  </button>
                </div>
              </div>
            )}

            {!showSelfForm && (
              <button 
                onClick={() => setShowSelfForm(true)}
                className="w-full py-12 border-2 border-dashed border-[#D1CEC7] text-[#A3A099] font-sans font-black uppercase tracking-[0.3em] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-all flex flex-col items-center justify-center gap-4"
              >
                <Calendar size={32} strokeWidth={1} />
                자체 연구 연수 기록 등록
              </button>
            )}
          </div>
        );
      case 'resources':
        return (
          <div className="space-y-12">
             <header className="border-b border-[#D1CEC7] pb-8">
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-[#D14F33] mb-4 block">지식 관리 및 자료 아카이브</span>
              <h2 className="text-5xl font-serif font-black tracking-tighter uppercase leading-none text-[#1A1A1A] mb-4">연구 자료 보관소</h2>
              <p className="text-[#6B6862] text-xl font-serif leading-relaxed">연구회 파일 업로드 및 주요 연구 문서 관리</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="border-2 border-[#1A1A1A] p-8 text-center bg-white relative">
                   <FileText size={48} className="mx-auto text-[#1A1A1A] mb-4" strokeWidth={1} />
                   <h3 className="text-xl font-serif font-black uppercase tracking-tighter mb-2">계획서 업로드</h3>
                   <p className="text-xs font-sans text-[#A3A099] mb-6">PDF 형식의 연구 계획서 및 결과물을 이곳에 등록하세요.</p>
                   
                   <label className="inline-block w-full px-8 py-3 bg-[#1A1A1A] text-white text-[10px] font-sans font-black uppercase tracking-[0.2em] cursor-pointer hover:bg-[#333] transition-all">
                     파일 선택
                     <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                   </label>
                </div>

                <div className="bg-[#F5F2ED] p-6 border border-[#D1CEC7]">
                   <h4 className="text-[10px] font-sans font-black uppercase tracking-widest text-[#1A1A1A] mb-3">주의사항</h4>
                   <ul className="text-[11px] font-sans text-[#6B6862] space-y-2 list-disc list-inside">
                     <li>파일 용량은 최대 10MB까지 지원됩니다.</li>
                     <li>모든 파일은 PDF 형식만 가능합니다.</li>
                     <li>부적절한 파일은 관리자에 의해 삭제될 수 있습니다.</li>
                   </ul>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xs font-sans font-black uppercase tracking-widest border-b border-[#1A1A1A] pb-1">등록된 문서 리스트</h3>
                <div className="border border-[#D1CEC7] divide-y divide-[#D1CEC7]">
                   {uploadedFiles.map((file, idx) => (
                     <div key={idx} className="bg-white p-6 flex justify-between items-center group hover:bg-[#FDFCFB]">
                       <div className="flex items-center gap-4">
                         <div className="p-3 bg-[#F5F2ED] text-[#D14F33]">
                           <FileText size={20} />
                         </div>
                         <div>
                           <h4 className="font-serif font-medium text-xl text-[#1A1A1A] truncate max-w-xs">{file.name}</h4>
                           <p className="text-xs font-sans text-[#A3A099] uppercase font-bold tracking-widest">{file.date} • {file.size}</p>
                         </div>
                       </div>
                       <button className="px-4 py-2 text-[10px] font-sans font-black uppercase tracking-widest border border-[#D1CEC7] hover:bg-[#1A1A1A] hover:text-white transition-all">
                         열기
                       </button>
                     </div>
                   ))}
                   {uploadedFiles.length === 0 && (
                     <div className="p-12 text-center text-[#A3A099] font-serif">
                       업로드된 문서가 없습니다.
                     </div>
                   )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <a href={SHARED_DRIVE_URL} target="_blank" className="p-6 border border-[#D1CEC7] bg-[#1A1A1A] text-white flex justify-between items-center group">
                    <span className="text-xs font-sans font-black uppercase tracking-widest">구글 공유 드라이브</span>
                    <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                  <div className="p-6 border border-[#D1CEC7] bg-[#FDFCFB] flex justify-between items-center">
                    <span className="text-xs font-sans font-black uppercase tracking-widest text-[#1A1A1A]">L.E.N.S 가이드북 (준비중)</span>
                    <Info size={16} className="text-[#D1CEC7]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'ai-subs':
        return (
          <div className="space-y-12">
            <header className="border-b border-[#D1CEC7] pb-8">
              <span className="text-xs font-sans font-bold uppercase tracking-[0.3em] text-[#D14F33] mb-4 block">AI Tools & Knowledge Utility</span>
              <h2 className="text-6xl font-serif font-black tracking-tighter uppercase leading-none text-[#1A1A1A] mb-4">AI 도구 구독 관리</h2>
              <p className="text-[#6B6862] text-xl font-serif leading-relaxed">회원별 유료 AI 서비스 이용 현황 및 활용 목적</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {MEMBERS.map((member, idx) => (
                <div key={idx} className="bg-white border-2 border-[#1A1A1A] p-8 flex flex-col items-center text-center shadow-none hover:shadow-xl transition-all">
                  <div className="w-16 h-16 bg-[#F5F2ED] rounded-full flex items-center justify-center mb-6 border border-[#D1CEC7]">
                    <span className="text-xl font-serif font-black">{member.name[0]}</span>
                  </div>
                  <h3 className="text-2xl font-serif font-black mb-1">{member.name}</h3>
                  <p className="text-xs font-sans text-[#A3A099] uppercase tracking-widest mb-6">{member.school}</p>
                  
                  <div className="w-full pt-6 border-t border-[#D1CEC7] text-left">
                    <span className="text-[10px] font-sans font-black uppercase tracking-widest text-[#D14F33] mb-2 block">현재 구독 중인 도구</span>
                    {editingMember === member.name ? (
                      <div className="space-y-4">
                        <textarea 
                          className="w-full bg-[#FDFCFB] border border-[#1A1A1A] p-3 text-sm font-sans focus:outline-none"
                          rows={3}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setAiSubs({...aiSubs, [member.name]: editValue});
                              setEditingMember(null);
                            }}
                            className="flex-grow py-2 bg-[#1A1A1A] text-white text-[10px] font-sans font-black uppercase tracking-widest"
                          >
                            저장
                          </button>
                          <button 
                            onClick={() => setEditingMember(null)}
                            className="px-4 py-2 border border-[#D1CEC7] text-[10px] font-sans font-black uppercase tracking-widest"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="group cursor-pointer" onClick={() => {
                        setEditingMember(member.name);
                        setEditValue(aiSubs[member.name] || '정보 없음');
                      }}>
                        <p className="text-lg font-serif italic text-[#1A1A1A] leading-snug underline decoration-[#D1CEC7] decoration-1 underline-offset-4 group-hover:decoration-[#D14F33] transition-all">
                          {aiSubs[member.name] || '구독 정보가 없습니다.'}
                        </p>
                        <span className="text-[9px] font-sans font-black text-[#A3A099] uppercase mt-4 block opacity-0 group-hover:opacity-100 transition-opacity">클릭하여 수정하기</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#1A1A1A] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl">
                 <h4 className="text-xl font-serif font-black mb-2 uppercase tracking-tight">AI 연구 예금 지원</h4>
                 <p className="text-white/60 text-sm font-sans leading-relaxed">연구회 회원분들께는 연간 일정액의 AI 도구 구독료가 지원됩니다. 영수증 사본을 '자료 보관소'의 정산 폴더에 업로드 해주시기 바랍니다.</p>
              </div>
              <button className="px-10 py-4 bg-white text-[#1A1A1A] text-xs font-sans font-black uppercase tracking-[0.2em] hover:bg-[#F5F2ED] transition-all shadow-lg whitespace-nowrap">
                정산 자료 제출 매뉴얼
              </button>
            </div>
          </div>
        );

      case 'members':
        return (
           <div className="space-y-12">
             <header className="border-b border-[#D1CEC7] pb-8">
              <span className="text-xs font-sans font-bold uppercase tracking-[0.3em] text-[#D14F33] mb-4 block">연구 공동체 조직</span>
              <h2 className="text-6xl font-serif font-black tracking-tighter uppercase leading-none text-[#1A1A1A] mb-4">동아리 회원 명부</h2>
              <p className="text-[#6B6862] text-xl font-serif leading-relaxed">함께 연구하며 디지털 미래를 설계하는 5명의 혁신 교사들</p>
            </header>

            <div className="bg-white border border-[#D1CEC7] shadow-none overflow-hidden">
               <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#1A1A1A] text-white">
                    <tr className="text-[10px] font-sans font-bold uppercase tracking-[0.3em]">
                      <th className="px-8 py-4 border-r border-white/10">성함 / Name</th>
                      <th className="px-8 py-4 border-r border-white/10">소속 / School</th>
                      <th className="px-8 py-4 border-r border-white/10">역할</th>
                      <th className="px-8 py-4">주요 전담 과업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E2DB] font-serif">
                    {MEMBERS.map((member, i) => (
                      <tr key={i} className="hover:bg-[#F5F2ED] transition-colors group">
                        <td className="px-8 py-6">
                          <button 
                            className="font-bold text-[#1A1A1A] text-2xl hover:text-[#D14F33] transition-colors text-left"
                            onClick={() => alert(`${member.name} 선생님의 상세 프로필 준비 중입니다.`)}
                          >
                            {member.name}
                          </button>
                        </td>
                        <td className="px-8 py-6 text-[#6B6862] text-lg">{member.school}</td>
                        <td className="px-8 py-6">
                          <span className="text-[10px] font-sans font-black text-[#D14F33] uppercase tracking-widest border border-[#D14F33] px-3 py-1">{member.role}</span>
                        </td>
                        <td className="px-8 py-6 text-base text-[#6B6862] font-sans font-medium uppercase tracking-tighter leading-relaxed">{member.tasks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex font-serif text-[#1A1A1A]">
      <AnimatePresence>
        {isSidebarOpen && (
           <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-[#1A1A1A]/60 backdrop-blur-sm z-40 lg:hidden"
           />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-[#D1CEC7] z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col p-8 overflow-y-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-[#1A1A1A] rounded-none flex items-center justify-center text-white shrink-0">
              <BookOpen size={20} strokeWidth={1} />
            </div>
            <div>
               <h2 className="text-4xl font-serif font-black tracking-tighter leading-none uppercase underline decoration-[#D14F33] decoration-2 underline-offset-4">M.S.G</h2>
               <p className="text-sm font-sans font-black text-[#A3A099] uppercase tracking-[0.2em] mt-3">AI-교원-연구회</p>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden ml-auto p-2 text-[#A3A099] hover:text-[#1A1A1A]"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-grow space-y-2">
            <SidebarItem label="대시보드" icon={LayoutDashboard} active={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} />
            <SidebarItem label="찾아가는 연수" icon={Users} active={activeTab === 'visiting'} onClick={() => handleTabChange('visiting')} />
            <SidebarItem label="자체 연구 연수" icon={Clock} active={activeTab === 'self'} onClick={() => handleTabChange('self')} />
            <SidebarItem label="AI 구독 관리" icon={Settings} active={activeTab === 'ai-subs'} onClick={() => handleTabChange('ai-subs')} />
            <SidebarItem label="자료실" icon={FileText} active={activeTab === 'resources'} onClick={() => handleTabChange('resources')} />
            <SidebarItem label="회원 명부" icon={Users} active={activeTab === 'members'} onClick={() => handleTabChange('members')} />
          </nav>

          <footer className="mt-12 pt-8 border-t border-[#D1CEC7]">
             <span className="text-sm font-sans font-black uppercase tracking-[0.3em] text-[#A3A099]">교육혁신 • 2026</span>
          </footer>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col min-w-0 bg-[#FDFCFB] lg:ml-0">
        {/* Header */}
        <header className="h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 border-b border-[#D1CEC7] bg-[#FDFCFB]/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-[#6B6862] hover:text-[#1A1A1A]"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3 text-[#A3A099]">
               <span className="text-[10px] font-sans font-black uppercase tracking-widest hidden sm:inline">{activeTab === 'dashboard' ? '대시보드' : activeTab === 'visiting' ? '찾아가는 연수' : activeTab === 'self' ? '자체 연구' : activeTab === 'resources' ? '자료실' : activeTab === 'ai-subs' ? 'AI 구독' : '회원명부'}</span>
               <div className="w-1 h-1 rounded-full bg-[#D1CEC7] hidden sm:inline" />
               <h1 className="text-[10px] font-sans font-black text-[#1A1A1A] uppercase tracking-widest">
                 {activeTab === 'dashboard' ? '개요' : activeTab === 'visiting' ? '외부 연수' : activeTab === 'self' ? '자체 연구' : activeTab === 'resources' ? '지식창고' : activeTab === 'ai-subs' ? '구독 현황' : '연구진'}
               </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button className="relative p-2 text-[#6B6862] hover:text-[#1A1A1A] transition-colors">
               <Bell size={18} strokeWidth={1.5} />
               <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#D14F33] rounded-full" />
             </button>
             <div className="w-8 h-8 rounded-none border border-[#1A1A1A] overflow-hidden p-0.5">
               <img 
                 src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                 alt="Avatar" 
                 className="w-full h-full object-cover grayscale"
                 referrerPolicy="no-referrer"
               />
             </div>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto">
          <section className="p-4 sm:p-12 max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </section>

          {/* Page Footer Decor */}
          <div className="p-8 sm:p-12 border-t border-[#D1CEC7] flex justify-between items-center bg-white">
            <p className="text-[10px] font-sans font-black uppercase tracking-[0.4em] text-[#A3A099]">© 2026 M.S.G 연구 공동체</p>
            <div className="hidden sm:flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#D1CEC7]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#D14F33]"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
