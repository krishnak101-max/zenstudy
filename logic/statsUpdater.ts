import { supabase } from '../supabaseClient';
import { getYesterdayDate, getMedal } from './utils';

export const updateStudentStats = async (studentId: string, pointsEarned: number, today: string) => {
    try {
        // 1. Fetch current stats
        const { data: currentStats, error: fetchError } = await supabase
            .from('student_stats')
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle();

        if (fetchError) throw fetchError;

        // Default values if no stats exist yet
        let newTotalPoints = pointsEarned;
        let newCurrentStreak = 1;
        let newBestStreak = 1;

        if (currentStats) {
            newTotalPoints = (currentStats.total_points || 0) + pointsEarned;

            const lastCheckin = currentStats.last_checkin_date;
            const yesterday = getYesterdayDate(new Date(today));

            if (lastCheckin === yesterday) {
                // Continue streak
                newCurrentStreak = (currentStats.current_streak || 0) + 1;
            } else if (lastCheckin === today) {
                // Already checked in today, don't double count streak (though this shouldn't happen with app logic)
                newCurrentStreak = currentStats.current_streak || 1;
            } else {
                // Streak broken
                newCurrentStreak = 1;
            }

            newBestStreak = Math.max(newCurrentStreak, currentStats.best_streak || 0);
        }

        const newMedal = getMedal(newCurrentStreak);

        // 2. Upsert stats
        const { error: upsertError } = await supabase
            .from('student_stats')
            .upsert({
                student_id: studentId,
                total_points: newTotalPoints,
                current_streak: newCurrentStreak,
                best_streak: newBestStreak,
                last_checkin_date: today,
                medal_level: newMedal
            });

        if (upsertError) throw upsertError;

        return { success: true };
    } catch (error) {
        console.error('Error updating stats:', error);
        return { success: false, error };
    }
};
