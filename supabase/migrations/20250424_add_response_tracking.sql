-- Add response tracking fields to posts table
ALTER TABLE posts 
ADD COLUMN has_responses BOOLEAN DEFAULT false,
ADD COLUMN notification_sent BOOLEAN DEFAULT false,
ADD COLUMN last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create a function to update last_activity_at when a post is updated
CREATE OR REPLACE FUNCTION update_last_activity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function when a post is updated
CREATE TRIGGER update_post_last_activity
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_last_activity_timestamp();

-- Create a function to update has_responses when a comment is added
CREATE OR REPLACE FUNCTION update_post_has_responses()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the post's has_responses field to true when a comment is added
  UPDATE posts
  SET has_responses = true
  WHERE id = NEW.post_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function when a comment is added
CREATE TRIGGER update_post_response_status
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION update_post_has_responses();
