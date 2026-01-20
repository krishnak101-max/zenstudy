import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.ts';
import { Student, Attendance, StudentStats } from '../types.ts';

interface DashboardProps {
  studentId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ studentId }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [wokeBeforeCount, setWokeBeforeCount] = useState<number>(0);
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

  const getFormattedDate = (date: Date = new Date()): string => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const today = getFormattedDate();

      // 1. Fetch Student Details
      const { data: std, error: stdErr } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (stdErr) throw stdErr;
      setStudent(std);

      // 2. Fetch Today's Attendance
      const { data: att, error: attErr } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .eq('date', today)
        .maybeSingle();

      if (attErr) throw attErr;
      setTodayAttendance(att);

      // 3. Fetch Stats
      const { data: st, error: stErr } = await supabase
        .from('student_stats')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (stErr && stErr.code !== 'PGRST116') throw stErr; // Ignore no rows error
      setStats(st);

      // 4. Fetch 'Woke Before' count (if attended)
      if (att) {
        const { count, error: countErr } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('date', today)
          .gt('rank_today', att.rank_today);

        if (!countErr) setWokeBeforeCount(count || 0);
      }

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async () => {
    if (todayAttendance || actionLoading) return;
    setActionLoading(true);
    try {
      const now = new Date();
      const today = getFormattedDate();

      const { data: newAtt, error } = await supabase
        .from('attendance')
        .insert([{
          student_id: studentId,
          date: today,
          checkin_time: now.toISOString(),
          points: 10,
        }])
        .select()
        .single();

      if (error) throw error;
      setTodayAttendance(newAtt);

      // Update stats locally or refetch
      fetchInitialData();

    } catch (error: any) {
      alert('Error marking attendance: ' + error.message);
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
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
          <div className="relative w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] flex items-center justify-center text-4xl shadow-xl shadow-emerald-500/30">🦅</div>
        </div>
        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] animate-pulse">Synchronizing Presence...</p>
      </div>
    );
  }

  const medalLevel = stats?.medal_level || 'Seeker';
  const medalClass = `medal-${medalLevel.toLowerCase()}`;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pt-6 pb-20 text-white animate-in fade-in duration-700">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 animate-in slide-in-from-left-4 duration-500">Wings Seeker</p>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none animate-in slide-in-from-left-4 duration-700 delay-100">{student?.name}</h1>
          <p className="text-[11px] font-bold text-emerald-200 mt-2 uppercase tracking-widest bg-white/10 inline-block px-2 py-1 rounded-lg border border-white/10 animate-in zoom-in duration-500 delay-200">{student?.batch} Batch</p>
        </div>
        <div className={`${medalClass} text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex flex-col items-center justify-center min-w-[110px] transition-all transform hover:scale-105 active:scale-95 cursor-default border border-white/20 animate-in slide-in-from-right-4 duration-700`}>
          <span className="mb-1 opacity-90 text-[8px]">Daily Rank</span>
          <span className="flex items-center space-x-1 text-xs">
            <span>{medalLevel === 'Seeker' ? '🌱' : medalLevel === 'Bronze' ? '🥉' : medalLevel === 'Silver' ? '🥈' : medalLevel === 'Gold' ? '🥇' : '🏆'}</span>
            <span>{medalLevel}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-emerald-900/20 backdrop-blur-md p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group border border-emerald-500/30 transition-all hover:bg-emerald-900/30 hover:border-emerald-500/50 animate-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="absolute -right-4 -bottom-4 text-7xl opacity-[0.1] rotate-12 group-hover:rotate-0 transition-transform duration-700 grayscale hover:grayscale-0">💎</div>
          <p className="text-[9px] text-emerald-200 font-black uppercase tracking-widest mb-2">Power Points</p>
          <p className="text-4xl font-black text-white tracking-tighter">{stats?.total_points || 0}</p>
        </div>
        <div className="bg-emerald-900/20 backdrop-blur-md p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group border border-emerald-500/30 transition-all hover:bg-emerald-900/30 hover:border-emerald-500/50 animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="absolute -right-4 -bottom-4 text-7xl opacity-[0.1] rotate-12 group-hover:rotate-0 transition-transform duration-700 grayscale hover:grayscale-0">🔥</div>
          <p className="text-[9px] text-emerald-200 font-black uppercase tracking-widest mb-2">Consistency</p>
          <p className="text-4xl font-black text-white tracking-tighter">{stats?.current_streak || 0} <span className="text-[10px] text-emerald-400 font-black uppercase ml-1">Days</span></p>
        </div>
      </div>

      <div className="mb-12">
        {!todayAttendance ? (
          <div className="space-y-6 animate-in zoom-in duration-700 delay-300">
            <button
              onClick={markAttendance}
              disabled={actionLoading}
              className="w-full bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white h-60 rounded-[3.5rem] shadow-2xl shadow-emerald-900/50 flex flex-col items-center justify-center transition-all active:scale-[0.96] group relative overflow-hidden border border-white/20 hover:shadow-emerald-500/50 duration-500"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
              {actionLoading ? (
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Sealing Presence...</span>
                </div>
              ) : (
                <>
                  <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center text-6xl mb-5 group-hover:scale-110 transition-transform duration-1000 shadow-inner backdrop-blur-sm">☀️</div>
                  <span className="text-2xl font-black uppercase tracking-tighter italic drop-shadow-lg">I Am Awake</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] mt-4 opacity-70">Claim Your Focus</span>
                </>
              )}
            </button>
            <div className="flex items-center justify-center space-x-2 text-[10px] font-black text-emerald-300 uppercase tracking-widest opacity-60">
              <span className="w-8 h-[1px] bg-emerald-300/30"></span>
              <span>Morning Ritual</span>
              <span className="w-8 h-[1px] bg-emerald-300/30"></span>
            </div>
          </div>
        ) : (
          <div className="space-y-5 animate-in slide-in-from-bottom-8 duration-700">
            <div className="bg-black/30 backdrop-blur-xl border border-emerald-500/20 rounded-[3.5rem] p-10 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <span className="text-[12rem]">🦉</span>
              </div>

              <div className="text-7xl mb-6 transform hover:scale-110 transition-transform duration-700 drop-shadow-2xl">🏆</div>
              <h2 className="text-4xl font-black text-white mb-3 tracking-tighter">Rank: {getOrdinal(todayAttendance.rank_today)}</h2>

              <div className="mb-8">
                <p className="text-emerald-200 font-black bg-white/5 py-2 px-5 rounded-full inline-block text-[10px] uppercase tracking-widest border border-white/10 shadow-sm">
                  Woke before {wokeBeforeCount} {wokeBeforeCount === 1 ? 'seeker' : 'seekers'}
                </p>
              </div>

              {todayAttendance.rank_today <= 5 && (
                <div className="mb-8 animate-bounce">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest drop-shadow-sm">
                    Top 5 Early Bird!
                  </p>
                  <p className="text-[8px] text-emerald-200 font-medium uppercase tracking-widest mt-1">
                    You set the pace today
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-emerald-900/40 rounded-3xl p-6 shadow-inner border border-emerald-500/20">
                  <p className="text-[10px] text-emerald-300 font-black uppercase tracking-widest mb-1.5">Energy</p>
                  <p className="text-2xl font-black text-white">+{todayAttendance.points}</p>
                </div>
                <div className="bg-emerald-900/40 rounded-3xl p-6 shadow-inner border border-emerald-500/20">
                  <p className="text-[10px] text-emerald-300 font-black uppercase tracking-widest mb-1.5">Time</p>
                  <p className="text-2xl font-black text-white">{new Date(todayAttendance.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-2">Focus Status</p>
                <p className="text-xl font-black text-white uppercase tracking-tighter flex items-center justify-center space-x-2">
                  <span>{medalLevel === 'Seeker' ? '🌱' : medalLevel === 'Bronze' ? '🥉' : medalLevel === 'Silver' ? '🥈' : medalLevel === 'Gold' ? '🥇' : '🏆'}</span>
                  <span>{medalLevel} Badge Active</span>
                </p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-7 text-center shadow-lg relative group overflow-hidden backdrop-blur-md animate-in slide-in-from-bottom-4 duration-700 delay-100">
              <div className="absolute -left-4 -top-4 text-7xl opacity-[0.06] group-hover:scale-110 transition-transform duration-1000 text-amber-500">💡</div>
              <p className="text-[9px] font-black text-amber-400 uppercase tracking-[0.3em] mb-4">Zen Wisdom</p>
              <p className="text-sm font-bold text-amber-100 italic leading-relaxed px-6">
                "{studyQuote}"
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-black/20 backdrop-blur-xl p-8 rounded-[3rem] shadow-lg border border-white/10 mb-6 animate-in slide-in-from-bottom-4 duration-700 delay-300">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-black text-white text-[11px] uppercase tracking-widest">Ascension path</h3>
          <span className="text-[10px] font-black text-emerald-200 uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">Best: {stats?.best_streak || 0}D</span>
        </div>
        <div className="flex justify-between relative px-2">
          {[3, 7, 15, 30].map((milestone) => {
            const isReached = (stats?.current_streak || 0) >= milestone;
            const milestoneMedal = milestone === 3 ? 'bronze' : milestone === 7 ? 'silver' : milestone === 15 ? 'gold' : 'champion';

            return (
              <div key={milestone} className="flex flex-col items-center z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-xl transition-all duration-1000 transform ${isReached ? `medal-${milestoneMedal} text-white scale-110 rotate-3 border-2 border-white/50` : 'bg-white/5 text-white/20 border border-white/10'}`}>
                  {milestone === 3 && '🥉'}
                  {milestone === 7 && '🥈'}
                  {milestone === 15 && '🥇'}
                  {milestone === 30 && '🏆'}
                </div>
                <span className={`text-[10px] mt-4 font-black uppercase tracking-widest transition-colors duration-1000 ${isReached ? 'text-white' : 'text-white/20'}`}>{milestone}D</span>
              </div>
            );
          })}
          <div className="absolute top-7 left-0 right-0 h-1.5 bg-white/5 -z-0 rounded-full mx-6"></div>
          <div
            className="absolute top-7 left-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 -z-0 transition-all duration-1000 rounded-full mx-6 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            style={{ width: `calc(${Math.min(100, (stats?.current_streak || 0) / 30 * 100)}% - 48px)` }}
          ></div>
        </div>
        <p className="mt-10 text-center text-[9px] font-black text-emerald-400/50 uppercase tracking-[0.3em] italic">Consistency is the fuel of ZenStudy</p>
      </div>
    </div>
  );
};

export default Dashboard;
