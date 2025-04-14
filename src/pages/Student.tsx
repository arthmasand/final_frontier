import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Student() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile && profile.role !== "student") {
      navigate("/");
    }
  }, [profile, navigate]);

  if (!profile || profile.role !== "student") {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>
      
      <div className="grid gap-6">
        {/* Add student-specific features here */}
      </div>
    </div>
  );
}
