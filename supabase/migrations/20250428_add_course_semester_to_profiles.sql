-- Add course and semester fields to profiles table
ALTER TABLE profiles 
ADD COLUMN course TEXT,
ADD COLUMN semester TEXT;

-- Update existing profiles with default values for testing
UPDATE profiles
SET 
  course = CASE 
    WHEN random() < 0.25 THEN 'CSE'
    WHEN random() < 0.5 THEN 'IT'
    WHEN random() < 0.75 THEN 'ECE'
    ELSE 'BIOTECH'
  END,
  semester = CASE 
    WHEN random() < 0.125 THEN 'Semester 1'
    WHEN random() < 0.25 THEN 'Semester 2'
    WHEN random() < 0.375 THEN 'Semester 3'
    WHEN random() < 0.5 THEN 'Semester 4'
    WHEN random() < 0.625 THEN 'Semester 5'
    WHEN random() < 0.75 THEN 'Semester 6'
    WHEN random() < 0.875 THEN 'Semester 7'
    ELSE 'Semester 8'
  END
WHERE role = 'student';
