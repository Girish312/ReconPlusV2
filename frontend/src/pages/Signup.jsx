import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export default function Signup() {
  const { role } = useParams();
  const navigate = useNavigate();
  const normalizedRole = role === "admin" ? "user" : role;

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const roleTitleMap = {
    admin: "Admin",
    user: "User",
  };

  if (role === "admin") {
    return (
      <>
        <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center px-6">
          <div className="max-w-xl w-full bg-[linear-gradient(41deg,#171717_30%,#0B303C_96%,#0B303C_100%)] border border-cyan-500/30 rounded-3xl p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Admin Signup Disabled</h2>
            <p className="text-gray-300 mb-6">
              Admin accounts are restricted and must be provisioned by the project owner.
            </p>
            <button
              onClick={() => navigate("/signin/admin")}
              className="px-6 py-3 rounded-md bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition"
            >
              Go to Admin Sign In
            </button>
          </div>
        </div>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => setToast(null)}
          />
        )}
      </>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (loading) return;
    setLoading(true);

    if (!formData.terms) {
      setToast({ message: "Please accept the terms", type: "warning" });
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setToast({ message: "Passwords do not match", type: "warning" });
      setLoading(false);
      return;
    }

    try {
      // Create Firebase Auth account first
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // Store user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        email: formData.email,
        role: normalizedRole || "user",
        createdAt: new Date(),
      });

      // Show success toast and navigate to signup success page
      setToast({
        message: "Account created successfully! Redirecting...",
        type: "success",
        duration: 1500,
      });
      
      // Navigate to signup success page after brief delay
      setTimeout(() => {
        navigate("/signup-success", { state: { role: normalizedRole || "user" } });
      }, 500);

    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setToast({
          message: "This email is already registered. Please sign in instead.",
          type: "error",
        });
      } else if (error.code === "auth/weak-password") {
        setToast({
          message: "Password should be at least 6 characters.",
          type: "error",
        });
      } else if (error.code === "auth/invalid-email") {
        setToast({
          message: "Invalid email address.",
          type: "error",
        });
      } else {
        setToast({
          message: error.message || "Signup failed. Please try again.",
          type: "error",
        });
      }
      setLoading(false);
    }
  };

  return (
    <>
    <div
      className="min-h-screen text-white bg-cover bg-no-repeat bg-fixed"
      style={{
        backgroundImage: "url('/images/backgrounds/signup-bg.png')",
      }}
    >
      <Navbar />

      <div className="pt-32 px-6 flex justify-center">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center gap-16">

          {/* LEFT SECTION */}
          <div className="hidden lg:flex flex-col items-center w-1/2">
            <img
              src="/images/illustrations/security-illustration.png"
              alt="Security Illustration"
              className="w-[420px] mb-10"
            />

            <h1 className="text-5xl font-bold leading-tight mb-4 text-center">
              All Insights.
              <br />
              One Platform.
            </h1>

            <p className="text-gray-300 max-w-md">
              Unified vulnerability analysis from multiple security sources.
            </p>
          </div>

          {/* RIGHT SECTION - FORM */}
          <div className="w-full lg:w-1/2">
            <div className="bg-[linear-gradient(41deg,#171717_30%,#0B303C_96%,#0B303C_100%)] border border-cyan-500/30 rounded-3xl px-10 py-12 shadow-2xl">

              <h2 className="text-3xl font-bold mb-8 text-center">
                {roleTitleMap[normalizedRole] || "User"} Sign Up
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Name */}
                <div>
                  <label className="block text-base mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-md bg-white text-black outline-none"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-base mb-2">Email ID</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-md bg-white text-black outline-none"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-base mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-md bg-white text-black outline-none pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex text-gray-500 items-center justify-center"
                    >
                      <img
                        src="/images/hide-pass.png"
                        alt="hidepass"
                        className="h-5 w-5"
                      />
                    </button>
                  </div>
                  <p className="text-sm  text-gray-400 mt-2">
                    Use 6 or more characters with a mix of numbers, letters and symbols.
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-base mb-2">Repeat Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-md bg-white text-black outline-none"
                    required
                  />
                </div>

                {/* Terms */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="terms"
                    checked={formData.terms}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">
                    I accept the{" "}
                    <span className="text-cyan-400 cursor-pointer hover:underline">
                      Terms
                    </span>
                  </span>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-3 rounded-md bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating Account..." : "Sign Up"}
                </button>

                {/* Sign In Link */}
                <p className="text-center text-sm text-gray-400 mt-6">
                  Already have an account?{" "}
                  <span
                    onClick={() => navigate(`/signin/${normalizedRole || "user"}`)}
                    className="text-cyan-400 cursor-pointer hover:underline"
                  >
                    Sign in
                  </span>
                </p>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>

    {toast && (
      <Toast
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onClose={() => setToast(null)}
      />
    )}
    </>
  );
}
