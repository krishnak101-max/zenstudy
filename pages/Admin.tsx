import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient.ts';
import { getFormattedDate } from '../logic/utils.ts';
import { generateAttendancePDF, generateMonthlyPDF } from '../logic/pdfGenerator.ts';

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

  const exportMonthlyReport = async () => {
    setLoading(true);
    try {
      console.log('Fetching monthly report data...');
      // Fetch all students with their stats
      const { data: studentsWithStats, error } = await supabase
        .from('students')
        .select(`
            name,
            batch,
            student_stats (
              total_points,
              medal_level
            )
          `);

      if (error) {
        console.error('Supabase fetch error:', error);
        throw error;
      }

      console.log('Raw Data:', studentsWithStats);

      // Flatten the data structure safely
      const formattedData = studentsWithStats.map((s: any) => {
        // Handle both array (one-to-many) and object (one-to-one) responses from Supabase
        const stats = Array.isArray(s.student_stats) ? s.student_stats[0] : s.student_stats;

        return {
          name: s.name,
          batch: s.batch,
          total_points: stats?.total_points || 0,
          medal_level: stats?.medal_level || 'Seeker'
        };
      });

      console.log('Formatted Data for PDF:', formattedData);

      generateMonthlyPDF(formattedData);

    } catch (error) {
      console.error('Monthly Report Failed:', error);
      alert('Failed to generate monthly report. See console for details.');
    } finally {
      setLoading(false);
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
      <div className="p-8 pt-24 flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="w-full max-w-sm premium-card p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 gradient-header"></div>
          <div className="text-7xl mb-8 transform hover:scale-110 transition-transform">🛡️</div>
          <h1 className="text-3xl font-black text-[#0F172A] mb-2 tracking-tight">Admin Gate</h1>
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-10">Teacher Verification Required</p>
          <form onSubmit={handleLogin} className="space-y-5">
            <input
              type="password"
              className={`w-full px-6 py-5 rounded-2xl border ${loginError ? 'border-red-400 bg-red-50 text-red-700 animate-shake' : 'border-[#E2E8F0] bg-white text-[#0F172A]'} focus:outline-none focus:ring-4 focus:ring-[#2563EB]/20 transition-all text-center font-bold tracking-[0.6em] text-lg placeholder:tracking-normal placeholder:font-semibold placeholder:text-[#94A3B8]`}
              placeholder="SECRET"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full"
            >
              Authorize
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] px-4 sm:px-6 lg:px-8 pt-6 pb-24">
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">Admin Panel</h1>
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mt-1">Administrative Control</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportToPDF} className="btn btn-primary text-xs px-4 py-2">📄 Daily PDF</button>
            <button onClick={exportMonthlyReport} className="btn bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-2 font-bold transition-all shadow-sm">📊 Monthly Report</button>
            <button onClick={copyToppersToWhatsApp} className="btn btn-success text-xs px-4 py-2">🏆 Top 5</button>
            <button onClick={copyLateToWhatsApp} className="bg-[#F59E0B] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#D97706] transition-all">⚠️ Late</button>
            <button onClick={resetAllData} className="bg-[#EF4444] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#DC2626] transition-all">🗑️ Reset</button>
            <button onClick={() => setIsAuthenticated(false)} className="bg-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] px-4 py-2 rounded-xl text-xs font-bold transition-all">Exit</button>
          </div>
        </div>

        <div className="stats-grid mb-8">
          <div className="premium-card card-stat">
            <div className="text-4xl mb-2">📅</div>
            <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wide mb-2">Date</p>
            <input
              type="date"
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white font-bold text-[#0F172A] focus:outline-none focus:ring-4 focus:ring-[#2563EB]/20 transition-all cursor-pointer text-sm w-full text-center"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="col-span-full flex justify-center py-10">
              <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="premium-card card-stat">
                <div className="text-4xl mb-2">👥</div>
                <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wide mb-1">Total Students</p>
                <p className="text-3xl font-black text-[#0F172A]">{allStudents.length}</p>
              </div>
              <div className="premium-card card-stat bg-[#DCFCE7] border-[#22C55E]/20">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-xs text-[#16A34A] font-semibold uppercase tracking-wide mb-1">Present</p>
                <p className="text-3xl font-black text-[#22C55E]">{allAttendance.length}</p>
              </div>
              <div className="premium-card card-stat bg-[#FEE2E2] border-[#EF4444]/20">
                <div className="text-4xl mb-2">❌</div>
                <p className="text-xs text-[#DC2626] font-semibold uppercase tracking-wide mb-1">Absent</p>
                <p className="text-3xl font-black text-[#EF4444]">{allStudents.length - allAttendance.length}</p>
              </div>
            </>
          )}
        </div>

        {!loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="premium-card" style={{ padding: '1.5rem' }}>
                <p className="text-sm font-bold text-[#22C55E] uppercase tracking-wide mb-4 text-center">✨ Top Early Birds</p>
                <div className="space-y-2">
                  {top3.length > 0 ? top3.map((a, i) => (
                    <div key={i} className="bg-[#F1F5F9] p-3 rounded-xl flex justify-between items-center">
                      <p className="text-sm font-bold text-[#0F172A] truncate">{a.students?.name}</p>
                      <p className="text-sm font-bold text-[#22C55E] tabular-nums">{new Date(a.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  )) : <p className="text-sm text-[#94A3B8] italic text-center py-2">Waiting...</p>}
                </div>
              </div>
              <div className="premium-card" style={{ padding: '1.5rem' }}>
                <p className="text-sm font-bold text-[#F59E0B] uppercase tracking-wide mb-4 text-center">⏰ Last Arrivals</p>
                <div className="space-y-2">
                  {last3.length > 0 ? last3.map((a, i) => (
                    <div key={i} className="bg-[#F1F5F9] p-3 rounded-xl flex justify-between items-center">
                      <p className="text-sm font-bold text-[#0F172A] truncate">{a.students?.name}</p>
                      <p className="text-sm font-bold text-[#F59E0B] tabular-nums">{new Date(a.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  )) : <p className="text-sm text-[#94A3B8] italic text-center py-2">Waiting...</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search student..."
                  className="w-full px-6 py-4 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-[#2563EB]/20 font-semibold transition-all placeholder:text-[#94A3B8] text-[#0F172A] text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[#94A3B8] text-lg">🔍</span>
              </div>
              {searchQuery && (
                <div className="premium-card max-h-60 overflow-y-auto" style={{ padding: 0 }}>
                  {filteredSearch.length > 0 ? (
                    filteredSearch.map((a, i) => (
                      <div key={i} className="flex justify-between items-center p-4 border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] transition-colors">
                        <div>
                          <p className="font-bold text-[#0F172A] text-sm mb-1">{a.students?.name}</p>
                          <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wide">{a.students?.batch}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#22C55E] tabular-nums text-sm">{new Date(a.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="text-xs font-bold text-[#64748B] mt-0.5">Rank #{a.rank_today}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="p-6 text-center text-[#94A3B8] font-semibold text-sm">No records found</p>
                  )}
                </div>
              )}
            </div>

            <div className="premium-card" style={{ padding: '0' }}>
              <div className="p-4 bg-[#F1F5F9] border-b border-[#E2E8F0]">
                <h2 className="font-bold text-[#0F172A] uppercase text-xs tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
                  <span>Recent Timeline</span>
                </h2>
              </div>
              <table className="w-full">
                <thead className="bg-[#F8FAFC] text-[#64748B] uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4 text-left">Student</th>
                    <th className="px-6 py-4 text-right">Check-in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {timeline10.length > 0 ? timeline10.map((item, i) => (
                    <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#0F172A] text-sm mb-0.5">{item.students?.name}</p>
                        <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wide">{item.students?.batch}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-[#22C55E] tabular-nums text-sm">
                        {new Date(item.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={2} className="px-6 py-10 text-center text-[#94A3B8] font-semibold text-sm">No data yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
