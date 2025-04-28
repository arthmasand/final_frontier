import { Button } from "@/components/ui/button";
import { Mail, GraduationCap, School } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["student", "teacher"]),
  course: z.string().optional(),
  semester: z.string().optional(),
});

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signInWithEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher" | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: "student",
      course: "",
      semester: "",
    },
  });

  const handleEmailLogin = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // First check if user already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("role, course, semester")
        .eq("email", values.email)
        .single();

      // If user exists, use their existing role and academic info
      const roleToUse = existingProfile?.role || values.role;
      
      // Store course and semester in localStorage for new student profiles
      if (values.role === "student" && !existingProfile) {
        if (values.course) localStorage.setItem("pendingCourse", values.course);
        if (values.semester) localStorage.setItem("pendingSemester", values.semester);
      }

      await signInWithEmail(values.email, roleToUse);
      toast({
        title: "Check your email",
        description: "We've sent you a magic link to sign in",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error sending login link",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/home`
        }
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error signing in",
          description: error.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-background">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-6xl font-bold tracking-tight">Welcome</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Choose your role to continue
            </p>
          </div>
          {selectedRole ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleEmailLogin)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input 
                            placeholder="Email" 
                            type="email" 
                            className="pl-10 h-12 text-base"
                            {...field}
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <input type="hidden" {...form.register("role")} value={selectedRole} />
                
                {selectedRole === "student" && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="course"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <select 
                              className="w-full p-2 border rounded-md"
                              {...field}
                              disabled={isLoading}
                            >
                              <option value="">Select your course</option>
                              <option value="CSE">Computer Science (CSE)</option>
                              <option value="IT">Information Technology (IT)</option>
                              <option value="ECE">Electronics & Communication (ECE)</option>
                              <option value="BIOTECH">Biotechnology</option>
                              <option value="BBA">Business Administration (BBA)</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="semester"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <select 
                              className="w-full p-2 border rounded-md"
                              {...field}
                              disabled={isLoading}
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
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedRole(null)}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending link..." : "Send magic link"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full h-12 text-base flex items-center justify-center gap-2"
                onClick={() => {
                  setSelectedRole("student");
                  form.setValue("role", "student");
                }}
              >
                <GraduationCap className="h-5 w-5" />
                Login as Student
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 text-base flex items-center justify-center gap-2"
                onClick={() => {
                  setSelectedRole("teacher");
                  form.setValue("role", "teacher");
                }}
              >
                <School className="h-5 w-5" />
                Login as Teacher
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="hidden lg:block lg:flex-1 bg-secondary p-8">
        <img
          src="https://images.unsplash.com/photo-1519389950473-47ba0277781c"
          alt="College students collaborating at a study table with laptops"
          className="w-full h-full object-cover rounded-xl"
        />
      </div>
    </div>
  );
};

export default Login;