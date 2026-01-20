
export interface Student {
  id: string;
  name: string;
  batch: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  date: string;
  checkin_time: string;
  points: number;
  rank_today: number;
}

export interface StudentStats {
  student_id: string;
  total_points: number;
  current_streak: number;
  best_streak: number;
  last_checkin_date: string | null;
  medal_level: string;
}

export interface LeaderboardEntry extends Attendance {
  students: {
    name: string;
    batch: string;
  };
}
