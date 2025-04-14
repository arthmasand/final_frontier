import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Student {
  id: string;
  username: string;
}

export function ModeratorAssignment() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [timeSlot, setTimeSlot] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("role", "student");

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch students",
      });
    }
  };

  const assignModerator = async () => {
    if (!selectedStudent || !timeSlot) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a student and time slot",
      });
      return;
    }

    setLoading(true);
    try {
      // First remove any existing assignment for this time slot
      await supabase
        .from("moderator_assignments")
        .delete()
        .eq("time_slot", timeSlot);

      // Then create the new assignment
      const { error } = await supabase
        .from("moderator_assignments")
        .insert({
          student_id: selectedStudent,
          time_slot: timeSlot,
          assigned_by: profile?.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Moderator assigned successfully",
      });

      setSelectedStudent("");
      setTimeSlot("");
    } catch (error) {
      console.error("Error assigning moderator:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign moderator",
      });
    } finally {
      setLoading(false);
    }
  };

  // Only show this component to teachers
  if (profile?.role !== "teacher") return null;

  return (
    <div className="p-4 space-y-4 border rounded-lg">
      <h2 className="text-lg font-semibold">Assign Moderator</h2>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Student</label>
          <Select
            value={selectedStudent}
            onValueChange={setSelectedStudent}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a student" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Time Slot</label>
          <Select
            value={timeSlot}
            onValueChange={setTimeSlot}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a time slot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
              <SelectItem value="afternoon">Afternoon (12 PM - 3 PM)</SelectItem>
              <SelectItem value="evening">Evening (3 PM - 6 PM)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={assignModerator}
          disabled={loading || !selectedStudent || !timeSlot}
        >
          {loading ? "Assigning..." : "Assign Moderator"}
        </Button>
      </div>
    </div>
  );
}
