
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.ts';
import { getFormattedDate } from '../logic/utils.ts';
import { LeaderboardEntry } from '../types.ts';

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const today = getFormattedDate();

      try {
        const { data, error } = await supabase
          .from('attendance')
          .select(`
            id,
            checkin_time,
            points,
            rank_today,
            students (
              name,
              batch
            )
          `)
          .eq('date', today)
          .order('rank_today', { ascending: true })
          .limit(10);

        if (error) throw error;
        setEntries((data as any[]) || []);
      } catch (err) {
        console.error("Leaderboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="p-6 pt-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2 italic">Morning Titans 🏆</h1>
        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] bg-indigo-50 inline-block px-4 py-1.5 rounded-full">Top 10 Elite Today</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-12 w-12 border-[4px] border-indigo-600 border-t-transparent rounded-full shadow-xl shadow-indigo-100"></div>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-24 glass-card rounded-[3.5rem] border-white shadow-xl">
          <div className="text-7xl mb-8 animate-pulse">🌌</div>
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">The arena is quiet</p>
          <p className="text-xs font-bold text-gray-300 mt-3 px-10">Will you be the first titan to rise tomorrow?</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, index) => {
            const isTop3 = index < 3;
            const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

            return (
              <div 
                key={entry.id} 
                className={`flex items-center p-6 rounded-[2.5rem] border transition-all transform hover:scale-[1.02] active:scale-95 duration-500 ${
                  isTop3 ? 'bg-indigo-50/40 border-indigo-100 shadow-xl shadow-indigo-100/10' : 'glass-card border-gray-100'
                }`}
              >
                <div className="w-14 text-center font-black text-gray-300 text-2xl flex items-center justify-center">
                  {rankEmoji || <span className="text-sm">#{entry.rank_today}</span>}
                </div>
                <div className="flex-1 ml-4">
                  <p className="font-black text-gray-900 tracking-tight text-lg leading-tight mb-1">{entry.students.name}</p>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest inline-block bg-gray-50 px-2 py-0.5 rounded">{entry.students.batch}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-indigo-600 tabular-nums">{new Date(entry.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1">+{entry.points} Power</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-16 p-10 glass-card rounded-[3.5rem] text-center border-indigo-50 shadow-sm">
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Want to see your name here?</p>
        <p className="text-sm font-bold text-gray-500 italic leading-relaxed px-4">
          "The morning breeze has secrets to tell you. Don't go back to sleep."
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;
