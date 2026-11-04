import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Shield, Users, ChevronRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Logo from "@/components/Logo";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Clock,
      title: "Time Tracking",
      description: "Record your reporting and end-of-shift times with precision"
    },
    {
      icon: MapPin,
      title: "GPS Location",
      description: "Automatic location capture for verified attendance"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Your data is safely stored and backed up"
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Real-time monitoring for administrators"
    }
  ];

  const faqs = [
    {
      question: "1. What is VChron?",
      answer:
        "VChron is a digital attendance and productivity tracking system designed to monitor staff presence, duty status, and performance in real time. It supports organizations—particularly in public service and health sectors—in improving accountability, workforce management, and service delivery.",
    },
    {
      question: "2. What data is collected?",
      answer:
        "VChron collects essential operational data such as user identification details (e.g., name, ID), login and logout timestamps, duty status, location (when required and authorized), and basic activity logs related to attendance and productivity. The system is designed to collect only data that is necessary for administrative and performance monitoring purposes.",
    },
    {
      question: "3. Is my data safe?",
      answer:
        "Yes. VChron incorporates security measures such as encrypted data transmission, controlled user access levels, and secure data storage. It complies with standard data protection principles to ensure that personal and organizational data is protected against unauthorized access, loss, or misuse.",
    },
    {
      question: "4. How long does it take to log in and out?",
      answer:
        "Logging in or out typically takes only a few seconds, depending on network connectivity and device performance. The system is optimized for quick access to minimize disruption to routine duties.",
    },
    {
      question: "5. Does VChron work offline?",
      answer:
        "VChron has limited offline functionality. Users may be able to record attendance without an internet connection, but the data will only sync with the central system once connectivity is restored.",
    },
    {
      question: "6. Does VChron track officers when they are off duty?",
      answer:
        "No. VChron is designed to track activity only during official duty periods. It does not monitor users outside working hours unless explicitly authorized for specific operational purposes.",
    },
    {
      question: "7. How much data does VChron use?",
      answer:
        "VChron uses minimal mobile data because it primarily transmits small amounts of information such as timestamps and user activity logs. Typical usage is low and suitable even for areas with limited bandwidth.",
    },
    {
      question: "8. Can VChron be integrated with other government systems?",
      answer:
        "Yes. VChron can be configured to integrate with other systems such as HR platforms, payroll systems, or health information systems (e.g., DHIS2), depending on organizational requirements and technical setup.",
    },
    {
      question: "9. What devices are compatible with VChron?",
      answer:
        "VChron is compatible with Android and iOS smartphones and tablets, and may also be accessible via web browsers on computers. The exact compatibility depends on the version deployed and system requirements.",
    },
    {
      question: "10. What happens if I forget to log in or out?",
      answer:
        "If a user forgets to log in or out, the system may allow manual correction requests or supervisor verification. Administrators can review logs and make appropriate adjustments to ensure accurate attendance records.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1653508311277-1ecf6ee52c5e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwzfHxkb2N0b3JzJTIwbnVyc2VzJTIwaG9zcGl0YWwlMjBzdGFmZiUyMG1lZGljYWwlMjB0ZWFtJTIwdW5pZm9ybXxlbnwwfHx8fDE3NzMyOTgxMjZ8MA&ixlib=rb-4.1.0&q=85')`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900/95 to-teal-800/90"></div>
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Nav */}
          <nav className="flex items-center justify-between py-6">
            <Logo variant="light" size="md" className="max-w-[190px]" />
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/10"
                onClick={() => navigate('/login')}
                data-testid="nav-login-btn"
              >
                Sign In
              </Button>
              <Button 
                className="bg-white text-teal-700 hover:bg-teal-50"
                onClick={() => navigate('/register')}
                data-testid="nav-register-btn"
              >
                Get Started
              </Button>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="py-20 md:py-32 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-sm text-teal-100">Healthcare Attendance System</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 font-['Manrope'] tracking-tight">
              Track Attendance with 
              <span className="text-teal-300"> Precision</span>
            </h1>
            
            <p className="text-lg text-teal-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              A modern attendance tracking solution for healthcare workers. 
              Record your shifts, capture GPS coordinates, and stay accountable.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-white text-teal-700 hover:bg-teal-50 h-14 px-8 text-lg rounded-full shadow-lg shadow-black/20"
                onClick={() => navigate('/register')}
                data-testid="hero-get-started-btn"
              >
                Get Started
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white/30 text-white hover:bg-white/10 h-14 px-8 text-lg rounded-full"
                onClick={() => navigate('/login')}
                data-testid="hero-sign-in-btn"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8fafc"/>
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 font-['Manrope'] mb-4">
            Designed for Healthcare
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Built specifically for hospitals and clinics to track staff attendance with accuracy and reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200"
              data-testid={`feature-card-${index}`}
            >
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 font-['Manrope'] mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-teal-700 to-teal-900 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-white font-['Manrope'] mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-teal-100 mb-8 max-w-xl mx-auto">
            Join healthcare facilities across the region using V-Chron for reliable attendance tracking.
          </p>
          <Button 
            size="lg"
            className="bg-white text-teal-700 hover:bg-teal-50 h-14 px-10 text-lg rounded-full"
            onClick={() => navigate('/register')}
            data-testid="cta-register-btn"
          >
            Create Account
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 font-['Manrope'] mb-4">
            Frequently Asked Questions (FAQ)
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Common questions about how VChron works, what it collects, and how it supports organizations.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="px-6 md:px-8">
                <AccordionTrigger className="text-left text-base md:text-lg font-semibold text-slate-900">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-7 text-sm md:text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Logo size="sm" />
            <Link to="/install" className="text-sm font-medium text-teal-700 underline underline-offset-4">
              Install the app
            </Link>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} V-Chron. Healthcare Attendance System.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
