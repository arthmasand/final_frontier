-- First, drop the existing constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_valid_role;

-- Then recreate it with the admin role included
ALTER TABLE public.profiles
ADD CONSTRAINT check_valid_role
CHECK (role IN ('student', 'teacher', 'admin'));

-- Update any existing users to admin role if needed
-- Replace 'your_email@example.com' with the email you want to make an admin
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email = '21803008@mail.jiit.ac.in'
);
