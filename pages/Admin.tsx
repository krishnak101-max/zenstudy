import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient.ts';
import { getFormattedDate } from '../logic/utils.ts';
import { generateAttendancePDF } from '../logic/pdfGenerator.ts'; // We'll create this helper

const ADMIN_PASSWORD = 'tracker2026';

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [selectedDate, setSelectedDate] = useState(getFormattedDate());
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [allAttendance, setAllAttendance] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: students, error: sErr } = await supabase
        .from('students')
        .select('*');
      if (sErr) throw sErr;
      setAllStudents(students || []);

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          student_id,
          checkin_time,
          points,
          rank_today,
          students (
            name,
            batch
          )
        `)
        .eq('date', selectedDate)
        .order('checkin_time', { ascending: true });

      if (error) throw error;
      setAllAttendance(data || []);
    } catch (err) {
      console.error('Admin Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, selectedDate]);

  const top3 = useMemo(() => allAttendance.slice(0, 3), [allAttendance]);
  const last3 = useMemo(() => allAttendance.length > 3 ? allAttendance.slice(-3) : [], [allAttendance]);
  const timeline10 = useMemo(() => allAttendance.slice(-10).reverse(), [allAttendance]);

  const lateStudents = useMemo(() => {
    const attendedIds = new Set(allAttendance.map(a => a.student_id));
    return allStudents.filter(s => !attendedIds.has(s.id));
  }, [allStudents, allAttendance]);

  const filteredSearch = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allAttendance.filter(a =>
      a.students?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.students?.batch.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allAttendance, searchQuery]);

  const copyToppersToWhatsApp = () => {
    const toppers = allAttendance.slice(0, 5);
    if (toppers.length === 0) return alert('No attendance records yet.');

    let text = `*🦅 ZENSTUDY | TOP EARLY RISERS (${selectedDate})*\n*Wings Coaching Centre Karakunnu*\n\n`;
    toppers.forEach((item, index) => {
      const time = new Date(item.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      text += `${index + 1}. *${item.students?.name}* - ${time} (${item.students?.batch})\n`;
    });
    text += `\nKeep rising! 🔥🧘‍♂️`;

    navigator.clipboard.writeText(text);
    alert('Top 5 copied to clipboard!');
  };

  const copyLateToWhatsApp = () => {
    if (lateStudents.length === 0) return alert('Perfect attendance today! ✨');

    let text = `*⚠️ ZENSTUDY | PENDING ATTENDANCE (${selectedDate})*\n*Wings Coaching Centre Karakunnu*\n\n`;
    text += `The following seekers have not checked in yet:\n\n`;
    lateStudents.forEach((student) => {
      text += `- *${student.name}* (${student.batch})\n`;
    });
    text += `\nTime to activate Zen Mode! ⏰📚`;

    navigator.clipboard.writeText(text);
    alert('Late list copied to clipboard!');
  };

  const exportToPDF = () => {
    try {
      generateAttendancePDF(selectedDate, allStudents.length, allAttendance);
    } catch (error) {
      console.error('PDF Generation Failed:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const resetAllData = async () => {
    if (!window.confirm('⚠️ DANGER ZONE ⚠️\n\nAre you sure you want to delete ALL data? This includes:\n- All students\n- All attendance records\n- All points and stats\n\nThis action CANNOT be undone.')) {
      return;
    }

    if (!window.confirm('Final Confirmation: Type "YES" to confirm.')) {
      return;
    }

    setLoading(true);
    try {
      const { error: attErr } = await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      if (attErr) throw attErr;

      const { error: statErr } = await supabase.from('student_stats').delete().neq('student_id', '00000000-0000-0000-0000-000000000000');
      if (statErr) throw statErr;

      const { error: stuErr } = await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (stuErr) throw stuErr;

      alert('All data has been successfully reset.');
      window.location.reload();
    } catch (err: any) {
      console.error('Reset Failed:', err);
      alert('Failed to reset data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-8 pt-24 flex flex-col items-center justify-center min-h-screen animate-in fade-in duration-700">
        <div className="w-full max-w-sm bg-black/20 p-12 rounded-[3.5rem] shadow-2xl border border-white/10 text-center relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div className="text-7xl mb-8 transform hover:scale-110 transition-transform">🛡️</div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">Admin Gate</h1>
          <p className="text-[10px] font-black text-emerald-200 uppercase tracking-[0.2em] mb-10">Teacher Verification Required</p>
          <form onSubmit={handleLogin} className="space-y-5">
            <input
              type="password"
              className={`w-full px-6 py-5 rounded-2xl border ${loginError ? 'border-red-500/50 bg-red-900/20 text-red-100 animate-shake' : 'border-white/10 bg-black/30 text-white'} focus:outline-none focus:ring-4 focus:ring-emerald-500/30 transition-all text-center font-black tracking-[0.6em] text-lg placeholder:tracking-normal placeholder:font-bold placeholder:text-white/20`}
              placeholder="SECRET"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl hover:bg-emerald-500 transition-all active:scale-95 shadow-xl shadow-emerald-900/20 mt-6 uppercase text-xs tracking-[0.3em]"
            >
              Authorize
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 text-white animate-in slide-in-from-bottom-4 duration-700">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tighter italic leading-none">ZenPanel</h1>
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mt-2">Administrative Control</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportToPDF} className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-900/20 transition-all active:scale-95">PDF</button>
          <button onClick={copyToppersToWhatsApp} className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all active:scale-95">Top 5</button>
          <button onClick={copyLateToWhatsApp} className="bg-rose-600 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-900/20 transition-all active:scale-95">Late</button>
          <button onClick={resetAllData} className="bg-red-600 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-900/20 transition-all active:scale-95">Reset</button>
          <button onClick={() => setIsAuthenticated(false)} className="bg-white/10 text-white/50 hover:text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors">Exit</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-black/20 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-6xl">📅</div>
          <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">Date</p>
          <input
            type="date"
            className="mt-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 font-black text-white focus:outline-none focus:ring-4 focus:ring-emerald-500/30 transition-all cursor-pointer text-sm w-full text-center"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="col-span-full flex justify-center py-10">
            <div className="animate-spin h-10 w-10 border-[3px] border-emerald-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            <div className="bg-black/20 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 shadow-sm text-center relative overflow-hidden">
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">Total Seekers</p>
              <p className="text-3xl font-black text-white tracking-tighter">{allStudents.length}</p>
            </div>
            <div className="bg-emerald-900/20 backdrop-blur-md p-6 rounded-[2rem] border border-emerald-500/20 text-center relative overflow-hidden">
              <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-1">Present Today</p>
              <p className="text-3xl font-black text-emerald-400 tracking-tighter">{allAttendance.length}</p>
            </div>
            <div className="hidden lg:block bg-rose-900/10 backdrop-blur-md p-6 rounded-[2rem] border border-rose-500/10 text-center relative overflow-hidden">
              <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest mb-1">Absent</p>
              <p className="text-3xl font-black text-rose-400 tracking-tighter">{allStudents.length - allAttendance.length}</p>
            </div>
          </>
        )}
      </div>

      {!loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-emerald-900/10 backdrop-blur-md p-6 rounded-[2rem] border border-emerald-500/10 relative overflow-hidden">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4 text-center">Top Early</p>
              <div className="space-y-2">
                {top3.length > 0 ? top3.map((a, i) => (
                  <div key={i} className="bg-black/20 p-2.5 rounded-xl border border-white/5 flex justify-between items-center px-4">
                    <p className="text-[10px] font-black text-white truncate">{a.students?.name}</p>
                    <p className="text-[10px] font-black text-emerald-400 tabular-nums">{new Date(a.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                )) : <p className="text-[10px] text-white/20 font-bold italic text-center py-2">Waiting...</p>}
              </div>
            </div>
            <div className="bg-rose-900/10 backdrop-blur-md p-6 rounded-[2rem] border border-rose-500/10 relative overflow-hidden">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4 text-center">Last Arrivals</p>
              <div className="space-y-2">
                {last3.length > 0 ? last3.map((a, i) => (
                  <div key={i} className="bg-black/20 p-2.5 rounded-xl border border-white/5 flex justify-between items-center px-4">
                    <p className="text-[10px] font-black text-white truncate">{a.students?.name}</p>
                    <p className="text-[10px] font-black text-rose-400 tabular-nums">{new Date(a.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                )) : <p className="text-[10px] text-white/20 font-bold italic text-center py-2">Waiting...</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <input
                type="text"
                placeholder="Find seeker..."
                className="w-full px-6 py-4 rounded-[2rem] border border-white/10 bg-black/20 shadow-xl shadow-emerald-900/5 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 font-black transition-all placeholder:text-white/20 text-white text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 opacity-30 text-lg">🔍</span>
            </div>
            {searchQuery && (
              <div className="bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 max-h-60 overflow-y-auto">
                {filteredSearch.length > 0 ? (
                  filteredSearch.map((a, i) => (
                    <div key={i} className="flex justify-between items-center p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <div>
                        <p className="font-black text-white text-sm leading-none mb-1">{a.students?.name}</p>
                        <p className="text-[9px] text-white/40 font-black uppercase tracking-widest">{a.students?.batch}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-emerald-400 tabular-nums text-sm">{new Date(a.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-0.5">#{a.rank_today}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-6 text-center text-white/20 font-black text-[10px] uppercase tracking-widest italic">No records</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 mb-6">
            <h2 className="font-black text-white uppercase text-[10px] tracking-[0.2em] px-4 flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Timeline (Recent)</span>
            </h2>
            <div className="overflow-hidden rounded-[2.5rem] border border-white/10 shadow-sm bg-black/20 backdrop-blur-md">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-emerald-200 uppercase text-[8px] font-black tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Seeker</th>
                    <th className="px-6 py-4 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {timeline10.length > 0 ? timeline10.map((item, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-black text-white tracking-tight text-xs mb-1">{item.students?.name}</p>
                        <p className="text-[8px] text-white/40 font-black uppercase tracking-widest">{item.students?.batch}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-emerald-400 tabular-nums text-xs">
                        {new Date(item.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={2} className="px-6 py-10 text-center text-white/20 font-black uppercase text-[10px] tracking-widest italic">Silent...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
