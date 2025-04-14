import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Comments } from "@/components/Comments";
import { Paperclip, Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Post {
  id: string;
  title: string;
  content: string;
  votes: number;
  created_at: string;
  author_id: string;
  profiles?: {
    username: string;
    role?: 'student' | 'teacher' | 'admin';
  };
  posts_tags: {
    tags: {
      name: string;
    };
  }[];
  attachments: Array<{
    name: string;
    url: string;
    size: number;
  }> | null;
}

const PostDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [userVote, setUserVote] = useState<boolean>(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [id]);

  useEffect(() => {
    if (post) {
      checkIsAuthor();
    }
  }, [post]);

  const checkIsAuthor = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;
      
      setIsAuthor(session.session.user.id === post.author_id);
      console.log('Checking author:', {
        userId: session.session.user.id,
        postAuthorId: post.author_id,
        isAuthor: session.session.user.id === post.author_id
      });
    } catch (error) {
      console.error('Error checking author:', error);
    }
  };

  const handleEdit = () => {
    navigate(`/edit-post/${id}`);
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      setIsLoading(true);

      // Delete comments first
      const { error: commentsError } = await supabase
        .from('comments')
        .delete()
        .eq('post_id', id);

      if (commentsError) throw commentsError;

      // Delete post_tags associations
      const { error: tagsError } = await supabase
        .from('posts_tags')
        .delete()
        .eq('post_id', id);

      if (tagsError) throw tagsError;

      // Delete attachments from storage if they exist
      if (post?.attachments) {
        for (const attachment of post.attachments) {
          const fileName = attachment.url.split('/').pop();
          if (fileName) {
            const { error: storageError } = await supabase.storage
              .from('post-attachments')
              .remove([fileName]);
            
            if (storageError) {
              console.error('Error deleting attachment:', storageError);
              // Continue with deletion even if attachment removal fails
            }
          }
        }
      }

      // Finally delete the post
      const { error: postError } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (postError) throw postError;

      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully."
      });

      navigate('/');
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        variant: "destructive",
        title: "Error deleting post",
        description: error instanceof Error ? error.message : "Failed to delete post"
      });
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const fetchPost = async () => {
    if (!id) return;

    try {
      const { data: post, error } = await supabase
        .from("posts")
        .select(`
          id,
          title,
          content,
          votes,
          created_at,
          author_id,
          profiles:profiles!posts_author_id_fkey (username, role),
          posts_tags (tags (name)),
          attachments
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
        toast({
          variant: "destructive",
          title: "Error fetching post",
          description: error.message,
        });
        return;
      }

      if (post) {
        setPost(post);
      }
    } catch (error) {
      console.error('Error in fetchPost:', error);
      toast({
        variant: "destructive",
        title: "Error fetching post",
        description: error instanceof Error ? error.message : "Failed to fetch post",
      });
    }
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
              <span>Posted by {post.profiles?.username || 'Unknown User'}</span>
              <span>•</span>
              <span>{format(new Date(post.created_at), "PPp")}</span>
            </div>
            <div className="prose dark:prose-invert max-w-none mb-4">
              {post.content}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-2">
                {post.posts_tags.map((pt, index) => (
                  <Badge key={index} variant="secondary">
                    {pt.tags.name}
                  </Badge>
                ))}
              </div>
              {isAuthor && (
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
            {post.attachments && post.attachments.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <h3 className="text-sm font-semibold mb-2">Attachments</h3>
                <div className="space-y-2">
                  {post.attachments.map((file) => (
                    <a
                      key={file.name}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Paperclip className="h-4 w-4" />
                      <span>{file.name}</span>
                      <span className="text-xs text-gray-500">({Math.round(file.size / 1024)}KB)</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Comments postId={post.id} />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PostDetails;