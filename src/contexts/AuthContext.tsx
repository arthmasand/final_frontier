import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  signInWithEmail: (email: string, role: "student" | "teacher") => Promise<void>;
  signOut: () => Promise<void>;
  isTeacher: boolean;
  isModerator: boolean;
  moderatorTimeSlot: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [moderatorTimeSlot, setModeratorTimeSlot] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check active sessions and set the user
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Current session:', session);
        
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
          await checkModeratorStatus(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setModeratorTimeSlot(null);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            console.log('Auth state changed:', _event, session);
            
            if (session?.user) {
              setUser(session.user);
              await fetchProfile(session.user.id);
              await checkModeratorStatus(session.user.id);
            } else {
              setUser(null);
              setProfile(null);
              setModeratorTimeSlot(null);
            }
          }
        );

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Error in initializeAuth:', error);
        setUser(null);
        setProfile(null);
        setModeratorTimeSlot(null);
      }
    };

    initializeAuth();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // Get session to access metadata
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session in fetchProfile');
        return;
      }

      console.log('Fetching profile for user:', userId);

      // Try to get existing profile
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        return;
      }

      // If profile exists, use it
      if (profile) {
        console.log('Found existing profile:', profile);
        setProfile(profile);
        return;
      }

      // If no profile, create one
      const role = session.user.user_metadata.role;
      if (!role) {
        console.error('No role in metadata');
        return;
      }

      // Create minimal profile with only required fields
      const profileData = {
        id: userId,
        username: session.user.email?.split('@')[0] || 'user',
        role: role
      };

      console.log('Creating new profile:', profileData);

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        return;
      }

      console.log('Created new profile:', newProfile);
      setProfile(newProfile);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const checkModeratorStatus = async (userId: string) => {
    try {
      // First check if user is a student
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profile?.role !== "student") {
        setModeratorTimeSlot(null);
        return;
      }

      // Then check if they are assigned as a moderator
      const { data: assignment, error } = await supabase
        .from("moderator_assignments")
        .select("time_slot")
        .eq("student_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") { // No assignment found
          setModeratorTimeSlot(null);
        } else {
          console.error("Error checking moderator status:", error);
          setModeratorTimeSlot(null);
        }
        return;
      }

      setModeratorTimeSlot(assignment.time_slot);
    } catch (error) {
      console.error("Error checking moderator status:", error);
      setModeratorTimeSlot(null);
    }
  };

  const signInWithEmail = async (email: string, role: "student" | "teacher") => {
    try {
      // First check if user exists and get their current role
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("role")
        .eq("email", email)
        .single();

      // Use existing role if available, otherwise use provided role
      const finalRole = existingUser?.role || role;

      // Send magic link
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: { role: finalRole }, // Store role in user metadata
          emailRedirectTo: `${window.location.origin}/auth/callback` // Redirect to correct dashboard
        }
      });

      if (signInError) throw signInError;
    } catch (error) {
      console.error("Error in signInWithEmail:", error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    navigate("/");
  };

  const value = {
    user,
    profile,
    signInWithEmail,
    signOut,
    isTeacher: profile?.role === "teacher",
    isModerator: moderatorTimeSlot !== null,
    moderatorTimeSlot,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
