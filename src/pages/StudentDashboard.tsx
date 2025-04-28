import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Clock, BookOpen, MessageSquare, BarChart3, PlusCircle, GraduationCap, UserCog } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";

// Available courses
const COURSES = ["CSE", "IT", "BIOTECH", "ECE", "BBA"];

export default function StudentDashboard() {
  const { user, profile, isModerator, moderatorTimeSlot } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ posts: 0, comments: 0, questions: 0 });
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [userCourse, setUserCourse] = useState<string | null>(null);

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

        // Get questions count (posts with 'Questions' tag)
        const { data: questionPosts } = await supabase
          .from('posts')
          .select(`
            id,
            posts_tags(tags(name))
          `)
          .eq('author_id', user.id);

        // Count posts that have the 'Questions' tag
        const questionsCount = questionPosts?.filter(post => {
          return post.posts_tags && post.posts_tags.some(pt => {
            // Check if tags is an array and handle accordingly
            if (Array.isArray(pt.tags)) {
              return pt.tags.some(tag => tag.name === 'Questions');
            }
            // Handle case where tags is a single object
            return pt.tags && (pt.tags as any).name === 'Questions';
          });
        }).length || 0;

        setStats({
          posts: postCount || 0,
          comments: commentCount || 0,
          questions: questionsCount
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

    // Load user's course preference if it exists
    const loadUserCourse = async () => {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('course')
          .eq('user_id', user.id)
          .single();

        if (data && data.course) {
          setUserCourse(data.course);
          setSelectedCourse(data.course);
        }
      } catch (error) {
        console.error('Error loading user course:', error);
      }
    };

    loadUserCourse();
  }, [user, profile, navigate]);

  // Save user course preference
  const saveUserCourse = async (course: string) => {
    if (!user) return;
    
    try {
      // Check if preference already exists
      const { data } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        // Update existing preference
        await supabase
          .from('user_preferences')
          .update({ course })
          .eq('user_id', user.id);
      } else {
        // Create new preference
        await supabase
          .from('user_preferences')
          .insert({ user_id: user.id, course });
      }
      
      setUserCourse(course);
    } catch (error) {
      console.error('Error saving course preference:', error);
    }
  };

  const handleCourseSelect = (course: string) => {
    setSelectedCourse(course);
    saveUserCourse(course);
  };

  const navigateToSemesterView = () => {
    const params = new URLSearchParams();
    if (selectedCourse) {
      params.append('course', selectedCourse);
    }
    navigate(`/semester-view?${params.toString()}`);
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold">Welcome, {profile.username}!</h1>
          <p className="text-muted-foreground mt-2">
            {userCourse ? `${userCourse} Student` : 'Select your course to personalize your experience'}
          </p>
        </div>
        
        <div className="w-full md:w-auto">
          <Select
            value={selectedCourse || ''}
            onValueChange={handleCourseSelect}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Select your course" />
            </SelectTrigger>
            <SelectContent>
              {COURSES.map(course => (
                <SelectItem key={course} value={course}>
                  {course}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isModerator && (
        <Alert className="mb-8">
          <AlertDescription className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            You are a moderator for the {moderatorTimeSlot} time slot
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Academic Resources
            </CardTitle>
            <CardDescription>
              Access course materials and discussions organized by semester
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button 
                variant="outline" 
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={navigateToSemesterView}
              >
                <BookOpen className="h-8 w-8 text-primary" />
                <span>View Posts by Semester</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => navigate('/questions')}
              >
                <MessageSquare className="h-8 w-8 text-primary" />
                <span>Ask Questions</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => navigate('/home?create=true')}
              >
                <PlusCircle className="h-8 w-8 text-primary" />
                <span>Create New Post</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => navigate('/update-profile')}
              >
                <UserCog className="h-8 w-8 text-primary" />
                <span>Update Academic Info</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Posts</span>
                <span className="text-2xl font-semibold">{stats.posts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Comments</span>
                <span className="text-2xl font-semibold">{stats.comments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Questions</span>
                <span className="text-2xl font-semibold">{stats.questions}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => navigate('/home')}
            >
              View Your Activity
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Campus Activity</CardTitle>
            <CardDescription>
              Stay updated with the latest discussions and announcements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent activity to display</p>
              <Button 
                variant="link" 
                onClick={() => navigate("/home")} 
                className="mt-2"
              >
                Start engaging with the community
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
