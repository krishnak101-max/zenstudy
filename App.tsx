
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Setup from './pages/Setup.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Leaderboard from './pages/Leaderboard.tsx';
import Admin from './pages/Admin.tsx';
import AlarmManager from './components/AlarmManager.tsx';

const App: React.FC = () => {
  const [studentId, setStudentId] = useState<string | null>(localStorage.getItem('student_id'));

  useEffect(() => {
    const handleStorageChange = () => {
      const id = localStorage.getItem('student_id');
      if (id !== studentId) setStudentId(id);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [studentId]);

  const Navigation = () => {
    const location = useLocation();
    const noNavRoutes = ['/setup'];
    if (noNavRoutes.includes(location.pathname)) return null;

    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 px-4 py-3 flex justify-around items-center z-50 shadow-lg max-w-[1280px] mx-auto">
        <Link to="/" className={`flex flex-col items-center transition-all ${location.pathname === '/' ? 'text-[#2563EB] scale-110' : 'text-gray-400 hover:text-[#2563EB]'}`}>
          <span className="text-xl">☀️</span>
          <span className="text-[10px] font-bold uppercase mt-0.5 tracking-tighter">Presence</span>
        </Link>
        <Link to="/leaderboard" className={`flex flex-col items-center transition-all ${location.pathname === '/leaderboard' ? 'text-[#22C55E] scale-110' : 'text-gray-400 hover:text-[#22C55E]'}`}>
          <span className="text-xl">🏆</span>
          <span className="text-[10px] font-bold uppercase mt-0.5 tracking-tighter">Ranks</span>
        </Link>
        <Link to="/admin" className={`flex flex-col items-center transition-all ${location.pathname === '/admin' ? 'text-[#2563EB] scale-110' : 'text-gray-400 hover:text-[#2563EB]'}`}>
          <span className="text-xl">🛡️</span>
          <span className="text-[10px] font-bold uppercase mt-0.5 tracking-tighter">Admin</span>
        </Link>
      </nav>
    );
  };

  const Footer = () => {
    const location = useLocation();
    if (location.pathname === '/setup') return null;
    return (
      <footer className="mt-auto py-8 text-center border-t border-gray-100 px-6">
        <p className="text-[10px] font-black text-[#22C55E] uppercase tracking-[0.2em]">
          ZenStudy &copy; 2026
        </p>
        <p className="text-[9px] font-medium text-gray-400 mt-1 uppercase tracking-widest leading-relaxed">
          Wings Coaching Centre Karakunnu
        </p>
      </footer>
    );
  }

  return (
    <Router>
      <AlarmManager />
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <div className="mx-auto w-full max-w-[1280px] min-h-screen bg-white shadow-lg overflow-x-hidden flex flex-col relative">
          <main className="flex-1 pb-24 relative">
            <Routes>
              <Route
                path="/setup"
                element={studentId ? <Navigate to="/" replace /> : <Setup onComplete={(id) => {
                  localStorage.setItem('student_id', id);
                  setStudentId(id);
                }} />}
              />
              <Route
                path="/"
                element={studentId ? <Dashboard studentId={studentId} /> : <Navigate to="/setup" replace />}
              />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <Navigation />
        </div>
      </div>
    </Router>
  );
};

export default App;
