import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UnansweredPost {
  id: string;
  title: string;
  created_at: string;
  author: string;
  course?: string;
  semester?: string;
  subject?: string;
}

export function UnansweredPostsAlert() {
  const [unansweredPosts, setUnansweredPosts] = useState<UnansweredPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnansweredPosts();
    
    // Set up a polling interval to check for new unanswered posts every 5 minutes
    const interval = setInterval(fetchUnansweredPosts, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchUnansweredPosts = async () => {
    setIsLoading(true);
    try {
      // Get posts that are:
      // 1. Older than 2 hours
      // 2. Have no responses
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
      
      const { data, error } = await supabase 
        .from('posts')
        .select(`
          id,
          title,
          created_at,
          author_id,
          has_responses,
          profiles!posts_author_id_fkey(username),
          posts_tags(tags(name))
        `)
        .eq('has_responses', false)
        .lt('created_at', twoHoursAgo.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        const formattedPosts = data.map(post => {
          // Extract course, semester, and subject tags
          const tags = post.posts_tags.map((pt: any) => pt.tags.name);
          const course = tags.find((tag: string) => 
            ['CSE', 'IT', 'BIOTECH', 'ECE', 'BBA'].includes(tag)
          );
          const semester = tags.find((tag: string) => 
            tag.startsWith('Semester ') || tag === 'Miscellaneous'
          );
          const subject = tags.find((tag: string) => 
            !['CSE', 'IT', 'BIOTECH', 'ECE', 'BBA'].includes(tag) && 
            !tag.startsWith('Semester ') && 
            tag !== 'Miscellaneous' &&
            !['Academic', 'Events', 'Campus Life', 'Questions', 'Discussion', 
              'Announcement', 'Help Wanted', 'Resources', 'Student Activities', 'Faculty'].includes(tag)
          );
          
          // Handle profiles data which could be an array or object
          let authorName = 'Unknown User';
          if (post.profiles) {
            if (Array.isArray(post.profiles)) {
              authorName = post.profiles.length > 0 ? post.profiles[0].username : 'Unknown User';
            } else {
              authorName = (post.profiles as any).username || 'Unknown User';
            }
          }
          
          return {
            id: post.id,
            title: post.title,
            created_at: post.created_at,
            author: authorName,
            course,
            semester,
            subject
          };
        });
        
        setUnansweredPosts(formattedPosts);
      }
    } catch (error) {
      console.error('Error fetching unanswered posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'some time ago';
    }
  };

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  if (unansweredPosts.length === 0) {
    return null; // Don't show anything if there are no unanswered posts
  }

  return (
    <div className="mb-8">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Attention Required</AlertTitle>
        <AlertDescription>
          There {unansweredPosts.length === 1 ? 'is' : 'are'} {unansweredPosts.length} unanswered {unansweredPosts.length === 1 ? 'post' : 'posts'} older than 2 hours.
          <Button 
            variant="link" 
            className="p-0 h-auto text-destructive-foreground underline ml-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Hide details' : 'Show details'}
          </Button>
        </AlertDescription>
      </Alert>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {unansweredPosts.map(post => (
            <Card key={post.id} className="border-destructive/20">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-medium">{post.title}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {getTimeAgo(post.created_at)}
                  </div>
                </div>
                <CardDescription>
                  Posted by {post.author}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-wrap gap-2">
                  {post.course && (
                    <Badge variant="outline" className="bg-primary/10">
                      {post.course}
                    </Badge>
                  )}
                  {post.semester && (
                    <Badge variant="outline" className="bg-secondary/10">
                      {post.semester}
                    </Badge>
                  )}
                  {post.subject && (
                    <Badge variant="outline" className="bg-accent/10">
                      {post.subject}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  View Post
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
