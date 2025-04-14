-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('student', 'teacher'));

-- Update existing profiles to have a default role of 'student'
UPDATE profiles SET role = 'student' WHERE role IS NULL;
