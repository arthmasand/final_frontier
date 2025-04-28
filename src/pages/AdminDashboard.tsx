import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, School, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Course = {
  id: string;
  name: string;
};

type Subject = {
  id: string;
  name: string;
  course_id: string;
  semester: number;
};

const AdminDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("courses");
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newCourse, setNewCourse] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (profile && profile.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [profile, navigate, toast]);

  // Fetch courses and subjects
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch courses
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select("*")
          .order("name");

        if (coursesError) throw coursesError;
        setCourses(coursesData || []);

        // Fetch subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from("subjects")
          .select("*")
          .order("name");

        if (subjectsError) throw subjectsError;
        setSubjects(subjectsData || []);

        // Set default selected course if available
        if (coursesData && coursesData.length > 0 && !selectedCourse) {
          setSelectedCourse(coursesData[0].id);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleAddCourse = async () => {
    if (!newCourse.trim()) {
      toast({
        title: "Error",
        description: "Course name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsAddingCourse(true);
    try {
      const { data, error } = await supabase
        .from("courses")
        .insert([{ name: newCourse.trim() }])
        .select();

      if (error) throw error;

      setCourses([...courses, data[0]]);
      setNewCourse("");
      toast({
        title: "Success",
        description: "Course added successfully",
      });
    } catch (error) {
      console.error("Error adding course:", error);
      toast({
        title: "Error",
        description: "Failed to add course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingCourse(false);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.trim() || !selectedCourse || !selectedSemester) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsAddingSubject(true);
    try {
      const { data, error } = await supabase
        .from("subjects")
        .insert([{
          name: newSubject.trim(),
          course_id: selectedCourse,
          semester: selectedSemester
        }])
        .select();

      if (error) throw error;

      setSubjects([...subjects, data[0]]);
      setNewSubject("");
      toast({
        title: "Success",
        description: "Subject added successfully",
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding subject:", error);
      toast({
        title: "Error",
        description: "Failed to add subject. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingSubject(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This will also delete all associated subjects.")) {
      return;
    }

    try {
      // First delete all subjects associated with this course
      const { error: subjectsError } = await supabase
        .from("subjects")
        .delete()
        .eq("course_id", courseId);

      if (subjectsError) throw subjectsError;

      // Then delete the course
      const { error: courseError } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

      if (courseError) throw courseError;

      // Update state
      setCourses(courses.filter(course => course.id !== courseId));
      setSubjects(subjects.filter(subject => subject.course_id !== courseId));
      
      toast({
        title: "Success",
        description: "Course and associated subjects deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting course:", error);
      toast({
        title: "Error",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm("Are you sure you want to delete this subject?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("subjects")
        .delete()
        .eq("id", subjectId);

      if (error) throw error;

      setSubjects(subjects.filter(subject => subject.id !== subjectId));
      toast({
        title: "Success",
        description: "Subject deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast({
        title: "Error",
        description: "Failed to delete subject. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getCourseName = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.name : "Unknown Course";
  };

  const filteredSubjects = selectedCourse 
    ? subjects.filter(subject => subject.course_id === selectedCourse)
    : subjects;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="courses">
            <School className="mr-2 h-4 w-4" />
            Manage Courses
          </TabsTrigger>
          <TabsTrigger value="subjects">
            <BookOpen className="mr-2 h-4 w-4" />
            Manage Subjects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Courses</CardTitle>
              <CardDescription>
                Add, edit or remove courses available in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="New course name"
                    value={newCourse}
                    onChange={(e) => setNewCourse(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddCourse} disabled={isAddingCourse}>
                  {isAddingCourse ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add Course
                </Button>
              </div>

              {courses.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No courses found</AlertTitle>
                  <AlertDescription>
                    Add your first course using the form above.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-4 border rounded-md"
                    >
                      <div>
                        <p className="font-medium">{course.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {subjects.filter(s => s.course_id === course.id).length} subjects
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteCourse(course.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <CardTitle>Subjects</CardTitle>
              <CardDescription>
                Manage subjects for each course and semester
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="course-select">Filter by Course</Label>
                    <Select
                      value={selectedCourse || ""}
                      onValueChange={setSelectedCourse}
                    >
                      <SelectTrigger id="course-select">
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Subject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Subject</DialogTitle>
                          <DialogDescription>
                            Create a new subject for a specific course and semester
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="subject-name">Subject Name</Label>
                            <Input
                              id="subject-name"
                              placeholder="e.g., Mathematics, Physics"
                              value={newSubject}
                              onChange={(e) => setNewSubject(e.target.value)}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="subject-course">Course</Label>
                            <Select
                              value={selectedCourse || ""}
                              onValueChange={setSelectedCourse}
                            >
                              <SelectTrigger id="subject-course">
                                <SelectValue placeholder="Select a course" />
                              </SelectTrigger>
                              <SelectContent>
                                {courses.map((course) => (
                                  <SelectItem key={course.id} value={course.id}>
                                    {course.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="subject-semester">Semester</Label>
                            <Select
                              value={selectedSemester?.toString() || ""}
                              onValueChange={(value) => setSelectedSemester(parseInt(value))}
                            >
                              <SelectTrigger id="subject-semester">
                                <SelectValue placeholder="Select semester" />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                  <SelectItem key={sem} value={sem.toString()}>
                                    Semester {sem}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddSubject} disabled={isAddingSubject}>
                            {isAddingSubject ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              "Add Subject"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>

              {filteredSubjects.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No subjects found</AlertTitle>
                  <AlertDescription>
                    {selectedCourse
                      ? "No subjects found for the selected course. Add your first subject using the button above."
                      : "Please select a course to view its subjects or add a new subject."}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4">
                  {filteredSubjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between p-4 border rounded-md"
                    >
                      <div>
                        <p className="font-medium">{subject.name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{getCourseName(subject.course_id)}</Badge>
                          <Badge>Semester {subject.semester}</Badge>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteSubject(subject.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
