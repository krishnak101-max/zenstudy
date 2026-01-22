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
    <div className="w-full min-h-screen bg-[#F8FAFC] px-4 sm:px-6 lg:px-8 pt-6 pb-24">
      <div className="max-w-[900px] mx-auto">
        {/* Header */}
        <div className="mb-8 text-center fade-in">
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-[#2563EB] to-[#06B6D4] bg-clip-text text-transparent mb-3">
            Today's Top Performers 🏆
          </h1>
          <span className="inline-block badge badge-primary text-xs px-4 py-2">
            Top 10 Early Birds
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="premium-card text-center py-16 slide-up">
            <div className="text-7xl mb-4 opacity-30">�</div>
            <p className="text-sm font-bold text-[#64748B] uppercase tracking-wide">No Attendance Yet</p>
            <p className="text-sm text-[#94A3B8] mt-2">Be the first to rise tomorrow!</p>
          </div>
        ) : (
          <div className="space-y-3 slide-up">
            {entries.map((entry, index) => {
              const isTop3 = index < 3;
              const rankColors = [
                { bg: 'bg-gradient-to-r from-amber-50 to-yellow-50', border: 'border-amber-300', text: 'text-amber-700', medal: '🥇' },
                { bg: 'bg-gradient-to-r from-gray-50 to-slate-50', border: 'border-gray-300', text: 'text-gray-700', medal: '🥈' },
                { bg: 'bg-gradient-to-r from-orange-50 to-amber-50', border: 'border-orange-300', text: 'text-orange-700', medal: '🥉' }
              ];
              const rankStyle = isTop3 ? rankColors[index] : { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-600', medal: null };

              return (
                <div
                  key={entry.id}
                  className={`premium-card clickable flex items-center gap-4 ${rankStyle.bg} border-2 ${rankStyle.border}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Rank Badge */}
                  <div className="flex-shrink-0 w-16 text-center">
                    {rankStyle.medal ? (
                      <span className="text-4xl">{rankStyle.medal}</span>
                    ) : (
                      <span className={`text-2xl font-black ${rankStyle.text}`}>#{entry.rank_today}</span>
                    )}
                  </div>

                  {/* Student Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-lg ${rankStyle.text} truncate`}>{entry.students.name}</p>
                    <span className="badge badge-success text-xs mt-1">{entry.students.batch}</span>
                  </div>

                  {/* Time & Points */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-lg font-black ${rankStyle.text} tabular-nums`}>
                      {new Date(entry.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-[#22C55E] font-bold mt-0.5">+{entry.points} pts</p>
                  </div>
                </div>
              );
            })}</div>
        )}

        {/* Motivational Footer */}
        <div className="mt-12 premium-card slide-up" style={{ background: 'linear-gradient(135deg, #ECFCCB 0%, #DCFCE7 100%)', border: 'none', padding: '1.5rem' }}>
          <div className="text-center">
            <p className="text-xs font-bold text-[#16A34A] uppercase tracking-wider mb-2">
              Want to see your name here?
            </p>
            <p className="text-sm font-semibold text-[#0F172A] italic">
              "The morning breeze has secrets to tell you. Don't go back to sleep."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
