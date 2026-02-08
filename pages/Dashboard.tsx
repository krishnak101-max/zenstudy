import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.ts';
import { Student, Attendance, StudentStats } from '../types.ts';
import { getFormattedDate, calculatePoints } from '../logic/utils.ts';
import { updateStudentStats } from '../logic/statsUpdater.ts';
import ExamReminder from '../components/ExamReminder.tsx';

interface DashboardProps {
  studentId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ studentId }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [totalAwakeCount, setTotalAwakeCount] = useState<number>(0);
  const [studyQuote, setStudyQuote] = useState<string>("");

  const quotes = [
    "The early morning has gold in its mouth.",
    "Focus is the key to all power.",
    "Your future is created by what you do today, not tomorrow.",
    "Discipline is freedom.",
    "Small daily improvements are the key to staggering long-term results.",
    "The sun has not caught me in bed in fifty years.",
    "Lose an hour in the morning, and you will spend all day looking for it."
  ];

  useEffect(() => {
    fetchInitialData();
    setStudyQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, [studentId]);


  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const today = getFormattedDate();

      const { data: std, error: stdErr } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .maybeSingle();

      if (stdErr) throw stdErr;
      if (!std) {
        alert('Student not found. Please register again.');
        window.location.reload();
        return;
      }
      setStudent(std);

      const { data: att, error: attErr } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .eq('date', today)
        .maybeSingle();

      if (attErr) throw attErr;
      setTodayAttendance(att);

      const { data: st, error: stErr } = await supabase
        .from('student_stats')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (stErr && stErr.code !== 'PGRST116') throw stErr;
      setStats(st);

      if (att) {

      } else {
        // If not marked, get total count of students awake today for motivation
        const { count, error: countErr } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('date', today);

        if (!countErr) setTotalAwakeCount(count || 0);
      }

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async () => {
    if (todayAttendance || actionLoading) return;

    const now = new Date();
    const currentHour = now.getHours();
    if (currentHour >= 0 && currentHour < 3) {
      alert('🌙 Time to Rest & Recharge! 😴\n\n📚 Great minds need great rest!\n\nAttendance is restricted between 12 AM - 3 AM.\n\n💤 Take proper rest now\n🌅 Wake up fresh at 3 AM\n⚡ Restart your studies with renewed energy\n\n"Success is the sum of small efforts repeated day in and day out."\n\nYour health = Your wealth! 💚✨');
      return;
    }

    setActionLoading(true);
    try {
      const today = getFormattedDate();
      const points = calculatePoints(now.toISOString());

      const { data: newAtt, error } = await supabase
        .from('attendance')
        .insert([{
          student_id: studentId,
          date: today,
          checkin_time: now.toISOString(),
          points: points,
        }])
        .select()
        .single();

      if (error) throw error;

      // Update stats (points, streak, medal)
      await updateStudentStats(studentId, points, today);

      setTodayAttendance(newAtt);
      fetchInitialData();

    } catch (error: any) {
      if (error.code === '23505' || error.status === 409) {
        // Attendance already marked (conflict), refreshing locally
        await fetchInitialData();
      } else {
        alert('Error marking attendance: ' + error.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-[#2563EB] rounded-full animate-ping opacity-20"></div>
          <div className="relative w-full h-full bg-gradient-to-br from-[#2563EB] to-[#06B6D4] rounded-2xl flex items-center justify-center text-4xl shadow-xl">🦅</div>
        </div>
        <p className="text-xs font-bold text-[#2563EB] uppercase tracking-wider animate-pulse">Loading Dashboard...</p>
      </div>
    );
  }

  const medalLevel = stats?.medal_level || 'Seeker';
  const getRankBadge = (rank: number | undefined) => {
    if (!rank) return { label: 'Not Yet', color: 'text-gray-400', bg: 'bg-gray-100' };
    if (rank === 1) return { label: '1st Place 🏆', color: 'text-amber-600', bg: 'bg-amber-50' };
    if (rank <= 3) return { label: `${getOrdinal(rank)} - Top 3 🥇`, color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (rank <= 5) return { label: `${getOrdinal(rank)} - Top 5 🥈`, color: 'text-cyan-600', bg: 'bg-cyan-50' };
    if (rank <= 10) return { label: `${getOrdinal(rank)} - Top 10 🥉`, color: 'text-teal-600', bg: 'bg-teal-50' };
    return { label: `${getOrdinal(rank)}`, color: 'text-gray-600', bg: 'bg-gray-50' };
  };

  const rankBadge = getRankBadge(todayAttendance?.rank_today);

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] px-4 sm:px-6 lg:px-8 pt-6 pb-24">
      <div className="max-w-[1280px] mx-auto">
        {/* Header Section */}
        <div className="mb-8 fade-in">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">Wings Student</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">{student?.name}</h1>
              <span className="inline-block mt-2 px-3 py-1 bg-[#DBEAFE] text-[#1D4ED8] text-xs font-bold uppercase tracking-wide rounded-full">
                {student?.batch} Batch
              </span>
            </div>
            <div className={`${rankBadge.bg} ${rankBadge.color} px-4 py-3 rounded-xl text-sm font-bold text-center min-w-[120px] shadow-sm`}>
              <div className="text-xs opacity-70 mb-0.5">Today's Rank</div>
              <div>{rankBadge.label}</div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Responsive */}
        <div className="stats-grid mb-8 slide-up">
          <div className="premium-card card-stat">
            <div className="text-5xl mb-2">💎</div>
            <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wide mb-1">Total Points</p>
            <p className="text-3xl font-black text-[#0F172A]">{stats?.total_points || 0}</p>
          </div>
          <div className="premium-card card-stat">
            <div className="text-5xl mb-2">🔥</div>
            <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wide mb-1">Streak</p>
            <p className="text-3xl font-black text-[#0F172A]">{stats?.current_streak || 0} <span className="text-sm text-[#22C55E]">Days</span></p>
          </div>
          <div className="premium-card card-stat">
            <div className="text-5xl mb-2">🏅</div>
            <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wide mb-1">Best Streak</p>
            <p className="text-3xl font-black text-[#0F172A]">{stats?.best_streak || 0} <span className="text-sm text-[#A3E635]">Days</span></p>
          </div>
          <div className="premium-card card-stat">
            <div className="text-5xl mb-2">⭐</div>
            <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wide mb-1">Medal Level</p>
            <p className="text-xl font-black text-[#0F172A]">{medalLevel}</p>
          </div>
        </div>

        {/* Attendance Action */}
        <div className="mb-8">
          {!todayAttendance ? (
            <div className="slide-up">
              {new Date().getHours() >= 0 && new Date().getHours() < 3 ? (
                <div className="premium-card p-8 text-center border-amber-200 bg-amber-50">
                  <div className="text-6xl mb-4">😴</div>
                  <h2 className="text-2xl font-black text-amber-800 mb-2">Rest & Recharge</h2>
                  <p className="text-amber-700 font-medium mb-4">
                    Great minds take proper rest! Attendance opens at 3:00 AM.
                  </p>
                  <button disabled className="btn bg-amber-200 text-amber-800 font-bold opacity-50 cursor-not-allowed w-full rounded-xl py-3 border border-amber-300">
                    Sleep Well 🌙
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <p className="text-sm font-bold text-[#64748B] uppercase tracking-wide">
                      {totalAwakeCount > 0 ? `Join ${totalAwakeCount} Early Birds` : 'Be the First to Rise!'}
                    </p>
                  </div>
                  <button
                    onClick={markAttendance}
                    disabled={actionLoading}
                    className="btn btn-primary btn-lg btn-full gradient-header hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    style={{ minHeight: '200px', borderRadius: '24px' }}
                  >
                    {actionLoading ? (
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
                        <span className="text-sm font-bold uppercase tracking-wider">Taking Flight...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-6xl mb-4 backdrop-blur-sm">☀️</div>
                        <span className="text-2xl font-black uppercase tracking-tight">Wings Up</span>
                        <span className="text-xs font-semibold uppercase tracking-widest mt-3 opacity-80">Take Flight Today</span>
                      </div>
                    )}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="slide-up">
              <div className="premium-card" style={{ borderRadius: '24px', padding: '2rem' }}>
                <div className="text-center mb-6">
                  <div className="text-7xl mb-4">✅</div>
                  <h2 className="text-3xl font-black text-[#0F172A] mb-2">
                    Wings Up Successful!
                  </h2>
                  <p className="text-sm text-[#64748B] font-medium">
                    {todayAttendance.rank_today - 1} {todayAttendance.rank_today - 1 === 1 ? 'student' : 'students'} started before you today
                  </p>
                </div>

                {todayAttendance.rank_today <= 10 && (
                  <div className={`mb-6 p-4 rounded-2xl text-center relative overflow-hidden animate-pop ${todayAttendance.rank_today <= 3 ? 'gradient-streak shadow-lg animate-float' : 'bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200'}`}>
                    {todayAttendance.rank_today <= 3 && <div className="absolute inset-0 animate-shimmer"></div>}
                    <div className="text-3xl mb-2 relative z-10">{todayAttendance.rank_today <= 3 ? '🏆' : '🌟'}</div>
                    <p className={`text-sm font-bold uppercase tracking-wide relative z-10 ${todayAttendance.rank_today <= 3 ? 'text-white' : 'text-amber-800'}`}>
                      {todayAttendance.rank_today <= 3 ? `Top ${todayAttendance.rank_today} Elite!` : 'Top 10 Achiever!'}
                    </p>
                    <p className={`text-xs mt-1 relative z-10 ${todayAttendance.rank_today <= 3 ? 'text-white/90' : 'text-amber-700'}`}>
                      {todayAttendance.rank_today === 1 ? 'You are leading the pack!' : 'Outstanding dedication!'}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#DCFCE7] rounded-2xl p-4 text-center border border-[#22C55E]/20">
                    <p className="text-xs text-[#16A34A] font-semibold uppercase tracking-wide mb-1">Points Earned</p>
                    <p className="text-2xl font-black text-[#0F172A]">+{todayAttendance.points}</p>
                  </div>
                  <div className="bg-[#DBEAFE] rounded-2xl p-4 text-center border border-[#2563EB]/20">
                    <p className="text-xs text-[#1D4ED8] font-semibold uppercase tracking-wide mb-1">Wings Up Time</p>
                    <p className="text-2xl font-black text-[#0F172A]">
                      {new Date(todayAttendance.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] text-center">
                  <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wide mb-2">Badge Level</p>
                  <p className="text-lg font-black text-[#0F172A]">{medalLevel} ⭐</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Exam Reminder */}
        <ExamReminder />

        {/* Motivational Quote */}
        <div className="mb-8 slide-up">
          <div className="premium-card" style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #ECFCCB 100%)', border: 'none', padding: '1.5rem' }}>
            <div className="flex items-start gap-3">
              <div className="text-3xl">💡</div>
              <div>
                <p className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider mb-2">Daily Motivation</p>
                <p className="text-sm font-semibold text-[#0F172A] italic leading-relaxed">"{studyQuote}"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Streak Milestones */}
        <div className="premium-card slide-up" style={{ padding: '1.5rem' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[#0F172A] text-sm uppercase tracking-wide">Streak Progress</h3>
            <span className="text-xs font-bold text-[#64748B] bg-[#F1F5F9] px-3 py-1 rounded-full">Best: {stats?.best_streak || 0} Days</span>
          </div>
          <div className="flex justify-between items-center relative px-2">
            {[3, 7, 15, 30].map((milestone) => {
              const isReached = (stats?.current_streak || 0) >= milestone;
              return (
                <div key={milestone} className="flex flex-col items-center z-10">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold shadow-md transition-all ${isReached ? 'bg-gradient-to-br from-[#22C55E] to-[#A3E635] text-white scale-110' : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>
                    {milestone === 3 && '🥉'}
                    {milestone === 7 && '🥈'}
                    {milestone === 15 && '🥇'}
                    {milestone === 30 && '🏆'}
                  </div>
                  <span className={`text-xs mt-3 font-bold uppercase tracking-wide ${isReached ? 'text-[#22C55E]' : 'text-[#94A3B8]'}`}>{milestone}D</span>
                </div>
              );
            })}
            <div className="absolute top-7 left-0 right-0 h-2 bg-[#F1F5F9] -z-0 rounded-full mx-6"></div>
            <div
              className="absolute top-7 left-0 h-2 bg-gradient-to-r from-[#22C55E] to-[#A3E635] -z-0 transition-all duration-1000 rounded-full mx-6"
              style={{ width: `calc(${Math.min(100, (stats?.current_streak || 0) / 30 * 100)}% - 48px)` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
