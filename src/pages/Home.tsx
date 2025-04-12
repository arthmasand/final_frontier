import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { PlusCircle, TrendingUp, Tag, X, Upload, Loader2, FileIcon } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface FileUpload {
  id: string;
  name: string;
  url: string;
  size: number;
}

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
  comments: {
    count: number;
  }[];
  attachments?: {
    name: string;
    url: string;
    size: number;
  }[];
}

interface Tag {
  id: string;
  name: string;
}

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    tags: [] as string[],
  });
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newTagInput, setNewTagInput] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
    initializeTags().then(() => fetchTags());
  }, []);

  const initializeTags = async () => {
    const defaultTags = [
      'Academic',
      'Events', 
      'Campus Life',
      'Questions',
      'Discussion',
      'Announcement',
      'Help Wanted',
      'Resources',
      'Student Activities',
      'Faculty'
    ];

    try {
      // First check if we have any tags
      const { data: existingTags, error: checkError } = await supabase
        .from('tags')
        .select('name');

      if (checkError) throw checkError;

      // If no tags exist, create them
      if (!existingTags || existingTags.length === 0) {
        const { error: insertError } = await supabase
          .from('tags')
          .insert(defaultTags.map(name => ({ name })));

        if (insertError) throw insertError;

        toast({
          title: "Tags initialized",
          description: "Default tags have been created."
        });
      }
    } catch (error) {
      console.error('Error initializing tags:', error);
      toast({
        variant: "destructive",
        title: "Error initializing tags",
        description: error instanceof Error ? error.message : "Failed to initialize tags",
      });
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from("tags")
        .select("*");

      if (error) {
        throw error;
      }

      setAvailableTags(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching tags",
        description: error instanceof Error ? error.message : "Failed to fetch tags",
      });
    }
  };

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
        ),
        comments (count)
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to upload files",
      });
      navigate("/login");  
      return;
    }

    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newFiles: FileUpload[] = [];

      for (const file of files) {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        console.log('Attempting to upload:', {
          fileName,
          fileSize: file.size,
          fileType: file.type
        });

        // Simple upload attempt
        const { data, error: uploadError } = await supabase.storage
          .from('post-attachments')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('post-attachments')
          .getPublicUrl(fileName);

        newFiles.push({
          id: fileName,
          name: file.name,
          url: publicUrl,
          size: file.size
        });
      }

      setUploadedFiles(prev => [...prev, ...newFiles]);
      toast({
        title: "Files uploaded",
        description: `Successfully uploaded ${newFiles.length} file(s)`
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      let errorMessage = "Failed to upload file";
      
      if (error instanceof Error) {
        // Handle specific Supabase storage errors
        if (error.message.includes('duplicate')) {
          errorMessage = "A file with this name already exists";
        } else if (error.message.includes('permission')) {
          errorMessage = "You don't have permission to upload files. Please check storage policies.";
        } else if (error.message.includes('bucket')) {
          errorMessage = "Storage setup issue. Please check if the bucket exists.";
        } else if (error.message.includes('row level security')) {
          errorMessage = "Storage permissions need to be configured. Please contact the administrator.";
        } else if (error.message.includes('not authorized')) {
          errorMessage = "You need to be logged in to upload files.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        variant: "destructive",
        title: "Upload failed",
        description: errorMessage
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = async (fileId: string) => {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to remove files",
      });
      navigate("/login");
      return;
    }

    try {
      const file = uploadedFiles.find(f => f.id === fileId);
      if (!file) return;

      const filePath = `${session.session.user.id}/${fileId}`;
      const { error } = await supabase.storage
        .from('post-attachments')
        .remove([filePath]);

      if (error) throw error;

      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      toast({
        title: "File removed",
        description: `Removed ${file.name}`
      });
    } catch (error) {
      console.error('Error removing file:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove file"
      });
    }
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

    if (isUploading) {
      toast({
        variant: "destructive",
        title: "Please wait",
        description: "Files are still uploading",
      });
      return;
    }

    const preview = generatePreview(newPost.content);

    const { data: post, error: postError } = await supabase.from("posts").insert({
      title: newPost.title,
      content: newPost.content,
      preview: preview,
      author_id: session.session.user.id,
      attachments: uploadedFiles.length > 0 ? uploadedFiles.map(file => ({
        name: file.name,
        url: file.url,
        size: file.size
      })) : null
    }).select().single();

    if (postError) {
      toast({
        variant: "destructive",
        title: "Error creating post",
        description: postError.message,
      });
      return;
    }

    // Insert post tags
    if (newPost.tags.length > 0 && post) {
      const validTags = newPost.tags.map(tagName => {
        const tag = availableTags.find(t => t.name === tagName);
        return tag ? {
          post_id: post.id,
          tag_id: tag.id
        } : null;
      }).filter((tag): tag is { post_id: string; tag_id: string } => tag !== null);

      if (validTags.length > 0) {
        const { error: tagError } = await supabase.from("posts_tags").insert(validTags);

        if (tagError) {
          toast({
            variant: "destructive",
            title: "Error adding tags",
            description: tagError.message,
          });
          return;
        }
      }
    }



    toast({
      title: "Success",
      description: "Post created successfully",
    });

    setNewPost({ title: "", content: "", tags: [] });
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
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-muted-foreground">Add or select tags for your post:</span>
              </div>
              <Command className="rounded-lg border shadow-md">
                <CommandInput 
                  placeholder="Search existing tags or type a new tag..."
                  value={newTagInput}
                  onValueChange={setNewTagInput}
                />
                <CommandList>
                  <CommandEmpty>
                    {newTagInput && (
                      <div className="p-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start text-sm"
                          onClick={async () => {
                            // Create new tag
                            const { data: newTag, error } = await supabase
                              .from('tags')
                              .insert({ name: newTagInput.trim() })
                              .select()
                              .single();

                            if (error) {
                              toast({
                                variant: "destructive",
                                title: "Error creating tag",
                                description: error.message,
                              });
                              return;
                            }

                            // Add new tag to availableTags
                            setAvailableTags(prev => [...prev, newTag]);
                            
                            // Add new tag to selected tags
                            setNewPost(prev => ({
                              ...prev,
                              tags: [...prev.tags, newTag.name]
                            }));

                            // Clear input
                            setNewTagInput("");

                            toast({
                              title: "Tag created",
                              description: `Created new tag: ${newTag.name}`
                            });
                          }}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create tag "{newTagInput}"
                        </Button>
                      </div>
                    )}
                  </CommandEmpty>
                  <CommandGroup heading="Available Tags">
                    {availableTags
                      .filter(tag => 
                        tag.name.toLowerCase().includes(newTagInput.toLowerCase())
                      )
                      .map((tag) => (
                        <CommandItem
                          key={tag.id}
                          onSelect={() => {
                            setNewPost(prev => ({
                              ...prev,
                              tags: prev.tags.includes(tag.name)
                                ? prev.tags.filter(t => t !== tag.name)
                                : [...prev.tags, tag.name]
                            }));
                            setNewTagInput("");
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {newPost.tags.includes(tag.name) ? (
                              <Badge variant="default">{tag.name}</Badge>
                            ) : (
                              <Badge variant="outline">{tag.name}</Badge>
                            )}
                          </div>
                        </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
              <div className="flex flex-wrap gap-2">
                {newPost.tags.map((tagName) => (
                  <Badge
                    key={tagName}
                    variant="default"
                    className="cursor-pointer hover:bg-primary/90 transition-colors"
                    onClick={() => {
                      setNewPost(prev => ({
                        ...prev,
                        tags: prev.tags.filter(t => t !== tagName)
                      }));
                    }}
                  >
                    {tagName}
                    <X className="ml-1 h-3 w-3" onClick={() => {
                      setNewPost(prev => ({
                        ...prev,
                        tags: prev.tags.filter(t => t !== tagName)
                      }));
                    }} />
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-muted-foreground">Add attachments:</span>
              </div>
              <div className="flex flex-col gap-4">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Files
                    </>
                  )}
                </Button>
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({Math.round(file.size / 1024)}KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-muted-foreground">Add attachments:</span>
              </div>
              <div className="flex flex-col gap-4">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Files
                    </>
                  )}
                </Button>
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({Math.round(file.size / 1024)}KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
                answers={post.comments?.[0]?.count || 0}
                author={post.profiles.username}
                role="student"
                timestamp={new Date(post.created_at).toLocaleDateString()}
                trending={true}
                tags={post.posts_tags.map((pt) => pt.tags.name)}
                attachments={post.attachments}
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
                answers={post.comments?.[0]?.count || 0}
                author={post.profiles.username}
                role="student"
                timestamp={new Date(post.created_at).toLocaleDateString()}
                tags={post.posts_tags.map((pt) => pt.tags.name)}
                attachments={post.attachments}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
