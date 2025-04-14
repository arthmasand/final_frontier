-- Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN role text NOT NULL DEFAULT 'student' 
CHECK (role IN ('student', 'teacher'));

-- Create moderator_assignments table
CREATE TABLE moderator_assignments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id uuid REFERENCES profiles(id) NOT NULL,
    assigned_by uuid REFERENCES profiles(id) NOT NULL,
    time_slot text NOT NULL CHECK (time_slot IN (
        '10am-12pm',
        '12pm-2pm',
        '2pm-4pm',
        '4pm-6pm',
        '6pm-8pm',
        '8pm-10pm',
        '10pm-12am'
    )),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (student_id, time_slot)
);

-- Add RLS policies
ALTER TABLE moderator_assignments ENABLE ROW LEVEL SECURITY;

-- Teachers can view and manage moderator assignments
CREATE POLICY "Teachers can manage moderator assignments"
ON moderator_assignments
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'teacher'
    )
);

-- Students can view their own assignments
CREATE POLICY "Students can view their own assignments"
ON moderator_assignments
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Update profiles table RLS to allow teachers to view all profiles
CREATE POLICY "Teachers can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
    (auth.uid() = id) OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'teacher'
    )
);
