import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Questions from "./pages/Questions";
import Login from "./pages/Login";
import AuthCallback from "./pages/NewAuthCallback";
import PostDetails from "./pages/PostDetails";
import EditPost from "./pages/EditPost";
import Chat from "./pages/Chat";
import Groups from "./pages/Groups";
import Events from "./pages/Events";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import SemesterView from "./pages/SemesterView";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "teacher" | "student";
}

function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!profile) {
      // Wait for profile to load
      return;
    }

    if (requiredRole && profile.role !== requiredRole) {
      navigate("/");
    }
  }, [user, profile, requiredRole, navigate]);

  if (!user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  if (requiredRole && profile.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login';
  const isLandingPage = location.pathname === '/';
  const isForumPage = ['/home', '/questions', '/student', '/semester-view'].includes(location.pathname) || location.pathname.startsWith('/post/') || location.pathname.startsWith('/edit-post/');
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <Layout>
          <div className="flex flex-1">
            {!isAuthPage && !isLandingPage && isForumPage && <AppSidebar />}
            <main className="flex-1 bg-background">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route
                  path="/home"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/questions"
                  element={
                    <ProtectedRoute>
                      <Questions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/post/:id"
                  element={
                    <ProtectedRoute>
                      <PostDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit-post/:id"
                  element={
                    <ProtectedRoute>
                      <EditPost />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/groups"
                  element={
                    <ProtectedRoute>
                      <Groups />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/events"
                  element={
                    <ProtectedRoute>
                      <Events />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher"
                  element={
                    <ProtectedRoute requiredRole="teacher">
                      <TeacherDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/semester-view"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <SemesterView />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
          </div>
          {!isAuthPage && <Footer />}
        </Layout>
      </div>
      <Toaster />
      <Sonner />
    </SidebarProvider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;