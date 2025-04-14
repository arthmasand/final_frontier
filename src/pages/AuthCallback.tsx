import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Get session and user data
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Get user's profile to determine role
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      // If no profile exists, create one using metadata
      if (!profile) {
        const role = session.user.user_metadata.role;
        if (!role) {
          navigate("/login");
          return;
        }

        await supabase.from("profiles").insert({
          id: session.user.id,
          role: role,
          username: session.user.email?.split("@")[0],
          updated_at: new Date().toISOString(),
        });

        // Redirect based on role
        if (role === "teacher") {
          navigate("/teacher");
        } else if (role === "student") {
          navigate("/student");
        } else {
          navigate("/login");
        }
      } else {
        // Redirect based on existing role
        if (profile.role === "teacher") {
          navigate("/teacher");
        } else if (profile.role === "student") {
          navigate("/student");
        } else {
          navigate("/login");
        }
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Signing you in...</h1>
        <p className="text-muted-foreground">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}
