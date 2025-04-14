import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Tables } from "@/integrations/supabase/types";

interface Student {
  id: string;
  username: string;
  role: string;
  moderator_assignments?: {
    id: string;
    student_id: string;
    time_slot: string;
    assigned_by: string;
  }[];
}

const TIME_SLOTS = [
  "10am-12pm",
  "12pm-2pm",
  "2pm-4pm",
  "4pm-6pm",
  "6pm-8pm",
  "8pm-10pm",
  "10pm-12am",
];

export default function TeacherDashboard() {
  const { user, isTeacher } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isTeacher) {
      navigate("/");
      return;
    }

    fetchStudents();
  }, [isTeacher, navigate]);

  const fetchStudents = async () => {
    try {
      // First get all students
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id, username, role')
        .eq('role', 'student')
        .order('username');

      if (studentsError) throw studentsError;

      // Then get their assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('moderator_assignments')
        .select('*')
        .in('student_id', students?.map(s => s.id) || []);

      if (assignmentsError) throw assignmentsError;

      // Combine the data
      const studentsWithAssignments = students?.map(student => ({
        ...student,
        moderator_assignments: assignments?.filter(a => a.student_id === student.id) || []
      })) || [];

      // Type assertion since we know the shape matches Student interface
      setStudents(studentsWithAssignments as Student[]);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load students. Please try again.'
      });
    }
  };

  const handleAssignModerator = async () => {
    if (!selectedStudent || !selectedTimeSlot || !user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("moderator_assignments").insert({
        student_id: selectedStudent.id,
        assigned_by: user.id,
        time_slot: selectedTimeSlot,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Moderator assigned successfully",
      });

      // Refresh the students list
      await fetchStudents();
    } catch (error) {
      console.error("Error assigning moderator:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign moderator",
      });
    } finally {
      setIsLoading(false);
      setSelectedStudent(null);
      setSelectedTimeSlot("");
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">Teacher Dashboard</h1>
      
      <div className="bg-card rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-6">Manage Moderators</h2>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Current Assignment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.username}</TableCell>
                <TableCell>
                  {student.moderator_assignments && student.moderator_assignments.length > 0 
                    ? student.moderator_assignments[0].time_slot 
                    : "Not assigned"}
                </TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedStudent(student)}
                      >
                        Assign as Moderator
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign Moderator Time Slot</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Select Time Slot</p>
                          <Select
                            value={selectedTimeSlot}
                            onValueChange={setSelectedTimeSlot}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a time slot" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_SLOTS.map((slot) => (
                                <SelectItem key={slot} value={slot}>
                                  {slot}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          className="w-full"
                          onClick={handleAssignModerator}
                          disabled={!selectedTimeSlot || isLoading}
                        >
                          {isLoading ? "Assigning..." : "Assign"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
