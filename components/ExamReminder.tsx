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
        <div className="mb-6 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-amber-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <div className="relative premium-card bg-gradient-to-br from-white to-amber-50 border-amber-200 p-0 overflow-hidden">

                {/* Header Strip */}
                <div className="bg-gradient-to-r from-red-500 to-amber-500 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl animate-pulse">🔔</span>
                        <span className="text-sm font-black text-white uppercase tracking-wider text-shadow-sm">Exam Alert</span>
                    </div>
                    <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                        Important
                    </span>
                </div>

                <div className="p-4 space-y-3">
                    {todayExam ? (
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-md border-l-4 border-red-500 relative overflow-hidden">
                            <div className="z-10">
                                <p className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                                    Today's Exam
                                </p>
                                <h4 className="text-2xl font-black text-gray-900 leading-none">{todayExam.subject}</h4>
                                <p className="text-xs text-gray-500 font-medium mt-1">Good luck! You got this! 🚀</p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-2xl animate-bounce">
                                📝
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-center">
                            <p className="text-xs font-bold text-green-700 uppercase tracking-wide">No Exam Today • Keep Revising! 📚</p>
                        </div>
                    )}

                    {tomorrowExam && (
                        <div className="flex items-center gap-3 bg-amber-100/50 p-3 rounded-lg border border-amber-200/60">
                            <div className="bg-amber-200 w-8 h-8 rounded-lg flex items-center justify-center text-lg">
                                📅
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Up Next: Tomorrow</p>
                                <h4 className="text-sm font-bold text-gray-800">{tomorrowExam.subject}</h4>
                            </div>
                            <a
                                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Exam:+${encodeURIComponent(tomorrowExam.subject)}&dates=${tomorrowExam.date.replace(/-/g, '')}T050000Z/${tomorrowExam.date.replace(/-/g, '')}T080000Z&details=Good+luck!+Prepare+well.&sf=true&output=xml`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-auto bg-amber-500 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-full shadow-sm hover:bg-amber-600 transition-colors flex items-center gap-1"
                            >
                                🔔 Set Alarm
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExamReminder;
