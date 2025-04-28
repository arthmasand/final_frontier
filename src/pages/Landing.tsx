import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, FileText, Clock, Users, BookOpen, 
  GraduationCap, School, ArrowRight, CheckCircle2, 
  BrainCircuit, Sparkles, Zap, ChevronRight, Send
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Animation component for text reveal
const AnimatedText = ({ children, delay = 0 }: { children: string, delay?: number }) => {
  return (
    <span className="inline-block overflow-hidden">
      <span 
        className="inline-block" 
        style={{ 
          animation: `fadeInUp 0.6s ease-out forwards`,
          animationDelay: `${delay}ms`,
          opacity: 0
        }}
      >
        {children}
      </span>
    </span>
  );
};

// Testimonial component
const Testimonial = ({ quote, author, role, image }: { 
  quote: string; 
  author: string; 
  role: string; 
  image: string;
}) => (
  <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl shadow-md">
    <div className="flex items-start gap-4">
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/20">
          <img src={image} alt={author} className="w-full h-full object-cover" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1">
          <CheckCircle2 className="h-3 w-3" />
        </div>
      </div>
      <div>
        <p className="text-sm italic mb-2">"{quote}"</p>
        <div>
          <p className="font-medium text-sm">{author}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  </div>
);

// Feature card component
const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  onClick 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  onClick?: () => void;
}) => (
  <Card 
    className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 h-full"
    onClick={onClick}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <CardContent className="p-6 relative z-10">
      <div className="bg-primary/10 text-primary rounded-full p-3 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
      {onClick && (
        <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span>Learn more</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </div>
      )}
    </CardContent>
  </Card>
);

