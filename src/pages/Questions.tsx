import { useState, useEffect } from "react";
import { PostCard } from "@/components/PostCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Tag } from "lucide-react";
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

const Questions = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
    fetchTags();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
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
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        variant: "destructive",
        title: "Error fetching posts",
        description: error instanceof Error ? error.message : "Failed to fetch posts",
      });
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from("tags")
        .select("name");

      if (error) {
        throw error;
      }

      setAllTags(data.map(tag => tag.name));
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast({
        variant: "destructive",
        title: "Error fetching tags",
        description: error instanceof Error ? error.message : "Failed to fetch tags",
      });
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => 
        post.posts_tags.some(pt => pt.tags.name === tag)
      );
    return matchesSearch && matchesTags;
  });

  return (
    <div className="container py-8">
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Tag className="h-4 w-4 text-gray-500" />
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        {filteredPosts.map((post) => (
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
    </div>
  );
};

export default Questions;