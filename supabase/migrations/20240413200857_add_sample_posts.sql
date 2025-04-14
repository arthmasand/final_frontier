-- Insert sample posts
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the first user from auth.users
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Insert sample posts
    INSERT INTO public.posts 
      (title, content, preview, votes, author_id, created_at)
    VALUES 
      ('Welcome to Campus Dialogue Hub', 'This is a welcome post to all new users!', 'Welcome to our community...', 5, v_user_id, NOW()),
      ('Campus Events This Week', 'Check out these upcoming events...', 'Several exciting events...', 3, v_user_id, NOW()),
      ('Study Group Formation', 'Looking for study partners...', 'Join our study group...', 2, v_user_id, NOW());
  END IF;
END $$;
