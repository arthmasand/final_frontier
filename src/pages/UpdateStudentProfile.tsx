import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function UpdateStudentProfile() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState(profile?.course || "");
  const [semester, setSemester] = useState(profile?.semester || "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user || profile?.role !== "student") {
      navigate("/");
      return;
    }
    
    // Update form values when profile loads
    if (profile) {
      setCourse(profile.course || "");
      setSemester(profile.semester || "");
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          course,
          semester
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your course and semester information has been updated."
      });
      
      // Redirect based on role
      if (profile?.role === "student") {
        navigate("/student");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Update Your Profile</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Course</label>
          <select 
            className="w-full p-2 border rounded-md"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            required
          >
            <option value="">Select your course</option>
            <option value="CSE">Computer Science (CSE)</option>
            <option value="IT">Information Technology (IT)</option>
            <option value="ECE">Electronics & Communication (ECE)</option>
            <option value="BIOTECH">Biotechnology</option>
            <option value="BBA">Business Administration (BBA)</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Semester</label>
          <select 
            className="w-full p-2 border rounded-md"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            required
          >
            <option value="">Select your semester</option>
            <option value="Semester 1">Semester 1</option>
            <option value="Semester 2">Semester 2</option>
            <option value="Semester 3">Semester 3</option>
            <option value="Semester 4">Semester 4</option>
            <option value="Semester 5">Semester 5</option>
            <option value="Semester 6">Semester 6</option>
            <option value="Semester 7">Semester 7</option>
            <option value="Semester 8">Semester 8</option>
          </select>
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update Profile"}
        </Button>
      </form>
    </div>
  );
}
