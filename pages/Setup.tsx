
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
    <div className="p-10 pt-20 flex flex-col items-center justify-center min-h-screen">
      <div className="mb-10 text-center">
        <div className="w-24 h-24 zen-gradient rounded-[2rem] mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-indigo-200 animate-[bounce_3s_infinite]">
          <span className="text-5xl">🦅</span>
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">ZenStudy</h1>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
          Wings <span className="text-indigo-600">Karakunnu</span> Edition
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6 glass-card p-8 rounded-[3rem] shadow-2xl border-white">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Display Identity</label>
          <input
            type="text"
            className="w-full px-6 py-5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-gray-800 placeholder:text-gray-300"
            placeholder="Your Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
