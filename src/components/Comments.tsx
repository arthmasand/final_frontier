
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  user_email: string;
  created_at: string;
  profiles: {
    username: string;
    nickname: string;
  };
}

interface CommentsProps {
  postId: string;
}

export const Comments = ({ postId }: CommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchComments();
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        profiles:user_id (
          username,
          nickname
        )
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error fetching comments",
        description: error.message,
      });
      return;
    }

    setComments(data || []);
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please login to comment.",
      });
      navigate("/login");
      return;
    }

    if (!newComment.trim()) {
      toast({
        variant: "destructive",
        title: "Empty comment",
        description: "Please write something before submitting",
      });
      return;
    }

    const { error } = await supabase.from("comments").insert([
      {
        content: newComment,
        post_id: postId,
        user_id: user.id,
        user_email: user.email,
      },
    ]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error posting comment",
        description: error.message,
      });
      return;
    }

    setNewComment("");
    fetchComments();
    toast({
      title: "Success",
      description: "Comment posted successfully",
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Comments</h3>
      
      <div className="space-y-2">
        <Textarea
          placeholder={user ? "Write a comment..." : "Please login to comment"}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={!user}
        />
        <Button 
          onClick={handleSubmitComment}
          disabled={!user}
        >
          {user ? "Post Comment" : "Login to Comment"}
        </Button>
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-lg border p-4 space-y-2"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">
                {comment.profiles?.nickname || comment.profiles?.username || 'Anonymous'}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-700">{comment.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
