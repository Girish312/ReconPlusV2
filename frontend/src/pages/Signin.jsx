import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export default function Signin() {
    const { role } = useParams();
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [toast, setToast] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const roleTitleMap = {
        admin: "Admin",
        user: "User",
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            const user = userCredential.user;

            // Fetch user data from Firestore to check role
            const userDocSnap = await getDoc(doc(db, "users", user.uid));

            if (!userDocSnap.exists()) {
                // User authenticated but no Firestore record - shouldn't happen
                await signOut(auth);
                setToast({
                    message: "User data not found. Please sign up again.",
                    type: "error",
                });
                setIsLoading(false);
                return;
            }

            const userData = userDocSnap.data();
            const userRole = userData.role;

            // Check if the role matches
            if (userRole !== role) {
                // Role mismatch - sign them out and show error
                await signOut(auth);
                setToast({
                    message: `This email is already registered as ${roleTitleMap[userRole]}. Please sign in through the ${roleTitleMap[userRole]} role instead.`,
                    type: "error",
                });
                setIsLoading(false);
                return;
            }

            // Role matches - redirect to dashboard
            await updateDoc(doc(db, "users", user.uid), {
                lastLoginAt: serverTimestamp(),
            }).catch(() => {
                // Non-blocking update: user can still proceed if this write is denied.
            });

            navigate("/dashboard", { state: { role } });
        } catch (error) {
            setIsLoading(false);
            if (error.code === "auth/user-not-found") {
                setToast({
                    message: "Email not found. Please sign up first.",
                    type: "error",
                });
            } else if (error.code === "auth/wrong-password") {
                setToast({
                    message: "Incorrect password. Please try again.",
                    type: "error",
                });
            } else if (error.code === "auth/invalid-credential") {
                setToast({
                    message: "Email or password is incorrect. Please try again.",
                    type: "error",
                });
            } else if (error.code === "auth/invalid-email") {
                setToast({
                    message: "Please enter a valid email address.",
                    type: "error",
                });
            } else {
                setToast({
                    message: error.message || "Sign in failed. Please try again.",
                    type: "error",
                });
            }
        }
    };

    return (
        <>
        <div
            className="min-h-screen text-white bg-cover bg-no-repeat bg-fixed"
            style={{
                backgroundImage: "url('/images/backgrounds/signin-bg.png')",
            }}
        >
            <Navbar />

            <div className="pt-32 px-6 flex justify-center">
                <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center gap-16">

                    {/* LEFT SECTION - FORM */}
                    <div className="w-full lg:w-1/2">
                        <div className="bg-[linear-gradient(41deg,#171717_30%,#0B303C_96%,#0B303C_100%)] border border-cyan-500/30 rounded-3xl px-10 py-12 shadow-2xl">

                            <h2 className="text-3xl font-bold mb-10 text-center">
                                {roleTitleMap[role] || "User"} Sign In
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-8">

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
                                            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500"
                                        >
                                            <img
                                                src="/images/hide-pass.png"
                                                alt="hidepass"
                                                className="h-5 w-5"
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Sign In Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 rounded-md bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                                            Signing in...
                                        </>
                                    ) : (
                                        "Sign In"
                                    )}
                                </button>

                                {/* Create Account */}
                                <p className="text-center text-base text-gray-400 mt-6">
                                    Don’t have an account?{" "}
                                    <span
                                        onClick={() =>
                                            navigate("/select-role", {
                                                state: { mode: "signup" },
                                            })
                                        }
                                        className="text-cyan-400 cursor-pointer hover:underline"
                                    >
                                        Create account
                                    </span>
                                </p>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT SECTION */}
                    <div className="hidden lg:flex flex-col items-center w-1/2">
                        <img
                            src="/images/illustrations/welcome-illustration.png"
                            alt="Welcome Back"
                            className="w-[480px] mb-10"
                        />

                        <h1 className="text-5xl font-bold leading-tight mb-4 text-center">
                            Welcome Back
                        </h1>

                        <p className="text-gray-300 max-w-md text-center">
                            Pick up where you left off
                        </p>
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
