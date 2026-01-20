-- ==========================================
-- DAILY RANK TRIGGER SETUP
-- ==========================================
-- This script creates a trigger to automatically
-- calculate daily ranks based on check-in time
-- ==========================================

-- Function to update ranks when attendance is inserted
CREATE OR REPLACE FUNCTION update_daily_ranks()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all ranks for the given date, ordered by checkin_time
  WITH ranked AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY checkin_time ASC) as new_rank
    FROM attendance
    WHERE date = NEW.date
  )
  UPDATE attendance a
  SET rank_today = r.new_rank
  FROM ranked r
  WHERE a.id = r.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_ranks ON attendance;

-- Create trigger to auto-update ranks after each insert
CREATE TRIGGER trigger_update_ranks
AFTER INSERT ON attendance
FOR EACH ROW
EXECUTE FUNCTION update_daily_ranks();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Daily rank trigger successfully created!';
END $$;
