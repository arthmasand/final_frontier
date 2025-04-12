import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppBar } from "@/components/AppBar";
import { Footer } from "@/components/Footer";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Questions from "./pages/Questions";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PostDetails from "./pages/PostDetails";
import Chat from "./pages/Chat";
import Groups from "./pages/Groups";
import Events from "./pages/Events";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);
  const isLandingPage = location.pathname === '/';
  const isForumPage = ['/home', '/questions'].includes(location.pathname) || location.pathname.startsWith('/post/');
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <AppBar />
        <div className="flex flex-1 pt-16">
          {!isAuthPage && !isLandingPage && isForumPage && <AppSidebar />}
          <main className="flex-1 bg-background">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/home" element={<Home />} />
              <Route path="/questions" element={<Questions />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/post/:id" element={<PostDetails />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/events" element={<Events />} />
            </Routes>
          </main>
        </div>
        {!isAuthPage && <Footer />}
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
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;