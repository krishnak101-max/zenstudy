import React, { useState, useEffect, useRef } from 'react';

const ALARM_KEY = 'zenstudy_exam_alarm';

interface AlarmState {
    date: string;     // YYYY-MM-DD
    time: string;     // HH:mm
    subject: string;
    enabled: boolean;
}

export const setExamAlarm = (date: string, subject: string) => {
    const alarm: AlarmState = {
        date,
        time: '05:30', // Default to 5:30 AM
        subject,
        enabled: true
    };
    localStorage.setItem(ALARM_KEY, JSON.stringify(alarm));
    window.dispatchEvent(new Event('alarm-updated')); // Notify components
};

export const getExamAlarm = (): AlarmState | null => {
    const stored = localStorage.getItem(ALARM_KEY);
    return stored ? JSON.parse(stored) : null;
};

export const clearExamAlarm = () => {
    localStorage.removeItem(ALARM_KEY);
    window.dispatchEvent(new Event('alarm-updated'));
}

const AlarmManager: React.FC = () => {
    const [ringing, setRinging] = useState<AlarmState | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const intervalRef = useRef<any>(null);

    useEffect(() => {
        // Check alarm every second
        const checkAlarm = () => {
            const stored = localStorage.getItem(ALARM_KEY);
            if (!stored) return;

            const alarm: AlarmState = JSON.parse(stored);
            if (!alarm.enabled) return;

            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const currentDate = now.toISOString().split('T')[0];

            // Trigger if date matches AND time matches
            // We also check if it's within the minute to avoid missing it if exact second is skipped
            if (currentDate === alarm.date && currentTime === alarm.time && !ringing) {
                triggerAlarm(alarm);
            }
        };

        const timer = setInterval(checkAlarm, 1000);
        return () => clearInterval(timer);
    }, [ringing]);

    const triggerAlarm = (alarm: AlarmState) => {
        setRinging(alarm);
        playAlarmSound();
    };

    const playAlarmSound = () => {
        try {
            // Create AudioContext if not exists
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            const ctx = audioContextRef.current;

            // Create oscillator for beep sound
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4
            oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);

            // Beep pattern
            const now = ctx.currentTime;
            gainNode.gain.setValueAtTime(1, now);
            gainNode.gain.setValueAtTime(0, now + 0.5);
            gainNode.gain.setValueAtTime(1, now + 1.0);
            gainNode.gain.setValueAtTime(0, now + 1.5);

            // Connect and start
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.start(now);

            // Loop the beep manually by restarting or let it run? 
            // Simple oscillator is continuous tone, we want pulsing.
            // For simplicity in this "synthetic" version, let's just create a pulsing effect loop

            stopAlarmSound(); // Stop any previous

            oscillatorRef.current = oscillator;

            // To make it loop properly without complex logic, let's just use a recurring interval for "beeps"
            // actually, let's use a simple HTML5 Audio with a data URI for a reliable "beep-beep" if possible, 
            // but oscillator is fine. Let's just let it ring continuously.

        } catch (e) {
            console.error("Audio playback failed", e);
        }
    };

    // Better looping sound implementation
    useEffect(() => {
        if (ringing) {
            intervalRef.current = setInterval(() => {
                // Play a short beep sequence
                if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                const ctx = audioContextRef.current;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.frequency.value = 800;
                osc.type = 'square';

                osc.start();
                gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
                osc.stop(ctx.currentTime + 0.5);
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
    }, [ringing]);

    const stopAlarmSound = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (oscillatorRef.current) {
            oscillatorRef.current.stop();
            oscillatorRef.current.disconnect();
        }
    };

    const dismissAlarm = () => {
        setRinging(null);
        stopAlarmSound();
        localStorage.removeItem(ALARM_KEY); // Remove alarm after it prompts
        window.location.reload(); // Refresh to clear state
    };

    if (!ringing) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-pulse">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-red-500 animate-bounce">
                <div className="text-6xl mb-4">⏰</div>
                <h2 className="text-3xl font-black text-red-600 mb-2">WAKE UP!</h2>
                <p className="text-gray-600 font-bold mb-6 text-lg">It's 05:30 AM</p>

                <div className="bg-red-50 p-4 rounded-xl mb-6 border border-red-100">
                    <p className="text-sm font-bold text-red-800 uppercase tracking-wider mb-1">Today's Exam</p>
                    <h3 className="text-2xl font-black text-gray-900">{ringing.subject}</h3>
                </div>

                <button
                    onClick={dismissAlarm}
                    className="w-full bg-red-600 text-white text-xl font-bold py-4 rounded-xl hover:bg-red-700 transition-colors shadow-lg"
                >
                    STOP ALARM
                </button>
                <p className="mt-4 text-xs text-white/50">Good Luck &amp; Do Your Best! 🍀</p>
            </div>
        </div>
    );
};

export default AlarmManager;
