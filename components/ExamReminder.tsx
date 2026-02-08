import React from 'react';
import { getFormattedDate } from '../logic/utils.ts';

const EXAM_SCHEDULE = [
    { date: '2026-02-08', subject: 'Malayalam 2' },
    { date: '2026-02-09', subject: 'English' },
    { date: '2026-02-10', subject: 'Hindi' },
    { date: '2026-02-11', subject: 'SS' },
    { date: '2026-02-12', subject: 'Physics' },
    { date: '2026-02-13', subject: 'Chemistry' },
    { date: '2026-02-14', subject: 'Mathematics' },
    { date: '2026-02-15', subject: 'Biology' },
];

const ExamReminder: React.FC = () => {
    const today = getFormattedDate(); // YYYY-MM-DD

    // Calculate tomorrow's date
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = getFormattedDate(tomorrowDate);

    const todayExam = EXAM_SCHEDULE.find(e => e.date === today);
    const tomorrowExam = EXAM_SCHEDULE.find(e => e.date === tomorrow);

    if (!todayExam && !tomorrowExam) return null;

    return (
        <div className="premium-card slide-up mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">📝</div>
                <div>
                    <h3 className="text-lg font-black text-blue-900 uppercase tracking-tight">Exam Schedule</h3>
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Stay Prepared!</p>
                </div>
            </div>

            <div className="space-y-3">
                {todayExam ? (
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-blue-100 relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Today's Exam</p>
                            <h4 className="text-xl font-bold text-gray-900">{todayExam.subject}</h4>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg group-hover:scale-110 transition-transform">
                            👇
                        </div>
                    </div>
                ) : (
                    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-center">
                        <p className="text-sm font-medium text-blue-700">No exam today. Relax & Revise! 🧘‍♂️</p>
                    </div>
                )}

                {tomorrowExam && (
                    <div className="flex justify-between items-center bg-white/60 p-4 rounded-xl border border-gray-200">
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tomorrow</p>
                            <h4 className="text-lg font-semibold text-gray-700">{tomorrowExam.subject}</h4>
                        </div>
                        <div className="text-2xl opacity-50">📅</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExamReminder;
