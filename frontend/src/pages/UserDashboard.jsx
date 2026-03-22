import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import NavbarDashboard from "../components/NavbarDashboard";
import RiskScoreCard from "../components/RiskScoreCard";
import VulnerabilityRiskSummary from "../components/VulnerabilityRiskSummary";
import RiskSummary from "../components/RiskSummary";
import KeyVulnerabilities from "../components/KeyVulnerabilities";
import SecurityScanStatus from "../components/SecurityScanStatus";
import Toast from "../components/Toast";
import { fetchReconReport, getPdfReportUrl, runScan } from "../services/reconApi";


function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "No scans yet";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "No scans yet";
  }

  return date.toLocaleString();
}


function deriveDashboardData(reconData, isScanning, scanProgress) {
  const riskSummary = reconData?.risk_summary || {};
  const critical = riskSummary.CRITICAL || 0;
  const high = riskSummary.HIGH || 0;
  const medium = riskSummary.MEDIUM || 0;
  const low = riskSummary.LOW || 0;

  const total = critical + high + medium + low;

  const toPercent = (value) => {
    if (!total) {
      return 0;
    }
    return Math.round((value / total) * 100);
  };

  const score = reconData?.overall_numeric_score || 0;
  const probability = reconData?.compromise_probability_percent || 0;
  const privescCount = (reconData?.privesc_findings || []).length;
  const webVulnCount = (reconData?.web_vulnerabilities || []).length;

  const topVulns = (reconData?.web_vulnerabilities || [])
    .slice(0, 3)
    .map((vuln) => ({
      name: vuln.vulnerability || "Unknown Vulnerability",
      status: vuln.severity || "INFO",
      color:
        vuln.severity === "CRITICAL"
          ? "#ef4444"
          : vuln.severity === "HIGH"
            ? "#f97316"
            : vuln.severity === "MEDIUM"
              ? "#22c55e"
              : "#06b6d4",
    }));

  return {
    riskScores: [
      { name: "Critical", value: toPercent(critical), color: "#ef4444" },
      { name: "High", value: toPercent(high), color: "#f97316" },
      { name: "Medium", value: toPercent(medium), color: "#22c55e" },
      { name: "Low", value: toPercent(low), color: "#06b6d4" },
    ],
    vulnerabilities: {
      critical,
      high,
      medium,
      low,
    },
    riskSummaryItems: [
      {
        icon: score >= 7 ? "⚠️" : "✓",
        text: `Overall risk score is ${score}/10 with an estimated compromise probability of ${probability}%.`,
      },
      {
        icon: webVulnCount > 0 ? "⚠️" : "✓",
        text: `${webVulnCount} web vulnerabilities and ${privescCount} privilege escalation findings were reported.`,
      },
      {
        icon: "ℹ️",
        text: reconData?.executive_summary || "Run a scan to generate an executive summary.",
      },
    ],
    keyVulnerabilities:
      topVulns.length > 0
        ? topVulns
        : [{ name: "No key vulnerabilities yet", status: "N/A", color: "#64748b" }],
    scanStatus: {
      progress: isScanning ? scanProgress : reconData ? 100 : 0,
      estimatedTime: isScanning ? "Running..." : "Completed",
      lastScan: formatTimestamp(reconData?.metadata?.timestamp),
      status: isScanning ? "In Progress" : reconData ? "Completed" : "Not Started",
    },
  };
}


export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [domain, setDomain] = useState("");
  const [scanRunning, setScanRunning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [toast, setToast] = useState(null);

  const dashboardData = deriveDashboardData(scanResult, scanRunning, scanProgress);

  const loadLatestReport = async (currentUser) => {
    try {
      const report = await fetchReconReport(currentUser);
      setScanResult(report);
    } catch (error) {
      setScanResult(null);
    }
  };

  const handleScanStart = async () => {
    if (!domain.trim()) {
      setToast({ type: "warning", message: "Please enter a domain before scanning." });
      return;
    }

    setScanRunning(true);
    setScanProgress(10);

    try {
      await runScan(domain.trim(), auth.currentUser);
      await loadLatestReport(auth.currentUser);
      setScanProgress(100);
      setActiveTab("overview");
      setToast({ type: "success", message: "Scan completed. Dashboard has been updated." });
    } catch (error) {
      setScanProgress(0);
      setToast({ type: "error", message: error.message || "Scan failed. Please try again." });
    } finally {
      setScanRunning(false);
    }
  };

  useEffect(() => {
    if (!scanRunning) {
      return;
    }

    const interval = setInterval(() => {
      setScanProgress((previous) => {
        if (previous >= 95) {
          return 95;
        }
        return Math.min(previous + 10, 95);
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [scanRunning]);

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

      await loadLatestReport(currentUser);

      setLoading(false);
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
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Navbar */}
      {user && (
        <NavbarDashboard
          userName={user?.name || user?.email}
          userRole={user?.role}
          dashboardType="user"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      {/* Main Content */}
      <div className="pt-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === "overview" && (
            <>
              {/* Section 2: Risk Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <RiskScoreCard data={dashboardData.riskScores} />
                <VulnerabilityRiskSummary data={dashboardData.vulnerabilities} />
              </div>

              {/* Section 3: Risk Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <RiskSummary items={dashboardData.riskSummaryItems} />
                <KeyVulnerabilities items={dashboardData.keyVulnerabilities} />
              </div>

              {/* Section 4: Security Scan Status */}
              <SecurityScanStatus data={dashboardData.scanStatus} />
            </>
          )}

          {activeTab === "tools" && (
            <div className="bg-[linear-gradient(41deg,#171717_30%,#0B303C_96%,#0B303C_100%)] border border-cyan-500/30 rounded-3xl p-6 sm:p-8">
              <h2 className="text-2xl font-bold mb-6">Run Security Scan</h2>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <input
                  type="text"
                  value={domain}
                  onChange={(event) => setDomain(event.target.value)}
                  placeholder="Enter target domain (example.com)"
                  className="flex-1 bg-[#0a0e1a]/80 border border-cyan-500/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handleScanStart}
                  disabled={scanRunning}
                  className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed text-[#03141a] font-bold px-6 py-3 rounded-xl transition"
                >
                  {scanRunning ? "Scanning..." : "Start Scan"}
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={getPdfReportUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-blue-500/20 border border-blue-400/40 text-blue-300 px-4 py-2 rounded-lg hover:bg-blue-500/30"
                >
                  Download PDF Report
                </a>
              </div>

              <p className="text-gray-400 mt-4 text-sm">
                Tip: run one scan, then open Overview to see live risk and vulnerability data.
              </p>
            </div>
          )}

          {activeTab === "history" && (
            <div className="text-center py-12">
              <p className="text-gray-400">History section coming soon...</p>
            </div>
          )}

          {/* Access Token tab removed */}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
