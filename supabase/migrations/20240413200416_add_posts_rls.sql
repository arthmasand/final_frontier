-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all authenticated users"
ON public.posts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON public.posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Enable update for post owners"
ON public.posts FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Enable delete for post owners"
ON public.posts FOR DELETE
TO authenticated
USING (auth.uid() = author_id);

-- Grant permissions
GRANT ALL ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;

-- Add foreign key if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_author_id_fkey'
  ) THEN
    ALTER TABLE public.posts
    ADD CONSTRAINT posts_author_id_fkey
    FOREIGN KEY (author_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;