const Landing = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState<string | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("students");

  useEffect(() => {
    // Add scroll animation for elements
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
          }
        });
      },
      { threshold: 0.1 }
    );

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    if (animatedElements.length > 0) {
      animatedElements.forEach((el) => {
        observer.observe(el);
      });
    }

    return () => {
      if (animatedElements.length > 0) {
        animatedElements.forEach((el) => {
          observer.unobserve(el);
        });
      }
    };
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', session.user.id)
            .single();
          
          setUsername(profile?.username);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        if (session?.user) {
          setUser(session.user);
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', session.user.id)
            .single();
          setUsername(profile?.username);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUsername(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const features = [
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: "Discussion Forums",
      description: "Engage in academic discussions and share knowledge with peers and faculty",
      path: "home"
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Semester View",
      description: "Browse and filter posts by course, semester, and subject",
      path: "semester-view"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Custom Tags",
      description: "Create and use tags to organize content and find relevant information",
      path: "home"
    },
    {
      icon: <BrainCircuit className="h-6 w-6" />,
      title: "Teacher Dashboard",
      description: "Manage moderators and track unanswered posts that need attention",
      path: "teacher",
      requiresAuth: true
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Real-time Updates",
      description: "Get instant notifications for comments and responses to your posts",
      path: "home"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Voting System",
      description: "Upvote helpful content to increase visibility of quality posts",
      path: "home"
    }
  ];

  const faqs = [
    {
      question: "What is Campus Dialogue Hub?",
      answer: "Campus Dialogue Hub is an academic discussion platform designed specifically for college students and faculty to share knowledge, ask questions, and collaborate on academic topics organized by courses, semesters, and subjects."
    },
    {
      question: "How do I filter posts by my courses?",
      answer: "After logging in, navigate to the Semester View where you can filter posts by course, semester, and specific subjects. Your course and semester information from your profile will be used to automatically tag your posts."
    },
    {
      question: "What's the difference between student and teacher accounts?",
      answer: "Teachers have access to a special dashboard where they can monitor unanswered posts, assign student moderators, and view analytics. Students can create posts, comment, and participate in discussions organized by their academic programs."
    },
    {
      question: "How does the notification system work?",
      answer: "Teachers receive alerts for posts that remain unanswered for more than 2 hours. The system tracks post activity and can send both in-app and email notifications to ensure timely responses."
    },
    {
      question: "Can I update my academic information?",
      answer: "Yes! Students can update their course and semester information through their profile settings. This information is used to automatically tag your posts and provide relevant content."
    },
    {
      question: "How do tags work in the system?",
      answer: "Tags help organize content by topic, course, semester, and subject. When students create posts, their course and semester tags are automatically added, making it easier for others to find relevant discussions."
    }
  ];

  const handleFeatureClick = (feature: any) => {
    if (feature.requiresAuth && !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access this feature",
      });
      navigate("/login");
      return;
    }

    navigate(`/${feature.path}`);
  };

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: "Message Sent",
      description: "Thank you for your message. We'll get back to you soon!",
    });
    
    // Clear form
    (e.target as HTMLFormElement).reset();
  };
  
  const testimonials = [
    {
      quote: "This platform has completely transformed how I collaborate with classmates on assignments and projects.",
      author: "Priya Sharma",
      role: "Computer Science, Semester 5",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330"
    },
    {
      quote: "As a professor, I can now track unanswered questions and ensure no student query goes unaddressed.",
      author: "Dr. Rajesh Kumar",
      role: "Associate Professor, IT Department",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e"
    },
    {
      quote: "The semester view makes it so easy to find relevant discussions for my courses.",
      author: "Amit Patel",
      role: "Biotechnology, Semester 3",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
    }
  ];
  
  const stats = [
    { value: "10,000+", label: "Active Users" },
    { value: "25,000+", label: "Academic Discussions" },
    { value: "95%", label: "Query Resolution Rate" },
    { value: "15+", label: "Academic Departments" }
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section 
          ref={heroRef} 
          className="relative mb-24 py-20 rounded-3xl overflow-hidden bg-gradient-to-br from-primary/90 via-primary/80 to-primary/70"
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-primary/30 to-transparent"></div>
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col items-center justify-center text-center text-white p-4 max-w-5xl mx-auto">
            {user ? (
              <div className="space-y-6">
                <Badge variant="outline" className="mb-4 py-1 px-4 text-white border-white/30 backdrop-blur-sm">
                  Welcome back
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  Hello, <span className="text-white/90">{username || user.email}</span>!
                </h1>
                <p className="text-xl max-w-2xl mx-auto text-white/80">
                  Continue your academic journey and connect with your peers
                </p>
                <div className="flex gap-4 justify-center pt-4">
                  <Button
                    size="lg"
                    onClick={() => navigate("/home")}
                    className="bg-white text-primary hover:bg-gray-100 font-medium"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <Badge variant="outline" className="mb-4 py-1 px-4 text-white border-white/30 backdrop-blur-sm">
                  Campus Dialogue Hub
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                  Connect. Learn. Collaborate.
                </h1>
                <p className="text-xl text-white/80 max-w-2xl mx-auto">
                  The ultimate academic discussion platform designed for students and faculty
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                  <Button
                    size="lg"
                    onClick={() => navigate("/login")}
                    className="bg-white text-primary hover:bg-gray-100 font-medium"
                  >
                    Get Started
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      const faqSection = document.getElementById('faq-section');
                      if (faqSection) faqSection.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-card p-6 rounded-xl shadow-sm border border-border/50 text-center">
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform offers a comprehensive set of tools designed specifically for academic collaboration
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="animate-on-scroll">
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  onClick={() => handleFeatureClick(feature)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hear from students and faculty who use Campus Dialogue Hub every day
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="animate-on-scroll">
                <Testimonial
                  quote={testimonial.quote}
                  author={testimonial.author}
                  role={testimonial.role}
                  image={testimonial.image}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Tabs Section */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              For Everyone
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tailored For Your Role</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you're a student or teacher, we have features designed specifically for you
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="students" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="students" className="text-lg py-3">
                  <GraduationCap className="mr-2 h-5 w-5" /> For Students
                </TabsTrigger>
                <TabsTrigger value="teachers" className="text-lg py-3">
                  <School className="mr-2 h-5 w-5" /> For Teachers
                </TabsTrigger>
              </TabsList>
              <TabsContent value="students">
                <Card>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div>
                        <h3 className="text-2xl font-bold mb-4">Enhance Your Learning Experience</h3>
                        <ul className="space-y-3">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                            <span>Filter discussions by course, semester, and subject</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                            <span>Automatic tagging of posts with your course and semester</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                            <span>Get answers from peers and faculty within hours</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                            <span>Become a moderator and help manage discussions</span>
                          </li>
                        </ul>
                        <Button className="mt-6" onClick={() => navigate('/login')}>
                          Join as Student <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-primary/5 p-6 rounded-xl">
                        <img 
                          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f" 
                          alt="Students collaborating" 
                          className="rounded-lg shadow-md w-full h-64 object-cover"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="teachers">
                <Card>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div>
                        <h3 className="text-2xl font-bold mb-4">Streamline Academic Support</h3>
                        <ul className="space-y-3">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                            <span>Track unanswered posts with automatic notifications</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                            <span>Assign student moderators for specific time slots</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                            <span>View all posts with powerful filtering options</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                            <span>Ensure no student question goes unanswered</span>
                          </li>
                        </ul>
                        <Button className="mt-6" onClick={() => navigate('/login')}>
                          Join as Teacher <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-primary/5 p-6 rounded-xl">
                        <img 
                          src="https://images.unsplash.com/photo-1544717305-2782549b5136" 
                          alt="Teacher helping students" 
                          className="rounded-lg shadow-md w-full h-64 object-cover"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq-section" className="mb-24">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              FAQ
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about Campus Dialogue Hub
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto bg-card p-8 rounded-xl shadow-sm border border-border/50">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="animate-on-scroll">
                  <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Get In Touch
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Have questions or feedback? We'd love to hear from you
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto bg-card p-8 rounded-xl shadow-sm border border-border/50">
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Your Name</label>
                  <Input id="name" placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Your Email</label>
                  <Input id="email" type="email" placeholder="john@example.com" required />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">Your Message</label>
                <Textarea 
                  id="message" 
                  placeholder="How can we help you?" 
                  className="min-h-[150px]" 
                  required 
                />
              </div>
              <Button type="submit" className="w-full">
                <Send className="mr-2 h-4 w-4" /> Send Message
              </Button>
            </form>
          </div>
        </section>
        {/* CTA Section */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-primary/90 to-primary/70 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl text-white/80 mb-8">
                Join our community of students and teachers today and transform your academic experience
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate('/login')} 
                className="bg-white text-primary hover:bg-gray-100 font-medium"
              >
                Sign Up Now
              </Button>
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="py-8 border-t border-border/50 text-center text-muted-foreground">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <GraduationCap className="h-6 w-6 text-primary mr-2" />
              <span className="font-medium">Campus Dialogue Hub</span>
            </div>
            <div className="text-sm">
              &copy; {new Date().getFullYear()} Campus Dialogue Hub. All rights reserved.
            </div>
            <div className="text-sm">
              <a href="#" className="hover:text-primary mr-4">Privacy Policy</a>
              <a href="#" className="hover:text-primary">Terms of Service</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Landing;