import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ModeratorAssignment } from "@/components/ModeratorAssignment";

export default function Teacher() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile && profile.role !== "teacher") {
      navigate("/");
    }
  }, [profile, navigate]);

  if (!profile || profile.role !== "teacher") {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Teacher Dashboard</h1>
      
      <div className="grid gap-6">
        <ModeratorAssignment />
        
        {/* Add more teacher-specific features here */}
      </div>
    </div>
  );
}
