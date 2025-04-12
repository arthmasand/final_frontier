import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Comments } from "@/components/Comments";

interface Post {
  id: string;
  title: string;
  content: string;
  votes: number;
  created_at: string;
  author: {
    username: string;
  };
  posts_tags: {
    tags: {
      name: string;
    };
  }[];
}

const PostDetails = () => {
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [userVote, setUserVote] = useState<boolean | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPost();
    checkUserVote();
  }, [id]);

  const fetchPost = async () => {
    if (!id) return;

    const { data: post, error } = await supabase
      .from("posts")
      .select(`
        *,
        author:profiles!posts_author_id_fkey (
          username
        ),
        posts_tags (
          tags (
            name
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error fetching post",
        description: error.message,
      });
      return;
    }

    setPost(post);
  };

  const checkUserVote = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user || !id) return;

    const { data: vote } = await supabase
      .from("user_votes")
      .select("*")
      .eq("post_id", id)
      .eq("user_id", session.session.user.id)
      .maybeSingle();

    setUserVote(!!vote);
  };

  const handleVote = async () => {
    try {
      setIsLoading(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please sign in to vote on posts",
        });
        return;
      }

      const { error } = await supabase.rpc('handle_vote', {
        post_id: id,
        user_id: session.session.user.id
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error voting on post",
          description: error.message,
        });
        return;
      }

      setUserVote(!userVote);
      await fetchPost();
      
      toast({
        title: "Success",
        description: userVote ? "Vote removed" : "Vote added",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!post) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container py-8">
      <div className="bg-card rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVote}
              disabled={isLoading}
              className={userVote ? "text-primary" : ""}
            >
              ▲
            </Button>
            <span className="text-lg font-semibold">{post.votes}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <span>Posted by {post.author.username}</span>
              <span>•</span>
              <span>{format(new Date(post.created_at), "PPp")}</span>
            </div>
            <div className="prose dark:prose-invert max-w-none mb-4">
              {post.content}
            </div>
            <div className="flex flex-wrap gap-2">
              {post.posts_tags.map((pt, index) => (
                <Badge key={index} variant="secondary">
                  {pt.tags.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Comments postId={post.id} />
    </div>
  );
};

export default PostDetails;