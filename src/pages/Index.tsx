import { PostCard } from "@/components/PostCard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  title: string;
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

const Index = () => {
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    // Fetch trending posts (posts with most votes)
    const { data: trending, error: trendingError } = await supabase
      .from("posts")
      .select(`
        *,
        profiles (
          username
        ),
        posts_tags (
          tags (
            name
          )
        )
      `)
      .order('votes', { ascending: false })
      .limit(2);

    if (trendingError) {
      toast({
        variant: "destructive",
        title: "Error fetching trending posts",
        description: trendingError.message,
      });
      return;
    }

    // Fetch latest posts
    const { data: latest, error: latestError } = await supabase
      .from("posts")
      .select(`
        *,
        profiles (
          username
        ),
        posts_tags (
          tags (
            name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(2);

    if (latestError) {
      toast({
        variant: "destructive",
        title: "Error fetching latest posts",
        description: latestError.message,
      });
      return;
    }

    setTrendingPosts(trending || []);
    setLatestPosts(latest || []);
  };

  return (
    <div className="container py-8">
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Trending Discussions</h2>
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
        <h2 className="text-2xl font-bold mb-6">Latest Posts</h2>
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
    </div>
  );
};

export default Index;