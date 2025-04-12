import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, FileText, Clock, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const ComingSoonPage = ({ title }: { title: string }) => (
  <div className="min-h-screen flex items-center justify-center">
    <h1 className="text-4xl font-bold text-primary">{title} - Coming Soon...</h1>
  </div>
);

const Landing = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState<string | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) {
      return;
    }

    api.scrollNext();
    const intervalId = setInterval(() => {
      api.scrollNext();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [api]);

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
      icon: <MessageCircle className="h-8 w-8 text-primary" />,
      title: "Real-time Chat",
      description: "Connect with classmates instantly",
      path: "chat"
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Study Groups",
      description: "Form and join study groups",
      path: "groups"
    },
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: "Forums",
      description: "Engage in academic discussions and share knowledge",
      path: "forums",
      requiresAuth: true
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Event Planning",
      description: "Schedule and manage study sessions",
      path: "events"
    }
  ];

  const faqs = [
    {
      question: "What is this platform about?",
      answer: "This is an exclusive social platform for our college students to connect, collaborate, and share academic resources."
    },
    {
      question: "How do I join study groups?",
      answer: "Once registered, you can browse and join existing study groups or create your own based on your courses and interests."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we implement industry-standard security measures to protect your data and maintain your privacy."
    },
    {
      question: "How can I report inappropriate content?",
      answer: "You can report any inappropriate content through the report button available on posts and comments, or contact our support team."
    }
  ];

  const handleFeatureClick = async (feature: any) => {
    if (feature.title === 'Forums') {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate('/home');
      } else {
        toast({
          title: "Authentication Required",
          description: "Please login to access the forums.",
          variant: "destructive",
        });
        navigate('/login');
      }
    } else {
      navigate(`/${feature.path}`);
    }
  };

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: "Message Sent",
      description: "We'll get back to you soon!",
    });
    (e.target as HTMLFormElement).reset();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="relative h-[80vh] -mx-4 flex items-center justify-center mb-24">
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(/lovable-uploads/149611f6-309e-4d6a-b7cc-136de0cc8a8b.png)',
            }}
          >
            <div className="absolute inset-0 bg-black/50" /> {/* Dark overlay */}
          </div>
          
          {/* Content */}
          <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
            {user ? (
              <div className="space-y-6">
                <h2 className="text-5xl font-serif font-semibold">
                  Welcome back, {username || user.email}!
                </h2>
                <p className="text-xl text-gray-200 mt-4">
                  Ready to continue learning and sharing?
                </p>
                <Button
                  size="lg"
                  onClick={() => navigate("/home")}
                  className="mt-8 bg-white text-gray-900 hover:bg-gray-100"
                >
                  Go to Forums
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <h1 className="text-6xl font-serif font-semibold mb-6">
                  Welcome To CollegeStack
                </h1>
                <p className="text-xl text-gray-200 max-w-2xl mx-auto">
                  Join our vibrant community of learners, share knowledge, and grow together
                </p>
                <Button
                  size="lg"
                  onClick={() => navigate("/signup")}
                  className="mt-8 bg-white text-gray-900 hover:bg-gray-100"
                >
                  Get Started
                </Button>
                <p className="text-sm text-gray-300 mt-4">
                  By signing up, you agree to our Terms of Service
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-24 relative">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="relative">
            {/* Gradient overlays for fading effect */}
            <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-background to-transparent z-10" />
            
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full max-w-5xl mx-auto"
              setApi={setApi}
            >
              <CarouselContent className="-ml-1">
                {[...features, ...features].map((feature, index) => (
                  <CarouselItem key={index} className="pl-1 basis-full md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <Card 
                        className="p-6 bg-card hover:shadow-lg transition-all duration-300 cursor-pointer"
                        onClick={() => handleFeatureClick(feature)}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="mb-4">{feature.icon}</div>
                          <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </section>

        {/* FAQ and Contact sections */}
        <section className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-12">Contact Us</h2>
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div>
                <Input placeholder="Your Name" required />
              </div>
              <div>
                <Input type="email" placeholder="Your Email" required />
              </div>
              <div>
                <Textarea placeholder="Your Message" required />
              </div>
              <Button type="submit" className="w-full">
                Send Message
              </Button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;