import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import NavbarDashboard from "../components/NavbarDashboard";
import Toast from "../components/Toast";

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [toast, setToast] = useState(null);

  const [users, setUsers] = useState([]);
  const [statsError, setStatsError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserScans, setSelectedUserScans] = useState([]);
  const [scansLoading, setScansLoading] = useState(false);
  const [scansError, setScansError] = useState("");

  const userCount = useMemo(() => users.length, [users]);

  const loadScansForUser = async (user) => {
    setSelectedUser(user);
    setScansLoading(true);
    setScansError("");

    try {
      const scansRef = collection(db, "scans");
      const scansQuery = query(
        scansRef,
        where("userId", "==", user.id),
        limit(25)
      );
      const scansSnapshot = await getDocs(scansQuery);
      const scans = scansSnapshot.docs.map((docSnap) => {
        const data = docSnap.data() || {};
        return {
          id: docSnap.id,
          domain: data.domain || "-",
          status: data.status || "completed",
          riskScore: data.riskScore ?? data.overall_numeric_score ?? null,
          compromiseProbability:
            data.compromiseProbability ?? data.compromise_probability_percent ?? null,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt || null,
          metadata: data,
        };
      }).sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      setSelectedUserScans(scans);
    } catch (error) {
      setSelectedUserScans([]);
      setScansError(
        error?.message ||
          "Could not load scans for this user. Check Firestore rules for scans collection access."
      );
    } finally {
      setScansLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!isMounted) {
        return;
      }

      if (!currentUser) {
        navigate("/", { replace: true });
        return;
      }

      try {
        const currentUserRef = doc(db, "users", currentUser.uid);
        const currentUserSnap = await getDoc(currentUserRef);
        const currentUserData = currentUserSnap.exists() ? currentUserSnap.data() || {} : {};

        if ((currentUserData.role || "user") !== "admin") {
          await signOut(auth);
          if (!isMounted) {
            return;
          }
          setToast({
            type: "error",
            message: "Unauthorized access. Admin role is required.",
          });
          navigate("/signin/admin", { replace: true });
          return;
        }

        if (!isMounted) {
          return;
        }

        setAdminUser({
          uid: currentUser.uid,
          email: currentUser.email,
          name: currentUserData.name || currentUser.email || "Admin",
          role: "admin",
        });

        const usersResult = await getDocs(collection(db, "users")).catch(() => null);

        if (!isMounted) {
          return;
        }

        if (usersResult) {
          const mappedUsers = usersResult.docs.map((docSnap) => {
            const data = docSnap.data() || {};
            return {
              id: docSnap.id,
              name: data.name || "Unknown",
              email: data.email || "-",
              role: data.role || "user",
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt || null,
              lastLoginAt: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate() : data.lastLoginAt || null,
            };
          });

          const onlyUsers = mappedUsers.filter(
            (item) => String(item.role || "").toLowerCase() === "user"
          );

          onlyUsers.sort(
            (a, b) =>
              new Date(b.lastLoginAt || b.createdAt || 0).getTime() -
              new Date(a.lastLoginAt || a.createdAt || 0).getTime()
          );

          setUsers(onlyUsers);
          if (onlyUsers.length > 0) {
            loadScansForUser(onlyUsers[0]);
          }
          setStatsError("");
        } else {
          setUsers([]);
          setSelectedUser(null);
          setSelectedUserScans([]);
          setStatsError(
            "Cannot load users list. Current Firestore rules likely block admin read on users collection."
          );
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setStatsError(error?.message || "Failed to load admin data.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400 mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {adminUser && (
        <NavbarDashboard
          userName={adminUser?.name || adminUser?.email}
          userRole={adminUser?.role}
          dashboardType="admin"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      <div className="pt-32 px-4 sm:px-6 lg:px-8 pb-10">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-[linear-gradient(140deg,#0d172a_0%,#12354a_70%,#0b1f2b_100%)] border border-cyan-500/30 rounded-3xl p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-cyan-200">Admin Security Control Center</h1>
            <p className="text-slate-300 mt-2">
              User management panel: click a user to view their scan history and account data.
            </p>
          </div>

          {statsError && (
            <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 text-red-200 text-sm">
              {statsError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/70 border border-cyan-500/30 rounded-xl p-5">
              <p className="text-slate-400 text-sm">Total User Accounts</p>
              <p className="text-3xl font-bold mt-2">{userCount}</p>
            </div>
            <div className="bg-slate-900/70 border border-cyan-500/30 rounded-xl p-5">
              <p className="text-slate-400 text-sm">Signed-in Admin</p>
              <p className="text-lg font-semibold mt-2 break-all">{adminUser?.email || "-"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-slate-900/70 border border-cyan-500/30 rounded-xl p-5 overflow-x-auto">
              <h2 className="text-xl font-semibold mb-4 text-cyan-200">Users</h2>
              <table className="w-full text-left text-sm min-w-[680px]">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Last Login</th>
                    <th className="py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td className="py-4 text-slate-400" colSpan={4}>
                        No user entries found. Ensure user role documents are created in Firestore users collection.
                      </td>
                    </tr>
                  )}
                  {users.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => loadScansForUser(item)}
                      className={`border-b border-slate-800/70 cursor-pointer hover:bg-cyan-500/10 ${
                        selectedUser?.id === item.id ? "bg-cyan-500/10" : ""
                      }`}
                    >
                      <td className="py-3 pr-4">{item.name}</td>
                      <td className="py-3 pr-4">{item.email}</td>
                      <td className="py-3 pr-4">{formatDate(item.lastLoginAt)}</td>
                      <td className="py-3">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:col-span-2 bg-slate-900/70 border border-cyan-500/30 rounded-xl p-5">
              <h2 className="text-xl font-semibold mb-4 text-cyan-200">Selected User Details</h2>
              {!selectedUser ? (
                <p className="text-slate-400 text-sm">Select a user from the table to view scan history.</p>
              ) : (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-slate-400">Name</p>
                    <p className="font-semibold">{selectedUser.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Email</p>
                    <p className="font-semibold break-all">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Created</p>
                    <p className="font-semibold">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Last Login</p>
                    <p className="font-semibold">{formatDate(selectedUser.lastLoginAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/70 border border-cyan-500/30 rounded-xl p-5 overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4 text-cyan-200">Selected User Scan History</h2>
            {scansError && (
              <div className="mb-3 rounded-lg border border-red-400/30 bg-red-500/10 text-red-200 px-3 py-2 text-sm">
                {scansError}
              </div>
            )}
            {scansLoading ? (
              <p className="text-slate-400 text-sm">Loading scans...</p>
            ) : (
            <table className="w-full text-left text-sm min-w-[680px]">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="py-2 pr-4">Domain</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Risk Score</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {selectedUser && selectedUserScans.length === 0 && (
                  <tr>
                    <td className="py-4 text-slate-400" colSpan={4}>
                      No scans found for selected user.
                    </td>
                  </tr>
                )}
                {!selectedUser && (
                  <tr>
                    <td className="py-4 text-slate-400" colSpan={4}>
                      Select a user to load scan history.
                    </td>
                  </tr>
                )}
                {selectedUserScans.map((scan) => (
                  <tr key={scan.id} className="border-b border-slate-800/70">
                    <td className="py-3 pr-4">{scan.domain}</td>
                    <td className="py-3 pr-4 uppercase tracking-wide text-cyan-300">{scan.status}</td>
                    <td className="py-3 pr-4">{scan.riskScore ?? "-"}</td>
                    <td className="py-3">{formatDate(scan.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
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
    </div>
  );
}
