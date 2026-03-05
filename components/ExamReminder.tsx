import React, { useState, useEffect } from 'react';
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
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
    const [targetExam, setTargetExam] = useState<{ date: string; subject: string } | null>(null);

    const today = getFormattedDate();

    // Calculate tomorrow's date contextually if needed, though we track Next Exam properly now.

    const todayExam = EXAM_SCHEDULE.find(e => e.date === today);
    const nextExamList = EXAM_SCHEDULE.filter(e => e.date > today);
    const nextExam = nextExamList.length > 0 ? nextExamList[0] : null;

    // Get a quote based on the day of the year so it changes daily but stays consistent during the day
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const dailyQuote = MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();

            // Determine target time: the first exam strictly in the future
            let target: Date | null = null;
            let examSubject = '';

            for (const exam of EXAM_SCHEDULE) {
                const examTime = new Date(`${exam.date}T04:30:00`);
                if (now < examTime) {
                    target = examTime;
                    examSubject = exam.subject;
                    break;
                }
            }

            // If still no target (e.g., end of exams), stop
            if (!target) {
                setTimeLeft(null);
                setTargetExam(null);
                return;
            }

            setTargetExam({ date: target.toISOString().split('T')[0], subject: examSubject });

            const diff = target.getTime() - now.getTime();

            if (diff > 0) {
                const hours = Math.floor((diff / (1000 * 60 * 60)));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft({ hours, minutes, seconds });
            } else {
                setTimeLeft(null); // Timer finished or passed
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [today]);

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
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-amber-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <div className="relative premium-card bg-gradient-to-br from-white to-amber-50 border-amber-200 p-0 overflow-hidden rounded-2xl">

                {/* Header Strip */}
                <div className="bg-gradient-to-r from-red-500 to-amber-500 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl animate-pulse">⏳</span>
                        <span className="text-sm font-black text-white uppercase tracking-wider text-shadow-sm">SSLC Exam Countdown</span>
                    </div>
                    <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                        04:30 AM Start
                    </span>
                </div>

                <div className="p-4 space-y-4">

                    {/* Motivational Quote Daily */}
                    <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 text-center italic text-sm text-blue-800 shadow-sm relative overflow-hidden">
                        <span className="absolute -top-2 left-2 text-4xl text-blue-200 opacity-60 font-serif leading-none">"</span>
                        <span className="relative z-10 font-medium px-4 block">{dailyQuote}</span>
                    </div>

                    {/* Main Countdown Display */}
                    {timeLeft && targetExam ? (
                        <div className="bg-gray-900 rounded-xl p-4 text-center border-2 border-gray-800 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-shimmer"></div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Time Until {targetExam.subject}</p>

                            <div className="flex justify-center items-end gap-2 text-white">
                                <div className="flex flex-col">
                                    <span className="text-3xl font-black tabular-nums leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
                                    <span className="text-[9px] text-gray-500 font-bold uppercase mt-1">Hrs</span>
                                </div>
                                <span className="text-xl font-bold text-gray-600 mb-2">:</span>
                                <div className="flex flex-col">
                                    <span className="text-3xl font-black tabular-nums leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
                                    <span className="text-[9px] text-gray-500 font-bold uppercase mt-1">Mins</span>
                                </div>
                                <span className="text-xl font-bold text-gray-600 mb-2">:</span>
                                <div className="flex flex-col">
                                    <span className="text-3xl font-black tabular-nums leading-none text-red-500">{String(timeLeft.seconds).padStart(2, '0')}</span>
                                    <span className="text-[9px] text-red-500/70 font-bold uppercase mt-1">Secs</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        targetExam === null && todayExam ? (
                            <div className="bg-green-100 rounded-xl p-4 text-center border border-green-200">
                                <p className="text-green-800 font-bold text-lg">Exam Time! Good Luck! 🍀</p>
                            </div>
                        ) : null
                    )}

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
                                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">Next Exam: {new Date(nextExam.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
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
