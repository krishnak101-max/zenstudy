
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient.ts';
import {
  calculatePoints,
  getMedal,
  getFormattedDate,
  getYesterdayDate,
  getRandomStudyQuote,
  getOrdinal
} from '../logic/utils.ts';
import { Student, StudentStats, Attendance } from '../types.ts';

interface DashboardProps {
  studentId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ studentId }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [wokeBeforeCount, setWokeBeforeCount] = useState(0);

  const studyQuote = useMemo(() => getRandomStudyQuote(), []);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    const today = getFormattedDate();

    try {
      const { data: s, error: sErr } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (sErr || !s) {
        localStorage.removeItem('student_id');
        window.location.reload();
        return;
      }
      setStudent(s);

      const { data: st, error: stErr } = await supabase
        .from('student_stats')
        .select('*')
        .eq('student_id', studentId)
        .single();
      if (!stErr) setStats(st);

      const { data: att, error: attErr } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .eq('date', today)
        .maybeSingle();

      if (att) {
        setTodayAttendance(att);
        const { count: beforeCount } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('date', today)
          .lt('checkin_time', att.checkin_time);
        setWokeBeforeCount(beforeCount || 0);
      }

    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const markAttendance = async () => {
    if (todayAttendance || actionLoading) return;
    setActionLoading(true);

    const today = getFormattedDate();
    const yesterday = getYesterdayDate();

    try {
      const { data: newAtt, error: insErr } = await supabase
        .from('attendance')
        .insert([{ student_id: studentId, date: today }])
        .select()
        .single();

      if (insErr) throw insErr;

      const { count: beforeCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)
        .lt('checkin_time', newAtt.checkin_time);

      const rank = (beforeCount || 0) + 1;
      const points = calculatePoints(newAtt.checkin_time);

      const { data: updatedAtt, error: upAttErr } = await supabase
        .from('attendance')
        .update({ rank_today: rank, points })
        .eq('id', newAtt.id)
        .select()
        .single();

      if (upAttErr) throw upAttErr;
      setTodayAttendance(updatedAtt);
      setWokeBeforeCount(beforeCount || 0);

      let newStreak = 1;
      if (stats?.last_checkin_date === yesterday) {
        newStreak = (stats.current_streak || 0) + 1;
      }

      const { data: newStats, error: statUpErr } = await supabase
        .from('student_stats')
        .update({
          total_points: (stats?.total_points || 0) + points,
          current_streak: newStreak,
          best_streak: Math.max(newStreak, stats?.best_streak || 0),
          last_checkin_date: today,
          medal_level: getMedal(newStreak)
        })
        .eq('student_id', studentId)
        .select()
        .single();

      if (statUpErr) throw statUpErr;
      setStats(newStats);

    } catch (err: any) {
      alert(err.message || 'Error marking attendance');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 zen-gradient rounded-full animate-ping opacity-25"></div>
          <div className="relative w-full h-full zen-gradient rounded-[2rem] flex items-center justify-center text-4xl shadow-xl shadow-indigo-200">🦅</div>
        </div>
        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] animate-pulse">Synchronizing Presence...</p>
      </div>
    );
  }

  const medalLevel = stats?.medal_level || 'Seeker';
  const medalClass = `medal-${medalLevel.toLowerCase()}`;

  return (
    <div className="p-6 pt-12">
      <div className="flex justify-between items-start mb-10">
        <div>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1.5">Wings Seeker</p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">{student?.name}</h1>
          <p className="text-[11px] font-bold text-gray-400 mt-2 uppercase tracking-widest bg-gray-50 inline-block px-2 py-1 rounded-lg">{student?.batch} Batch</p>
        </div>
        <div className={`${medalClass} text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex flex-col items-center justify-center min-w-[110px] transition-all transform hover:scale-105 active:scale-95 cursor-default`}>
          <span className="mb-1 opacity-70 text-[8px]">Daily Rank</span>
          <span className="flex items-center space-x-1 text-xs">
            <span>{medalLevel === 'Seeker' ? '🌱' : medalLevel === 'Bronze' ? '🥉' : medalLevel === 'Silver' ? '🥈' : medalLevel === 'Gold' ? '🥇' : '🏆'}</span>
            <span>{medalLevel}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="glass-card p-6 rounded-[2.5rem] shadow-sm relative overflow-hidden group border-indigo-50">
          <div className="absolute -right-4 -bottom-4 text-7xl opacity-[0.04] rotate-12 group-hover:rotate-0 transition-transform duration-700">💎</div>
          <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-2">Power Points</p>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">{stats?.total_points || 0}</p>
        </div>
        <div className="glass-card p-6 rounded-[2.5rem] shadow-sm relative overflow-hidden group border-indigo-50">
          <div className="absolute -right-4 -bottom-4 text-7xl opacity-[0.04] rotate-12 group-hover:rotate-0 transition-transform duration-700">🔥</div>
          <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-2">Consistency</p>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">{stats?.current_streak || 0} <span className="text-[10px] text-indigo-400 font-black uppercase ml-1">Days</span></p>
        </div>
      </div>

      <div className="mb-12">
        {!todayAttendance ? (
          <div className="space-y-6">
            <button
              onClick={markAttendance}
              disabled={actionLoading}
              className="w-full zen-gradient text-white h-60 rounded-[3.5rem] shadow-2xl shadow-indigo-200 flex flex-col items-center justify-center transition-all active:scale-[0.96] group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
              {actionLoading ? (
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Sealing Presence...</span>
                </div>
              ) : (
                <>
                  <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center text-6xl mb-5 group-hover:scale-110 transition-transform duration-1000 shadow-inner">☀️</div>
                  <span className="text-2xl font-black uppercase tracking-tighter italic">I Am Awake</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] mt-4 opacity-70">Claim Your Focus</span>
                </>
              )}
            </button>
            <div className="flex items-center justify-center space-x-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
              <span className="w-8 h-[1px] bg-gray-100"></span>
              <span>Morning Ritual</span>
              <span className="w-8 h-[1px] bg-gray-100"></span>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="glass-card border-indigo-100 rounded-[3.5rem] p-10 text-center relative overflow-hidden shadow-2xl shadow-indigo-100/40">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <span className="text-[12rem]">🦉</span>
              </div>

              <div className="text-7xl mb-6 transform hover:scale-110 transition-transform duration-700">🏆</div>
              <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tighter">Rank: {getOrdinal(todayAttendance.rank_today)}</h2>

              <div className="mb-8">
                <p className="text-indigo-600 font-black bg-indigo-50 py-2 px-5 rounded-full inline-block text-[10px] uppercase tracking-widest border border-indigo-100 shadow-sm">
                  Woke before {wokeBeforeCount} {wokeBeforeCount === 1 ? 'seeker' : 'seekers'}
                </p>
              </div>

              {todayAttendance.rank_today <= 5 && (
                <div className="mb-8 animate-bounce">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                    Top 5 Early Bird!
                  </p>
                  <p className="text-[8px] text-gray-400 font-medium uppercase tracking-widest mt-1">
                    You set the pace today
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/90 rounded-3xl p-6 shadow-sm border border-indigo-50">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Energy</p>
                  <p className="text-2xl font-black text-indigo-600">+{todayAttendance.points}</p>
                </div>
                <div className="bg-white/90 rounded-3xl p-6 shadow-sm border border-indigo-50">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Time</p>
                  <p className="text-2xl font-black text-indigo-600">{new Date(todayAttendance.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-indigo-50">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Focus Status</p>
                <p className="text-xl font-black text-gray-800 uppercase tracking-tighter flex items-center justify-center space-x-2">
                  <span>{medalLevel === 'Seeker' ? '🌱' : medalLevel === 'Bronze' ? '🥉' : medalLevel === 'Silver' ? '🥈' : medalLevel === 'Gold' ? '🥇' : '🏆'}</span>
                  <span>{medalLevel} Badge Active</span>
                </p>
              </div>
            </div>

            <div className="bg-amber-50/40 border border-amber-100 rounded-3xl p-7 text-center shadow-sm relative group overflow-hidden glass-card">
              <div className="absolute -left-4 -top-4 text-7xl opacity-[0.06] group-hover:scale-110 transition-transform duration-1000">💡</div>
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-[0.3em] mb-4">Zen Wisdom</p>
              <p className="text-sm font-bold text-amber-900 italic leading-relaxed px-6">
                "{studyQuote}"
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card p-8 rounded-[3rem] shadow-sm border-gray-100 mb-6">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-black text-gray-900 text-[11px] uppercase tracking-widest">Ascension path</h3>
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg">Best: {stats?.best_streak || 0}D</span>
        </div>
        <div className="flex justify-between relative px-2">
          {[3, 7, 15, 30].map((milestone) => {
            const isReached = (stats?.current_streak || 0) >= milestone;
            const milestoneMedal = milestone === 3 ? 'bronze' : milestone === 7 ? 'silver' : milestone === 15 ? 'gold' : 'champion';

            return (
              <div key={milestone} className="flex flex-col items-center z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-xl transition-all duration-1000 transform ${isReached ? `medal-${milestoneMedal} text-white scale-110 rotate-3` : 'bg-white text-gray-200 border border-gray-100 opacity-30'}`}>
                  {milestone === 3 && '🥉'}
                  {milestone === 7 && '🥈'}
                  {milestone === 15 && '🥇'}
                  {milestone === 30 && '🏆'}
                </div>
                <span className={`text-[10px] mt-4 font-black uppercase tracking-widest transition-colors duration-1000 ${isReached ? 'text-gray-900' : 'text-gray-300'}`}>{milestone}D</span>
              </div>
            );
          })}
          <div className="absolute top-7 left-0 right-0 h-1.5 bg-gray-50 -z-0 rounded-full mx-6"></div>
          <div
            className="absolute top-7 left-0 h-1.5 zen-gradient -z-0 transition-all duration-1000 rounded-full mx-6 shadow-sm"
            style={{ width: `calc(${Math.min(100, (stats?.current_streak || 0) / 30 * 100)}% - 48px)` }}
          ></div>
        </div>
        <p className="mt-10 text-center text-[9px] font-black text-indigo-300 uppercase tracking-[0.3em] italic opacity-50">Consistency is the fuel of ZenStudy</p>
      </div>
    </div >
  );
};

export default Dashboard;
