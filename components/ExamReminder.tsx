import React from 'react';
import { getFormattedDate } from '../logic/utils.ts';

const EXAM_SCHEDULE = [
    { date: '2026-03-05', subject: 'First Language' },
    { date: '2026-03-09', subject: 'English' },
    { date: '2026-03-11', subject: 'Malayalam 2' },
    { date: '2026-03-13', subject: 'Hindi' },
    { date: '2026-03-16', subject: 'Mathematics' },
    { date: '2026-03-18', subject: 'Physics' },
    { date: '2026-03-23', subject: 'Social Science' },
    { date: '2026-03-25', subject: 'Chemistry' },
    { date: '2026-03-30', subject: 'Biology' },
];

const MOTIVATIONAL_QUOTES = [
    "Believe you can and you're halfway there.",
    "Success is the sum of small efforts, repeated day in and day out.",
    "The secret of getting ahead is getting started.",
    "Focus on your goal. Don't look in any direction but ahead.",
    "It always seems impossible until it's done.",
    "Push yourself, because no one else is going to do it for you.",
    "Great things never come from comfort zones.",
    "Dream it. Wish it. Do it.",
    "Wake up with determination. Go to bed with satisfaction.",
    "Do something today that your future self will thank you for.",
    "You don't have to be great to start, but you have to start to be great.",
    "Strive for progress, not perfection.",
    "The future belongs to those who believe in the beauty of their dreams."
];

const ExamReminder: React.FC = () => {
    const today = getFormattedDate();

    const todayExam = EXAM_SCHEDULE.find(e => e.date === today);
    const nextExamList = EXAM_SCHEDULE.filter(e => e.date > today);
    const nextExam = nextExamList.length > 0 ? nextExamList[0] : null;

    // Get a quote based on the day of the year so it changes daily but stays consistent during the day
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const dailyQuote = MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];

    // If all exams are completely over
    if (!todayExam && nextExamList.length === 0 && EXAM_SCHEDULE.length > 0 && today > EXAM_SCHEDULE[EXAM_SCHEDULE.length - 1].date) {
        return (
            <div className="mb-6 relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative premium-card bg-gradient-to-br from-white to-green-50 border-green-200 p-6 text-center shadow-lg rounded-2xl">
                    <h3 className="text-2xl font-black text-green-700 mb-2">Exams Completed! 🎉</h3>
                    <p className="text-green-800 font-medium">Congratulations on finishing your SSLC exams! Enjoy your well-deserved break!</p>
                </div>
            </div>
        );
    }

    // If no exams at all
    if (!todayExam && !nextExam && EXAM_SCHEDULE.length === 0) return null;

    return (
        <div className="mb-6 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <div className="relative premium-card bg-gradient-to-br from-white to-blue-50 border-blue-200 p-0 overflow-hidden rounded-2xl">

                {/* Header Strip */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">📅</span>
                        <span className="text-sm font-black text-white uppercase tracking-wider text-shadow-sm">SSLC Exam Schedule</span>
                    </div>
                </div>

                <div className="p-4 space-y-4">

                    {/* Motivational Quote Daily */}
                    <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 text-center italic text-sm text-blue-800 shadow-sm relative overflow-hidden">
                        <span className="absolute -top-2 left-2 text-4xl text-blue-200 opacity-60 font-serif leading-none">"</span>
                        <span className="relative z-10 font-medium px-4 block">{dailyQuote}</span>
                    </div>

                    {/* Today's Exam Card */}
                    {todayExam && (
                        <div className="flex justify-between items-center bg-white p-3 rounded-lg border-l-4 border-red-500 shadow-sm">
                            <div>
                                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-0.5">Today's Exam</p>
                                <h4 className="text-lg font-black text-gray-900">{todayExam.subject}</h4>
                            </div>
                            <div className="text-2xl opacity-80">📝</div>
                        </div>
                    )}

                    {/* Next Exam Card */}
                    {nextExam && (
                        <div className="flex justify-between items-center bg-amber-50 p-3 rounded-lg border border-amber-100 shadow-sm">
                            <div>
                                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">Next Exam: {new Date(nextExam.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                <h4 className="text-sm font-bold text-gray-800">{nextExam.subject}</h4>
                            </div>
                            <div className="text-xl opacity-80">📅</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExamReminder;
