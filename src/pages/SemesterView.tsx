import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { PlusCircle, BookOpen, Filter, BookOpen as BookIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
// import { subjectsData, getSubjectsForBranchAndSemester } from "@/lib/subjectsData";

// Define available semesters
const SEMESTERS = ["All Semesters", "Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8", "Miscellaneous"];

type Profile = {
  username: string;
  role?: string;
};

interface Post {
  id: string;
  title: string;
  preview: string;
  content: string;
  votes: number;
  created_at: string;
  author_id: string;
  author: string;
  role: string;
  tags: string[];
}

export default function SemesterView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableCourses, setAvailableCourses] = useState<string[]>(["All Courses"]);
  const [selectedCourse, setSelectedCourse] = useState<string>(searchParams.get("course") || "All Courses");
  const [selectedSemester, setSelectedSemester] = useState<string>(searchParams.get("semester") || "All Semesters");
  const [selectedSubject, setSelectedSubject] = useState<string>(searchParams.get("subject") || "All Subjects");
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data: courses, error } = await supabase
          .from('courses')
          .select('name')
          .order('name');
        
        if (error) throw error;
        
        // Add "All Courses" option at the beginning
        const courseNames = ["All Courses", ...(courses?.map(c => c.name) || [])];
        setAvailableCourses(courseNames);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load courses. Please try again.'
        });
      }
    };
    
    fetchCourses();
  }, [toast]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Get subjects for the selected branch and semester from the database
    const fetchSubjects = async () => {
      if (selectedCourse !== "All Courses" && selectedSemester !== "All Semesters") {
        try {
          // Extract semester number from string like "Semester 3"
          const semesterNumber = parseInt(selectedSemester.split(' ')[1]);
          
          // First get the course ID
          const { data: courseData, error: courseError } = await supabase
            .from('courses')
            .select('id')
            .eq('name', selectedCourse)
            .single();
          
          if (courseError) throw courseError;
          
          // Then fetch subjects using the course ID
          const { data: subjects, error } = await supabase
            .from('subjects')
            .select('name')
            .eq('semester', semesterNumber)
            .eq('course_id', courseData.id);
          
          if (error) throw error;
          
          // Extract subject names and add "All Subjects" option
          const subjectNames = subjects?.map(s => s.name) || [];
          setAvailableSubjects(["All Subjects", ...subjectNames]);
        } catch (error) {
          console.error('Error fetching subjects:', error);
          setAvailableSubjects(["All Subjects"]);
        }
      } else {
        setAvailableSubjects(["All Subjects"]);
      }
    };
    
    fetchSubjects();
  }, [selectedCourse, selectedSemester]);

  useEffect(() => {
    // Update available subjects when course or semester changes
    if (selectedCourse !== "All Courses" && selectedSemester !== "All Semesters") {
      // Reset subject selection if the current selection is not available
      if (selectedSubject !== "All Subjects" && !availableSubjects.includes(selectedSubject)) {
        setSelectedSubject("All Subjects");
        searchParams.set("subject", "All Subjects");
        setSearchParams(searchParams);
      }
    } else {
      setAvailableSubjects(["All Subjects"]);
      if (selectedSubject !== "All Subjects") {
        setSelectedSubject("All Subjects");
        searchParams.set("subject", "All Subjects");
        setSearchParams(searchParams);
      }
    }
    
    fetchPosts();
  }, [selectedCourse, selectedSemester, selectedSubject, user, navigate]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      // Simple approach: Get all posts first
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id, 
          title, 
          preview, 
          content, 
          votes, 
          created_at, 
          author_id
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setIsLoading(false);
        return;
      }

      // Get all post tags in a single query
      const { data: allPostTags, error: tagsError } = await supabase
        .from('posts_tags')
        .select(`
          post_id,
          tags(id, name)
        `);

      if (tagsError) throw tagsError;

      // Get all profiles in a single query
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, role');

      if (profilesError) throw profilesError;

      // Process posts with tags and author info
      const processedPosts = postsData.map(post => {
        // Find tags for this post
        const postTagEntries = allPostTags?.filter(pt => pt.post_id === post.id) || [];
        const tagNames = postTagEntries.map(pt => {
          if (pt.tags) {
            // Handle both array and object structures
            if (Array.isArray(pt.tags)) {
              return pt.tags.length > 0 && pt.tags[0].name ? pt.tags[0].name : '';
            } else {
              // Handle as object
              return typeof (pt.tags as any).name === 'string' ? (pt.tags as any).name : '';
            }
          }
          return '';
        }).filter(Boolean);

        // Find author info
        const authorProfile = profiles?.find(p => p.id === post.author_id);
        const authorName = authorProfile?.username || 'Unknown User';
        const authorRole = authorProfile?.role || 'student';

        return {
          id: post.id,
          title: post.title,
          preview: post.preview || '',
          content: post.content || '',
          votes: post.votes || 0,
          created_at: post.created_at,
          author_id: post.author_id,
          author: authorName,
          role: authorRole,
          tags: tagNames
        };
      });

      // Apply filters
      let filteredPosts = processedPosts;
      
      if (selectedCourse !== "All Courses") {
        filteredPosts = filteredPosts.filter(post => 
          post.tags.includes(selectedCourse)
        );
      }
      
      if (selectedSemester !== "All Semesters") {
        filteredPosts = filteredPosts.filter(post => 
          post.tags.includes(selectedSemester)
        );
      }
      
      if (selectedSubject !== "All Subjects") {
        filteredPosts = filteredPosts.filter(post => 
          post.tags.includes(selectedSubject)
        );
      }

      setPosts(filteredPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        variant: "destructive",
        title: "Error fetching posts",
        description: error instanceof Error ? error.message : "Failed to fetch posts",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseChange = (value: string) => {
    setSelectedCourse(value);
    searchParams.set("course", value);
    setSearchParams(searchParams);
  };

  const handleSemesterChange = (value: string) => {
    setSelectedSemester(value);
    searchParams.set("semester", value);
    setSearchParams(searchParams);
  };
  
  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    searchParams.set("subject", value);
    setSearchParams(searchParams);
  };

  // Group posts by semester for the "All Semesters" view
  const groupedPosts = () => {
    const groups: Record<string, Post[]> = {};
    
    // Initialize all semester groups
    SEMESTERS.slice(1).forEach(semester => {
      groups[semester] = [];
    });
    
    // Add posts to their respective semester groups
    posts.forEach(post => {
      let added = false;
      
      // Check which semester tag the post has
      for (const tagName of post.tags) {
        if (SEMESTERS.slice(1).includes(tagName)) {
          groups[tagName].push(post);
          added = true;
          break; // A post should only be in one semester
        }
      }
      
      // If post doesn't have a semester tag, add to Miscellaneous
      if (!added) {
        groups["Miscellaneous"].push(post);
      }
    });
    
    return groups;
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Posts by Semester</h1>
        <div className="flex gap-2">
          {user?.role === 'teacher' && (
            <Button 
              variant="outline"
              onClick={() => navigate('/teacher')} 
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Back to Dashboard
            </Button>
          )}
          <Button 
            onClick={() => navigate('/home?create=true')} 
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Create Post
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Course</label>
          <Select value={selectedCourse} onValueChange={handleCourseChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select Course" />
            </SelectTrigger>
            <SelectContent>
              {availableCourses.map((course) => (
                <SelectItem key={course} value={course}>
                  {course}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Semester</label>
          <Select value={selectedSemester} onValueChange={handleSemesterChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              {SEMESTERS.map(semester => (
                <SelectItem key={semester} value={semester}>
                  {semester}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Subject</label>
          <Select 
            value={selectedSubject} 
            onValueChange={handleSubjectChange} 
            disabled={availableSubjects.length <= 1}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {availableSubjects.map(subject => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading posts...</p>
          </div>
        </div>
      ) : (
        <>
          {selectedSemester === "All Semesters" ? (
            <div className="space-y-8">
              {Object.entries(groupedPosts()).map(([semester, semesterPosts]) => (
                semesterPosts.length > 0 && (
                  <div key={semester} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">{semester}</h2>
                      <Badge variant="outline">{semesterPosts.length}</Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {semesterPosts.map(post => (
                        <PostCard
                          key={post.id}
                          id={post.id}
                          title={post.title}
                          preview={post.preview}
                          votes={post.votes}
                          answers={0}
                          author={post.author}
                          role={post.role as any}
                          timestamp={new Date(post.created_at).toLocaleDateString()}
                          tags={post.tags}
                        />
                      ))}
                    </div>
                  </div>
                )
              ))}
              
              {posts.length === 0 && (
                <div className="text-center py-12 bg-muted/20 rounded-lg">
                  <p className="text-muted-foreground mb-4">No posts found for the selected filters</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedCourse("All Courses");
                      setSelectedSemester("All Semesters");
                      setSelectedSubject("All Subjects");
                      searchParams.delete("course");
                      searchParams.delete("semester");
                      searchParams.delete("subject");
                      setSearchParams(searchParams);
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {posts.map(post => (
                    <PostCard
                      key={post.id}
                      id={post.id}
                      title={post.title}
                      preview={post.preview}
                      votes={post.votes}
                      answers={0}
                      author={post.author}
                      role={post.role as any}
                      timestamp={new Date(post.created_at).toLocaleDateString()}
                      tags={post.tags}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/20 rounded-lg">
                  <p className="text-muted-foreground mb-4">No posts found for {selectedSemester}</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedCourse("All Courses");
                      setSelectedSemester("All Semesters");
                      setSelectedSubject("All Subjects");
                      searchParams.delete("course");
                      searchParams.delete("semester");
                      searchParams.delete("subject");
                      setSearchParams(searchParams);
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
