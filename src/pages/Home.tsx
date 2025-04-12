import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { PlusCircle, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Post {
  id: string;
  title: string;
  content: string;
  preview: string;
  votes: number;
  created_at: string;
  profiles: {
    username: string;
  };
  posts_tags: {
    tags: {
      name: string;
    };
  }[];
}

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data: posts, error } = await supabase
      .from("posts")
      .select(`
        *,
        profiles!posts_author_id_fkey (
          username
        ),
        posts_tags (
          tags (
            name
          )
        )
      `)
      .order("votes", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error fetching posts",
        description: error.message,
      });
      return;
    }

    setPosts(posts);
  };

  const generatePreview = (content: string) => {
    const words = content.split(' ');
    if (words.length > 50) { // Show first 50 words as preview
      return words.slice(0, 50).join(' ') + '...';
    }
    return content;
  };

  const handleCreatePost = async () => {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to create a post",
      });
      navigate("/login");
      return;
    }

    const preview = generatePreview(newPost.content);

    const { error } = await supabase.from("posts").insert({
      title: newPost.title,
      content: newPost.content,
      preview: preview,
      author_id: session.session.user.id,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating post",
        description: error.message,
      });
      return;
    }

    toast({
      title: "Success",
      description: "Post created successfully",
    });

    setNewPost({ title: "", content: "" });
    setShowCreateForm(false);
    fetchPosts();
  };

  const trendingPosts = posts.slice(0, 2);
  const latestPosts = posts.slice(2);

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Campus Discussions</h1>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-5 w-5" />
            Create Post
          </Button>
        </div>

        {showCreateForm && (
          <div className="bg-card p-6 rounded-lg shadow-md mb-8 space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">Create New Post</h2>
            <Input
              placeholder="Title"
              value={newPost.title}
              onChange={(e) =>
                setNewPost({ ...newPost, title: e.target.value })
              }
              className="bg-background text-foreground"
            />
            <Textarea
              placeholder="Content"
              value={newPost.content}
              onChange={(e) =>
                setNewPost({ ...newPost, content: e.target.value })
              }
              className="min-h-[200px] bg-background text-foreground"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreatePost}>Create Post</Button>
            </div>
          </div>
        )}

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-foreground">
            <TrendingUp className="h-6 w-6 text-primary" />
            Trending Discussions
          </h2>
          <div className="grid gap-6">
            {trendingPosts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                preview={post.preview}
                votes={post.votes}
                answers={post.posts_tags?.length || 0}
                author={post.profiles.username}
                role="student"
                timestamp={new Date(post.created_at).toLocaleDateString()}
                trending={true}
                tags={post.posts_tags.map((pt) => pt.tags.name)}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 text-foreground">Latest Posts</h2>
          <div className="grid gap-6">
            {latestPosts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                preview={post.preview}
                votes={post.votes}
                answers={post.posts_tags?.length || 0}
                author={post.profiles.username}
                role="student"
                timestamp={new Date(post.created_at).toLocaleDateString()}
                tags={post.posts_tags.map((pt) => pt.tags.name)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
