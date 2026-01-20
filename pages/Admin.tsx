import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.ts';
import { generatePDF } from '../logic/pdfGenerator.ts'; // We'll create this helper
import { Student, Attendance } from '../types.ts';

const ADMIN_PASSWORD = 'tracker2026';

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchData();
    } else {
      alert('Invalid Password');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: stds, error: sErr } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (sErr) throw sErr;
      setStudents(stds || []);

      const { data: att, error: aErr } = await supabase
        .from('attendance')
        .select('*, students(name, batch)')
        .eq('date', selectedDate)
        .order('rank_today');

      if (aErr) throw aErr;
      setAttendanceData(att || []);

    } catch (err: any) {
      alert('Error fetching data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [selectedDate, isAuthenticated]);

  const generateWhatsappReview = () => {
    const totalStudents = students.length;
    const presentStudents = attendanceData.length;

    // Sort logic: Top 10 by rank, rest alphabetical
    const sortedAtt = [...attendanceData].sort((a, b) => a.rank_today - b.rank_today);

    let message = `*Wings morning attendance review ${selectedDate}*\n\n`;
    message += `Total students: ${totalStudents}\n`;
    message += `Present: ${presentStudents}\n`;
    message += `Absent: ${totalStudents - presentStudents}\n\n`;

    message += `*Toppers (Top 5)* 🏆\n`;
    sortedAtt.slice(0, 5).forEach(a => {
      const time = new Date(a.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      message += `#${a.rank_today} ${a.students.name} (${time})\n`;
    });

    message += `\n*Late Comers* ⏰\n`;
    sortedAtt.slice(5).forEach(a => {
      const time = new Date(a.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      message += `${a.students.name} (${time})\n`;
    });

    // Absentees
    const presentIds = attendanceData.map(a => a.student_id);
    const absentees = students.filter(s => !presentIds.includes(s.id));

    if (absentees.length > 0) {
      message += `\n*Absentees* ❌\n`;
      absentees.forEach(s => message += `${s.name}\n`);
    }

    navigator.clipboard.writeText(message);
    alert('Summary copied to clipboard!');
  };

  const downloadPDF = () => {
    generatePDF(attendanceData, students, selectedDate);
  };

  const resetAllData = async () => {
    if (!window.confirm("CRITICAL WARNING: This will DELETE ALL DATA (Students, Attendance, Stats). This cannot be undone. Are you absolutely sure?")) return;
    if (!window.confirm("Double Check: Type 'YES' to confirm reset?")) return; // Simplified for now

    try {
      const { error: e1 } = await supabase.from('attendance').delete().neq('id', 0); // Hack to delete all
      const { error: e2 } = await supabase.from('student_stats').delete().neq('id', 0);
      const { error: e3 } = await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      if (e1 || e2 || e3) throw new Error("Reset failed partially");

      alert("System Reset Complete. Reloading...");
      window.location.reload();
    } catch (err: any) {
      alert("Reset Failed: " + err.message);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10 w-full max-w-sm">
          <h2 className="text-2xl font-black mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Admin Portal</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Admin Access Key"
              className="w-full px-5 py-4 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/30">
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-12 text-white pb-32">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-black italic tracking-tighter">Admin Dashboard</h1>
        <button onClick={() => setIsAuthenticated(false)} className="text-xs font-bold text-red-300 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-colors">Logout</button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/5 backdrop-blur-md p-5 rounded-3xl border border-white/10">
          <p className="text-[10px] uppercase tracking-widest text-indigo-300 font-bold mb-1">Total Students</p>
          <p className="text-3xl font-black">{students.length}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-md p-5 rounded-3xl border border-white/10">
          <p className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold mb-1">Present Today</p>
          <p className="text-3xl font-black">{attendanceData.length}</p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-6 mb-8 overflow-hidden">
        <div className="flex flex-col space-y-4 mb-6">
          <label className="text-xs uppercase tracking-widest font-bold text-gray-400">Filter Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-500"
          />
        </div>

        <div className="flex flex-col space-y-3">
          <button onClick={generateWhatsappReview} className="w-full py-4 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-900/20">
            <span>📱</span>
            <span>Copy WhatsApp Summary</span>
          </button>
          <button onClick={downloadPDF} className="w-full py-4 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-900/20">
            <span>📄</span>
            <span>Download PDF Report</span>
          </button>
          <button onClick={resetAllData} className="w-full py-4 bg-red-600/10 hover:bg-red-600/20 text-red-300 border border-red-500/30 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all mt-4">
            <span>⚠️</span>
            <span>Reset All Data</span>
          </button>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-none rounded-[2.5rem] border border-white/5 p-6 shadow-2xl">
        <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-indigo-200">Attendance Log</h3>

        {loading ? (
          <div className="text-center py-10 text-white/30 animate-pulse text-xs uppercase tracking-widest">Loading Records...</div>
        ) : attendanceData.length === 0 ? (
          <div className="text-center py-10 text-white/30 text-xs uppercase tracking-widest">No records for this date</div>
        ) : (
          <div className="space-y-3">
            {attendanceData.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${record.rank_today <= 3 ? 'bg-amber-400 text-black' : 'bg-white/10 text-white'}`}>
                    {record.rank_today}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-100 leading-none">{record.students.name}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{record.students.batch}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs text-indigo-300">
                    {new Date(record.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[9px] text-gray-600 font-bold">+{record.points} pts</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
