
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Setup from './pages/Setup.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Leaderboard from './pages/Leaderboard.tsx';
import Admin from './pages/Admin.tsx';

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
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 px-4 py-3 flex justify-around items-center z-50">
        <Link to="/" className={`flex flex-col items-center transition-colors ${location.pathname === '/' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <span className="text-xl">☀️</span>
          <span className="text-[10px] font-bold uppercase mt-0.5 tracking-tighter">Presence</span>
        </Link>
        <Link to="/leaderboard" className={`flex flex-col items-center transition-colors ${location.pathname === '/leaderboard' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <span className="text-xl">🏆</span>
          <span className="text-[10px] font-bold uppercase mt-0.5 tracking-tighter">Ranks</span>
        </Link>
        <Link to="/admin" className={`flex flex-col items-center transition-colors ${location.pathname === '/admin' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
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
      <footer className="mt-auto py-8 text-center border-t border-gray-50 opacity-50 px-6">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
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
      <div className="min-h-screen bg-[#fcfcfd] flex flex-col">
        <div className="max-w-[520px] mx-auto w-full min-h-screen bg-white shadow-[0_0_80px_rgba(0,0,0,0.03)] overflow-x-hidden flex flex-col relative">
          <main className="flex-1 pb-24">
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
