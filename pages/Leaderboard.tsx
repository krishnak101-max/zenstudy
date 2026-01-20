import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.ts';
import { LeaderboardEntry } from '../types.ts';
import { getFormattedDate } from '../logic/utils.ts';

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const today = getFormattedDate();
        const { data, error } = await supabase
          .from('attendance')
          .select('*, students(name, batch)')
          .eq('date', today)
          .order('rank_today', { ascending: true })
          .limit(10);

        if (error) throw error;
        setEntries(data || []);
      } catch (err: any) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pt-6 pb-20 text-white animate-in fade-in duration-700">
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 tracking-tighter mb-2 italic drop-shadow-sm animate-in slide-in-from-top-4 duration-700">Morning Titans 🏆</h1>
        <p className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.3em] bg-white/10 inline-block px-4 py-1.5 rounded-full border border-white/10 animate-in slide-in-from-bottom-2 duration-500 delay-200">Top 10 Elite Today</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-12 w-12 border-[4px] border-emerald-500 border-t-transparent rounded-full shadow-2xl shadow-emerald-500/50"></div>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-24 bg-black/20 backdrop-blur-xl rounded-[3.5rem] border border-white/10 shadow-2xl animate-in zoom-in duration-500">
          <div className="text-7xl mb-8 animate-pulse grayscale opacity-50">🌌</div>
          <p className="text-[11px] font-black text-emerald-200 uppercase tracking-[0.2em]">The arena is quiet</p>
          <p className="text-xs font-bold text-white/40 mt-3 px-10">Will you be the first titan to rise tomorrow?</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, index) => {
            const isTop3 = index < 3;
            const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

            return (
              <div
                key={entry.id}
                className={`flex items-center p-6 rounded-[2.5rem] border transition-all transform hover:scale-[1.02] active:scale-95 duration-500 animate-in slide-in-from-bottom-4 ${isTop3 ? 'bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border-emerald-500/30 shadow-xl shadow-emerald-500/10' : 'bg-black/20 border-white/10 backdrop-blur-sm'
                  }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 text-center font-black text-white/20 text-2xl flex items-center justify-center">
                  {rankEmoji || <span className="text-sm">#{entry.rank_today}</span>}
                </div>
                <div className="flex-1 ml-4">
                  <p className="font-black text-white tracking-tight text-lg leading-tight mb-1">{entry.students.name}</p>
                  <p className="text-[10px] text-emerald-200 font-black uppercase tracking-widest inline-block bg-white/10 px-2 py-0.5 rounded border border-white/5">{entry.students.batch}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-emerald-400 tabular-nums drop-shadow-sm">{new Date(entry.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-1">+{entry.points} Power</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-16 p-10 bg-black/20 backdrop-blur-xl rounded-[3.5rem] text-center border border-white/10 shadow-lg relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700 delay-500">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 pointer-events-none"></div>
        <p className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em] mb-4 relative z-10">Want to see your name here?</p>
        <p className="text-sm font-bold text-white/60 italic leading-relaxed px-4 relative z-10">
          "The morning breeze has secrets to tell you. Don't go back to sleep."
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;
