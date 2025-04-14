-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add role column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 
                  FROM information_schema.columns 
                  WHERE table_name = 'profiles' 
                  AND column_name = 'role') 
    THEN
        ALTER TABLE profiles 
        ADD COLUMN role text CHECK (role IN ('student', 'teacher'));
        
        -- Update existing profiles to have a default role
        UPDATE profiles SET role = 'student' WHERE role IS NULL;
        
        -- Make role required for new rows
        ALTER TABLE profiles ALTER COLUMN role SET NOT NULL;
    END IF;
END $$;

-- Create policy to allow users to read all profiles
CREATE POLICY IF NOT EXISTS "Allow users to read all profiles" 
    ON profiles FOR SELECT 
    TO authenticated 
    USING (true);

-- Create policy to allow users to update their own profile
CREATE POLICY IF NOT EXISTS "Allow users to update own profile" 
    ON profiles FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

-- Create policy to allow service role to create profiles
CREATE POLICY IF NOT EXISTS "Allow service role to create profiles" 
    ON profiles FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = id);
