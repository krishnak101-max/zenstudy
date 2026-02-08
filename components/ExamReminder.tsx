import React, { useState, useEffect } from 'react';
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
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
    const [targetExam, setTargetExam] = useState<{ date: string; subject: string } | null>(null);

    const today = getFormattedDate();

    // Calculate tomorrow's date for display logic
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = getFormattedDate(tomorrowDate);

    const todayExam = EXAM_SCHEDULE.find(e => e.date === today);
    const tomorrowExam = EXAM_SCHEDULE.find(e => e.date === tomorrow);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();

            // Determine target time
            let target: Date | null = null;
            let examSubject = '';

            // 1. Check if there is an exam TODAY and if it's before 4:30 AM
            if (todayExam) {
                const todayTarget = new Date(`${todayExam.date}T04:30:00`);
                if (now < todayTarget) {
                    target = todayTarget;
                    examSubject = todayExam.subject;
                }
            }

            // 2. If no target yet (past 4:30 AM today OR no exam today), check TOMORROW
            if (!target && tomorrowExam) {
                const tomorrowTarget = new Date(`${tomorrowExam.date}T04:30:00`);
                target = tomorrowTarget;
                examSubject = tomorrowExam.subject;
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
    }, [today, todayExam, tomorrowExam]);

    if (!todayExam && !tomorrowExam) return null;

    return (
        <div className="mb-6 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-amber-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <div className="relative premium-card bg-gradient-to-br from-white to-amber-50 border-amber-200 p-0 overflow-hidden">

                {/* Header Strip */}
                <div className="bg-gradient-to-r from-red-500 to-amber-500 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl animate-pulse">⏳</span>
                        <span className="text-sm font-black text-white uppercase tracking-wider text-shadow-sm">Exam Countdown</span>
                    </div>
                    <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                        04:30 AM Start
                    </span>
                </div>

                <div className="p-4 space-y-4">

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

                    {/* Tomorrow's Exam Card */}
                    {tomorrowExam && (
                        <div className="flex justify-between items-center bg-amber-50 p-3 rounded-lg border border-amber-100">
                            <div>
                                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">Tomorrow</p>
                                <h4 className="text-sm font-bold text-gray-800">{tomorrowExam.subject}</h4>
                            </div>
                            <div className="text-xl opacity-60">📅</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExamReminder;
