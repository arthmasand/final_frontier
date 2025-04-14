import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session:', session);

        if (!session) {
          console.error('No session');
          navigate('/login');
          return;
        }

        // Get role from metadata
        const role = session.user.user_metadata?.role;
        console.log('Role:', role);

        if (!role) {
          console.error('No role');
          navigate('/login');
          return;
        }

        // Create/update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: session.user.id,
            username: session.user.email?.split('@')[0] || 'user',
            role: role
          });

        if (profileError) {
          console.error('Profile error:', profileError);
          navigate('/login');
          return;
        }

        // Redirect
        if (role === 'teacher') {
          navigate('/teacher');
        } else if (role === 'student') {
          navigate('/student');
        } else {
          console.error('Invalid role:', role);
          navigate('/login');
        }
      } catch (error) {
        console.error("Error in auth callback:", error);
        navigate("/login");
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
