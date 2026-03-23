import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";

export default function NavbarDashboard({ userName, userRole, dashboardType = "admin", activeTab = "overview", setActiveTab }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Role display mapping
  const roleTitleMap = {
    admin: "Admin",
    user: "User",
  };

  // Navigation helper for sidebar and desktop
  const handleNav = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

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

              {/* Tabs for User Dashboard */}
              {dashboardType === "user" && (
                <div className="hidden md:flex items-center space-x-1 bg-[#0a0e1a]/50 rounded-lg p-1 border border-cyan-500/20">
                  {["overview", "tools", "history"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === tab
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "text-gray-300 hover:text-cyan-400"
                        }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1).replace("-", " ")}
                    </button>
                  ))}
                </div>
              )}

              {/* Admin Dashboard Links */}
              {dashboardType !== "user" && (
                <div className="hidden md:flex items-center space-x-8">
                  <button
                    onClick={() => handleNav("/dashboard")}
                    className="font-semibold hover:text-cyan-400"
                  >
                    Dashboard
                  </button>
                </div>
              )}
            </div>

            {/* Right Section: Desktop User Menu */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-gray-400">{userName}</p>
                <p className="text-xs text-cyan-400">{roleTitleMap[userRole] || "User"}</p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center font-semibold text-gray-900 hover:scale-110 transition-transform"
                >
                  {userName?.charAt(0)?.toUpperCase() || "U"}
                </button>

                {/* Profile Dropdown Menu */}
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#0a0e1a] border border-cyan-500/30 rounded-lg shadow-lg z-[60]">
                    <button
                      onClick={() => {
                        navigate("/dashboard");
                        setProfileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 hover:bg-cyan-500/10 border-b border-cyan-500/20"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 hover:bg-red-500/10 text-red-400"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Toggle (SVG) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-cyan-400 focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
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
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-cyan-400 focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* User Info in Mobile Menu */}
          <div className="px-8 py-4 border-b border-cyan-500/20">
            <p className="text-sm text-gray-400">{userName}</p>
            <p className="text-xs text-cyan-400">{roleTitleMap[userRole] || "User"}</p>
          </div>

          {/* Sidebar Links */}
          <nav className="flex flex-col space-y-4 px-8 py-6">
            <button
              onClick={() => handleNav("/dashboard")}
              className="text-left text-white hover:text-cyan-400 transition-colors duration-300 text-lg font-semibold"
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="text-left text-red-400 hover:text-red-300 transition-colors duration-300 text-lg font-semibold"
            >
              Logout
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
