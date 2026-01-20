-- ==========================================
-- WAKE UP ATTENDANCE - DATABASE SETUP
-- ==========================================
-- Instructions:
-- 1. Open your Supabase Dashboard.
-- 2. Go to the "SQL Editor" tab.
-- 3. Click "New Query".
-- 4. Paste this entire script and click "Run".
-- ==========================================

-- 1. Create Students Table
-- Stores basic profile information.
CREATE TABLE IF NOT EXISTS students (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  batch TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Attendance Table
-- Records daily wake-up times and calculates points/rank.
CREATE TABLE IF NOT EXISTS attendance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  checkin_time TIMESTAMPTZ DEFAULT now(),
  points INT DEFAULT 0,
  rank_today INT DEFAULT 0,
  UNIQUE(student_id, date)
);

-- 3. Create Student Stats Table
-- Tracks streaks, total points, and earned medals.
CREATE TABLE IF NOT EXISTS student_stats (
  student_id uuid PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  total_points INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  best_streak INT DEFAULT 0,
  last_checkin_date DATE,
  medal_level TEXT DEFAULT 'None'
);

-- 4. Enable Row Level Security (RLS)
-- This ensures that tables are protected, though we add public policies below for ease of use.
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_stats ENABLE ROW LEVEL SECURITY;

-- 5. Create Public Access Policies
-- NOTE: In a real production environment, you should use Supabase Auth and restrict these.
-- These policies are configured for a public-facing app with no login required.

-- Policies for 'students'
CREATE POLICY "Public select students" ON students FOR SELECT USING (true);
CREATE POLICY "Public insert students" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update students" ON students FOR UPDATE USING (true);
CREATE POLICY "Public delete students" ON students FOR DELETE USING (true);

-- Policies for 'attendance'
CREATE POLICY "Public select attendance" ON attendance FOR SELECT USING (true);
CREATE POLICY "Public insert attendance" ON attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update attendance" ON attendance FOR UPDATE USING (true);
CREATE POLICY "Public delete attendance" ON attendance FOR DELETE USING (true);

-- Policies for 'student_stats'
CREATE POLICY "Public select student_stats" ON student_stats FOR SELECT USING (true);
CREATE POLICY "Public insert student_stats" ON student_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update student_stats" ON student_stats FOR UPDATE USING (true);
CREATE POLICY "Public delete student_stats" ON student_stats FOR DELETE USING (true);

-- 6. Performance Indices
-- Helps with fast ranking and leaderboard lookups.
CREATE INDEX IF NOT EXISTS idx_attendance_date_rank ON attendance(date, rank_today);
CREATE INDEX IF NOT EXISTS idx_stats_total_points ON student_stats(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
