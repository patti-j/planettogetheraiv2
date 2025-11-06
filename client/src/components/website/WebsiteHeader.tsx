import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import { useLocation } from "wouter";
import { Logo } from "@/components/logo";
const WebsiteHeader: React.FC = () => {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Check if user is authenticated to show logout option
  const isAuthenticated = typeof window !== 'undefined' && !!localStorage.getItem('auth_token');

  const navigation = [
    { name: "Home", href: "/home" },
    { name: "Features", href: "/whats-coming" },
    { name: "Solutions", href: "/solutions-comparison" },
    { name: "Technology", href: "/technology-stack" },
    { name: "Roadmap", href: "/roadmap" },
    { name: "Pricing", href: "/pricing" },
    { name: "Demo", href: "/demo-tour" },
  ];

  const NavigationLinks = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      {navigation.map((item) => (
        <button
          key={item.name}
          onClick={() => {
            setLocation(item.href);
            onItemClick?.();
          }}
          className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
        >
          {item.name}
        </button>
      ))}
    </>
  );

  return (
    <header className="bg-white shadow-sm border-b relative z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => setLocation("/home")}
              className="flex items-center"
            >
              <Logo size="medium" showText={true} />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <NavigationLinks />
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/dashboard")}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('isDemo');
                    window.location.href = '/home';
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/login")}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => setLocation("/pricing")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button - Always visible on mobile */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden inline-flex items-center justify-center"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 pt-safe">
              <div className="flex flex-col space-y-4 mt-12">
                <NavigationLinks onItemClick={() => setIsOpen(false)} />
                <div className="border-t pt-4 space-y-2">
                  {isAuthenticated ? (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setLocation("/dashboard");
                          setIsOpen(false);
                        }}
                        className="w-full justify-start"
                      >
                        Dashboard
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          localStorage.removeItem('auth_token');
                          localStorage.removeItem('user');
                          localStorage.removeItem('isDemo');
                          window.location.href = '/';
                        }}
                        className="w-full"
                      >
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setLocation("/login");
                          setIsOpen(false);
                        }}
                        className="w-full justify-start"
                      >
                        Sign In
                      </Button>
                      <Button
                        onClick={() => {
                          setLocation("/pricing");
                          setIsOpen(false);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Get Started
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default WebsiteHeader;