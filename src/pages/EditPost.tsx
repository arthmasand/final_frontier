import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Loader2, FileIcon } from "lucide-react";

interface Tag {
  id: string;
  name: string;
}

interface FileUpload {
  id: string;
  name: string;
  url: string;
  size: number;
}

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [post, setPost] = useState({
    title: "",
    content: "",
    tags: [] as string[],
  });
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPost();
    fetchTags();
  }, [id]);

  const fetchPost = async () => {
    if (!id) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please sign in to edit posts",
        });
        navigate("/login");
        return;
      }

      const { data: post, error } = await supabase
        .from("posts")
        .select(`
          *,
          posts_tags (
            tags (
              name
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      // Check if user is the author
      if (post.author_id !== session.session.user.id) {
        toast({
          variant: "destructive",
          title: "Unauthorized",
          description: "You can only edit your own posts",
        });
        navigate("/");
        return;
      }

      setPost({
        title: post.title,
        content: post.content,
        tags: post.posts_tags.map((pt: any) => pt.tags.name),
      });
      setUploadedFiles(
        (post.attachments || []).map(attachment => ({
          id: attachment.url, // Using URL as ID since we don't have one in storage
          name: attachment.name,
          url: attachment.url,
          size: attachment.size
        }))
      );
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching post",
        description: error instanceof Error ? error.message : "Failed to fetch post",
      });
      navigate("/");
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from("tags")
        .select("*");

      if (error) throw error;
      setAvailableTags(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching tags",
        description: error instanceof Error ? error.message : "Failed to fetch tags",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
          size: file.size,
        });
      }

      setUploadedFiles([...uploadedFiles, ...newFiles]);
      toast({
        title: "Files uploaded",
        description: `Successfully uploaded ${newFiles.length} file(s)`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error uploading files",
        description: error instanceof Error ? error.message : "Failed to upload files",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.id !== fileId));
  };

  const handleSubmit = async () => {
    if (!id) return;

    try {
      setIsLoading(true);

      // Update post
      const { error: updateError } = await supabase
        .from("posts")
        .update({
          title: post.title,
          content: post.content,
          attachments: uploadedFiles.length > 0 ? uploadedFiles : null,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // Delete existing tags
      const { error: deleteError } = await supabase
        .from("posts_tags")
        .delete()
        .eq("post_id", id);

      if (deleteError) throw deleteError;

      // Insert new tags
      if (post.tags.length > 0) {
        const { error: tagError } = await supabase
          .from("posts_tags")
          .insert(
            post.tags.map((tagName) => ({
              post_id: id,
              tag_id: availableTags.find((t) => t.name === tagName)?.id,
            }))
          );

        if (tagError) throw tagError;
      }

      toast({
        title: "Success",
        description: "Post updated successfully",
      });

      navigate(`/post/${id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating post",
        description: error instanceof Error ? error.message : "Failed to update post",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Edit Post</h1>
        <div className="space-y-4">
          <div>
            <Input
              placeholder="Title"
              value={post.title}
              onChange={(e) => setPost({ ...post, title: e.target.value })}
            />
          </div>
          <div>
            <Textarea
              placeholder="Content"
              value={post.content}
              onChange={(e) => setPost({ ...post, content: e.target.value })}
              className="min-h-[200px]"
            />
          </div>
          <div>
            <Command>
              <CommandInput placeholder="Search tags..." />
              <CommandList>
                <CommandEmpty>No tags found.</CommandEmpty>
                <CommandGroup>
                  {availableTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => {
                        if (!post.tags.includes(tag.name)) {
                          setPost({
                            ...post,
                            tags: [...post.tags, tag.name],
                          });
                        }
                      }}
                    >
                      {tag.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            <div className="flex flex-wrap gap-2 mt-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    onClick={() =>
                      setPost({
                        ...post,
                        tags: post.tags.filter((t) => t !== tag),
                      })
                    }
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          <div>
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
              <div className="space-y-2 mt-2">
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate(`/post/${id}`)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPost;
