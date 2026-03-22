
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Handle background blur on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [mobileMenuOpen]);

  // Helper for navigation + closing menu
  const handleNav = (path, mode) => {
    navigate(path, { state: { mode } });
    setMobileMenuOpen(false);
  };
  const handleHomeNav = () => {
    navigate('/'); // This is the command that performs the redirect
    setMobileMenuOpen(false);
  }

  return (
    <>
      <nav
        className={`fixed w-full z-50 transition-all duration-200 ${mobileMenuOpen
          ? "bg-[#0a0e1a]"
          : scrolled
            ? "bg-[#0a0e1a]/95 backdrop-blur-md shadow-lg shadow-cyan-500/10"
            : "bg-transparent"
          }`}
      >
        <div className="max-w-7xl px-3 sm:px-3 lg:px-4">
          <div className="flex justify-between items-center h-20">
            {/* Left Section: Logo & Desktop Links */}
            <div className="flex items-center space-x-8">
              <img
                src="/images/logo.png"
                alt="ReconPlus Logo"
                className="h-24 w-auto sm:h-32 lg:h-40"
              />
              <div className="hidden md:flex items-center space-x-8">
                <button onClick={handleHomeNav} className="font-semibold hover:text-cyan-400">Home</button>
                <a href="#about" className="font-semibold hover:text-cyan-400">About Us</a>
              </div>
            </div>

            {/* Right Section: Desktop Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => navigate("/select-role", { state: { mode: "signin" } })}
                className="font-semibold hover:text-cyan-400"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/select-role", { state: { mode: "signup" } })}
                className="bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-2.5 rounded-full font-semibold text-gray-900 transition-all hover:scale-105"
              >
                Sign Up
              </button>
            </div>

            {/* Mobile Menu Toggle (SVG) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-cyan-400 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-[#0a0e1a] border-l border-cyan-500/30 transform transition-transform duration-300 ease-in-out z-[60] ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          } md:hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Close Button */}
          <div className="flex justify-end p-4">
            <button onClick={() => setMobileMenuOpen(false)} className="text-cyan-400 focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Sidebar Links */}
          <nav className="flex flex-col space-y-6 px-8 py-4">
            <button
              onClick={() => {
                navigate("/");
                setMobileMenuOpen(false);
              }}
              className="text-left text-white hover:text-cyan-400 transition-colors duration-300 text-lg font-semibold"
            >
              Home
            </button>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-cyan-400 transition-colors duration-300 text-lg font-semibold">
              About Us
            </a>
            <button
              onClick={() => handleNav("/select-role", "signin")}
              className="text-left text-white hover:text-cyan-400 transition-colors duration-300 text-lg font-semibold"
            >
              Sign In
            </button>
            <button
              onClick={() => handleNav("/select-role", "signup")}
              className="bg-gradient-to-r from-cyan-400 to-blue-500 text-gray-900 px-6 py-2.5 rounded-full font-semibold text-base transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/50 text-center"
            >
              Sign Up
            </button>
          </nav>
        </div>
      </div>

      {/* Dark Overlay for Sidebar */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-[55] md:hidden"
        />
      )}
    </>
  );
}

