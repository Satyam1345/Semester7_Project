"use client"
import { PanelLeftClose, PanelLeftOpen, LogOut, Mic, Brain, PanelBottom, PanelBottomClose, Search, PanelRightClose, PanelRightOpen, BookOpen, Home } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

function Header({ isSidebarOpen, toggleSidebar, onLogout, onTogglePodcast, onToggleInsights, onToggleAnalysis, isAnalysisOpen, onToggleRelated, isRelatedOpen }) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Use provided onLogout or default to handleLogout
  const logoutHandler = onLogout || handleLogout;
  const orb1Ref = useRef(null);
  const orb2Ref = useRef(null);
  const orb3Ref = useRef(null);

  useEffect(() => {
    let frameId;
    let time = 0;

    const animate = () => {
      time += 0.01;
      
      if (orb1Ref.current) {
        const x = Math.sin(time * 0.5) * 30;
        const y = Math.cos(time * 0.7) * 20;
        orb1Ref.current.style.transform = `translate(${x}px, ${y}px)`;
      }
      
      if (orb2Ref.current) {
        const x = Math.cos(time * 0.6) * 40;
        const y = Math.sin(time * 0.5) * 25;
        orb2Ref.current.style.transform = `translate(${x}px, ${y}px)`;
      }
      
      if (orb3Ref.current) {
        const x = Math.sin(time * 0.4) * 35;
        const y = Math.cos(time * 0.6) * 30;
        orb3Ref.current.style.transform = `translate(${x}px, ${y}px)`;
      }
      
      frameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <header className="relative flex items-center justify-between h-16 px-6 bg-gradient-to-r from-blue-400 via-slate-500/90 to-blue-800/90 backdrop-blur-md border-b border-slate-600/40 shadow-lg flex-shrink-0 overflow-hidden">
      {/* Animated background orbs - more subtle */}
      <div ref={orb1Ref} className="absolute left-[10%] top-1/2 w-32 h-32 bg-slate-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div ref={orb2Ref} className="absolute right-[30%] top-1/2 w-40 h-40 bg-slate-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div ref={orb3Ref} className="absolute right-[10%] top-1/2 w-36 h-36 bg-slate-500/8 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-3 pointer-events-none"></div>
      
      <div className="relative z-10 flex items-center gap-6">
        <div className="group relative">
          <button 
            onClick={toggleSidebar} 
            className="p-2.5 rounded-lg bg-slate-700/50 backdrop-blur-sm border border-slate-500/30 hover:bg-slate-600/60 hover:border-slate-400/40 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {isSidebarOpen ? <PanelLeftClose size={18} className="text-slate-200" /> : <PanelLeftOpen size={18} className="text-slate-200" />}
          </button>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-slate-800/95 text-slate-200 text-xs rounded-md border border-slate-600/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg backdrop-blur-sm">
            {isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div onClick={() => router.push('/')} className="relative overflow-hidden flex flex-row cursor-pointer group">
            
            <div className="text-2xl font-bold text-slate-100 flex relative tracking-wide">
              <span className="inline-block transition-transform hover:scale-105 duration-200">A</span>
              <span className="inline-block transition-transform hover:scale-105 duration-200">x</span>
              <span className="inline-block transition-transform hover:scale-105 duration-200">o</span>
              <span className="inline-block transition-transform hover:scale-105 duration-200">n</span>
            </div>
            <span className='px-2'></span>
            <div className="text-2xl font-bold text-slate-300 flex tracking-wide">
              <span className="inline-block transition-transform hover:scale-105 duration-200">D</span>
              <span className="inline-block transition-transform hover:scale-105 duration-200">o</span>
              <span className="inline-block transition-transform hover:scale-105 duration-200">c</span>
              <span className="inline-block transition-transform hover:scale-105 duration-200">s</span>
            </div>
            
            {/* Subtle underline on hover */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-400 to-slate-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </div>
        </div>
      </div>
      
      <div className="relative z-10 flex items-center gap-3">
        <div className="group relative">
          <button 
            onClick={onToggleRelated} 
            className="p-2.5 rounded-lg bg-slate-700/50 backdrop-blur-sm border border-slate-500/30 hover:bg-slate-600/60 hover:border-slate-400/40 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {isRelatedOpen ? <PanelRightClose size={18} className="text-slate-200" /> : <Search size={18} className="text-slate-200" />}
          </button>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-slate-800/95 text-slate-200 text-xs rounded-md border border-slate-600/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg backdrop-blur-sm">
            {isRelatedOpen ? 'Hide related findings' : 'Show related findings'}
          </div>
        </div>
        
        <div className="group relative">
          <button 
            onClick={onToggleAnalysis} 
            className="p-2.5 rounded-lg bg-slate-700/50 backdrop-blur-sm border border-slate-500/30 hover:bg-slate-600/60 hover:border-slate-400/40 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {isAnalysisOpen ? <PanelRightClose size={18} className="text-slate-200" /> : <BookOpen size={18} className="text-slate-200" />}
          </button>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-slate-800/95 text-slate-200 text-xs rounded-md border border-slate-600/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg backdrop-blur-sm">
            {isAnalysisOpen ? 'Hide analysis overview' : 'Show analysis overview'}
          </div>
        </div>
        
        <div className="group relative">
          <button 
            onClick={onTogglePodcast} 
            className="p-2.5 rounded-lg bg-slate-700/50 backdrop-blur-sm border border-slate-500/30 hover:bg-slate-600/60 hover:border-slate-400/40 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Mic size={18} className="text-slate-200" />
          </button>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-slate-800/95 text-slate-200 text-xs rounded-md border border-slate-600/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg backdrop-blur-sm">
            Generate podcast
          </div>
        </div>
        
        <div className="group relative">
          <button 
            onClick={onToggleInsights} 
            className="p-2.5 rounded-lg bg-slate-700/50 backdrop-blur-sm border border-slate-500/30 hover:bg-slate-600/60 hover:border-slate-400/40 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Brain size={18} className="text-slate-200" />
          </button>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-slate-800/95 text-slate-200 text-xs rounded-md border border-slate-600/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg backdrop-blur-sm">
            Generate AI insights
          </div>
        </div>
        <div className="group relative">
          <button 
            onClick={() => router.push('/')} 
            className="p-2.5 rounded-lg bg-slate-700/50 backdrop-blur-sm border border-slate-500/30 hover:bg-slate-600/60 hover:border-slate-400/40 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Home size={18} className="text-slate-200" />
          </button>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-slate-800/95 text-slate-200 text-xs rounded-md border border-slate-600/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg backdrop-blur-sm">
            Homepage
          </div>
        </div>
        <div className="group relative">
          <button 
            onClick={logoutHandler} 
            className="p-2.5 rounded-lg bg-slate-700/50 backdrop-blur-sm border border-slate-500/30 hover:bg-slate-600/60 hover:border-slate-400/40 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <LogOut size={18} className="text-slate-200" />
          </button>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-slate-800/95 text-slate-200 text-xs rounded-md border border-slate-600/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg backdrop-blur-sm">
            Sign out
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </header>
  );
}

export default Header;
