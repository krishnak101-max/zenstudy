
import React, { useState } from 'react';
import { supabase } from '../supabaseClient.ts';

interface SetupProps {
  onComplete: (id: string) => void;
}

const Setup: React.FC<SetupProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [batch, setBatch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !batch) {
      setError('Name and Batch are required to proceed.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Register student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert([{ name: name.trim(), batch }])
        .select()
        .single();

      if (studentError) throw studentError;

      // 2. Initialize stats
      const { error: statsError } = await supabase
        .from('student_stats')
        .insert([{
          student_id: student.id,
          total_points: 0,
          current_streak: 0,
          best_streak: 0,
          medal_level: 'Seeker'
        }]);

      if (statsError) throw statsError;

      onComplete(student.id);
    } catch (err: any) {
      console.error("Setup Error:", err);
      setError(err.message || 'Initialization failed. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 pt-20 flex flex-col items-center justify-center min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="mb-10 text-center relative z-10">
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[2rem] mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-indigo-500/50 animate-[bounce_3s_infinite]">
          <span className="text-5xl drop-shadow-lg">🦅</span>
        </div>
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400 mb-2 tracking-tighter drop-shadow-sm">ZenStudy</h1>
        <p className="text-indigo-200 font-bold text-xs uppercase tracking-[0.3em]">
          Wings <span className="text-white">Karakunnu</span> Edition
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6 bg-white/10 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border border-white/20 relative z-10">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest ml-2">Display Identity</label>
          <input
            type="text"
            className="w-full px-6 py-5 rounded-2xl border border-white/10 bg-white/5 focus:bg-white/20 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all font-black text-white placeholder:text-white/30 tracking-wider text-lg"
            placeholder="YOUR FULL NAME"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            disabled={loading}
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Current Batch</label>
          <div className="relative">
            <select
              className="w-full px-6 py-5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-gray-800 appearance-none cursor-pointer"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              disabled={loading}
            >
              <option value="" disabled>Select your batch</option>
              <option value="S1">S1 Batch</option>
              <option value="S2">S2 Batch</option>
              <option value="S3">S3 Batch</option>
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              ▼
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[11px] font-black border border-red-100 uppercase tracking-tight text-center">
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full zen-gradient text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 transition-all transform active:scale-95 flex justify-center items-center text-lg mt-4 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span className="text-sm uppercase tracking-widest">Verifying...</span>
            </div>
          ) : 'Enter Zen Zone'}
        </button>
      </form>

      <div className="mt-16 text-center">
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">Rise Above the Rest</p>
      </div>
    </div>
  );
};

export default Setup;
