import { Button } from "@/components/ui/button";
import { Mail, Github, Lock, GraduationCap, School } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "teacher"]),
});

const Signup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher" | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleEmailSignup = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            role: values.role, // Store role in user metadata
            username: values.email.split("@")[0]
          }
        }
      });
      
      if (error) throw error;
      if (!user) throw new Error("No user returned after signup");

      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link to complete your registration.",
      });
      navigate('/login');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error signing up",
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
              Choose your role to get started
            </p>
          </div>
          {selectedRole ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleEmailSignup)} className="space-y-6">
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input 
                          placeholder="Password" 
                          type="password"
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
                    {isLoading ? "Loading..." : "Sign up"}
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
                Sign up as Student
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
                Sign up as Teacher
              </Button>
            </div>
          )}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-sm uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full h-12 text-base"
            onClick={handleGithubSignup}
            disabled={isLoading}
          >
            <Github className="mr-2 h-5 w-5" />
            Continue with GitHub
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button variant="link" className="p-0" onClick={() => navigate('/login')}>
              Sign in
            </Button>
          </p>
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

export default Signup;