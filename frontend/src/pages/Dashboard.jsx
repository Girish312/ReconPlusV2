import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import UserDashboard from "./UserDashboard";
import AdminDashboard from "./AdminDashboard";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!isMounted) return;

      if (!currentUser) {
        navigate("/", { replace: true });
        return;
      }

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            name: userData.name || "User",
            role: userData.role || "user",
          });
        } else {
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || "User",
            role: "user",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          name: currentUser.displayName || "User",
          role: "user",
        });
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (!user || loading) {
      return;
    }

    if (user.role !== "admin" && user.role !== "user") {
      signOut(auth).finally(() => {
        navigate("/signin/user", { replace: true });
      });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (user?.role === "user") {
    return <UserDashboard />;
  }

  if (user?.role === "admin") {
    return <AdminDashboard />;
  }

  return null;
}
