import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";

export default function StudentDashboard() {
  const { user, profile, isModerator, moderatorTimeSlot } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ posts: 0, comments: 0, questions: 0 });

  // Fetch user stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      try {
        // Get post count
        const { count: postCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact' })
          .eq('author_id', user.id);

        // Get comment count
        const { count: commentCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact' })
          .eq('author_id', user.id);

        setStats({
          posts: postCount || 0,
          comments: commentCount || 0,
          questions: 0 // TODO: Add questions table
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    if (profile?.role !== "student") {
      navigate("/");
      return;
    }
  }, [user, profile, navigate]);

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">Welcome, {profile.username}!</h1>
      
      {isModerator && (
        <Alert className="mb-8">
          <AlertDescription className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            You are a moderator for the {moderatorTimeSlot} time slot
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-2xl font-semibold mb-4">Quick Links</h2>
          <div className="space-y-2">
            <button 
              onClick={() => navigate("/home")} 
              className="w-full text-left px-4 py-2 rounded hover:bg-accent"
            >
              View Posts
            </button>
            <button 
              onClick={() => navigate("/questions")} 
              className="w-full text-left px-4 py-2 rounded hover:bg-accent"
            >
              Ask Questions
            </button>
          </div>
        </div>

        <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-2xl font-semibold mb-4">Your Stats</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Posts</p>
              <p className="text-2xl font-semibold">{stats.posts}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Comments</p>
              <p className="text-2xl font-semibold">{stats.comments}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Questions</p>
              <p className="text-2xl font-semibold">{stats.questions}</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent activity</p>
            <button 
              onClick={() => navigate("/home")} 
              className="mt-4 text-primary hover:underline"
            >
              Start engaging with the community
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
