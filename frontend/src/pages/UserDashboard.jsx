import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import NavbarDashboard from "../components/NavbarDashboard";
import RiskScoreCard from "../components/RiskScoreCard";
import VulnerabilityRiskSummary from "../components/VulnerabilityRiskSummary";
import RiskSummary from "../components/RiskSummary";
import KeyVulnerabilities from "../components/KeyVulnerabilities";
import SecurityScanStatus from "../components/SecurityScanStatus";
import Toast from "../components/Toast";
import FloatingAssistant from "../components/FloatingAssistant";
import { fetchReconReport, fetchScanStatus, getPdfReportUrl, runScan } from "../services/reconApi";


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
  const privescCount = Array.isArray(reconData?.privesc_findings)
    ? (reconData?.privesc_findings || []).length
    : (reconData?.privesc_findings_count || 0);
  const webVulnCount = (reconData?.web_vulnerabilities || []).length;

  const allVulns = (reconData?.web_vulnerabilities || []).map((vuln) => ({
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
        text:
          reconData?.executive_summary ||
          (score > 0
            ? "Executive summary details were not stored for this scan record. Run a fresh scan to save full detail."
            : "Run a scan to generate an executive summary."),
      },
    ],
    keyVulnerabilities:
      allVulns.length > 0
        ? allVulns
        : [
            {
              name:
                score > 0
                  ? "Detailed vulnerability list not stored for this scan record"
                  : "No key vulnerabilities yet",
              status: "N/A",
              color: "#64748b",
            },
          ],
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
  const [historyLoading, setHistoryLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [domain, setDomain] = useState("");
  const [scanRunning, setScanRunning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [toast, setToast] = useState(null);

  const dashboardData = deriveDashboardData(scanResult, scanRunning, scanProgress);

  const loadLatestBackendReport = async (currentUser) => {
    try {
      return await fetchReconReport(currentUser);
    } catch (_error) {
      return null;
    }
  };

  const loadLatestUserScan = async (currentUser) => {
    if (!currentUser?.uid) {
      setScanHistory([]);
      setScanResult(null);
      return null;
    }

    setHistoryLoading(true);

    try {
      const scansQuery = query(
        collection(db, "scans"),
        where("userId", "==", currentUser.uid),
        limit(50)
      );
      const scansSnapshot = await getDocs(scansQuery);

      const scans = scansSnapshot.docs
        .map((docSnap) => {
          const data = docSnap.data() || {};
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt || null;
          return {
            id: docSnap.id,
            createdAt,
            ...data,
          };
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );

      setScanHistory(scans);

      const latestDetailed = scans.find((scan) => {
        const reportSnapshot = scan.reportSnapshot || {};
        const snapVulns = reportSnapshot.web_vulnerabilities || [];
        const fallbackVulns = scan.webVulnerabilities || [];
        return (
          snapVulns.length > 0 ||
          fallbackVulns.length > 0 ||
          Boolean(reportSnapshot.executive_summary) ||
          Boolean(scan.executiveSummary)
        );
      });

      const latest = latestDetailed || scans[0];
      if (!latest) {
        setScanResult(null);
        return null;
      }

      const snapshot = latest.reportSnapshot || {
        metadata: { timestamp: latest.createdAt || null },
        risk_summary: latest.riskSummary || {},
        overall_numeric_score: latest.riskScore ?? 0,
        compromise_probability_percent: latest.compromiseProbability ?? 0,
        web_vulnerabilities: latest.webVulnerabilities || [],
        privesc_findings_count: latest.privescCount ?? 0,
        executive_summary: latest.executiveSummary || "",
      };

      setScanResult(snapshot);
      return snapshot;
    } catch (error) {
      setScanHistory([]);
      setScanResult(null);
      return null;
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleScanStart = async () => {
    if (!domain.trim()) {
      setToast({ type: "warning", message: "Please enter a domain before scanning." });
      return;
    }

    setScanRunning(true);
    setScanProgress(0);

    try {
      await runScan(domain.trim(), auth.currentUser);

      // Poll backend status so the progress bar reflects real scan pipeline progress.
      let scanState = "running";
      while (scanState === "running") {
        const status = await fetchScanStatus(auth.currentUser);
        scanState = status?.state || "running";
        setScanProgress(Math.max(0, Math.min(100, Number(status?.progress) || 0)));

        if (scanState === "error") {
          throw new Error(status?.error || status?.message || "Scan failed. Please try again.");
        }

        if (scanState === "running") {
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
      }

      const updatedReport = await loadLatestBackendReport(auth.currentUser);
      let scanPersisted = true;

      const dashboardSnapshot = {
        metadata: {
          ...(updatedReport?.metadata || {}),
          timestamp: new Date().toISOString(),
        },
        risk_summary: updatedReport?.risk_summary || {},
        overall_numeric_score: updatedReport?.overall_numeric_score ?? 0,
        compromise_probability_percent: updatedReport?.compromise_probability_percent ?? 0,
        web_vulnerabilities: updatedReport?.web_vulnerabilities || [],
        privesc_findings_count: (updatedReport?.privesc_findings || []).length,
        executive_summary: updatedReport?.executive_summary || "",
      };

      setScanResult(dashboardSnapshot);

      // Persist scan metadata for admin user drill-down view.
      try {
        await addDoc(collection(db, "scans"), {
          userId: auth.currentUser?.uid || user?.uid || "unknown",
          userEmail: auth.currentUser?.email || user?.email || "-",
          domain: domain.trim(),
          status: "completed",
          riskScore: dashboardSnapshot.overall_numeric_score,
          compromiseProbability: dashboardSnapshot.compromise_probability_percent,
          riskSummary: dashboardSnapshot.risk_summary,
          webVulnerabilities: dashboardSnapshot.web_vulnerabilities,
          executiveSummary: dashboardSnapshot.executive_summary,
          vulnerabilityCount: dashboardSnapshot.web_vulnerabilities.length,
          privescCount: dashboardSnapshot.privesc_findings_count,
          reportSnapshot: dashboardSnapshot,
          createdAt: serverTimestamp(),
        });
      } catch (persistError) {
        console.warn("Scan history persistence failed:", persistError);
        scanPersisted = false;
      }

      setScanProgress(100);
      await loadLatestUserScan(auth.currentUser);
      setActiveTab("overview");
      setToast(
        scanPersisted
          ? { type: "success", message: "Scan completed. Dashboard has been updated." }
          : {
              type: "warning",
              message:
                "Scan completed, but history could not be saved to Firestore. Check Firestore rules for scans collection.",
            }
      );
    } catch (error) {
      setScanProgress(0);
      setToast({ type: "error", message: error.message || "Scan failed. Please try again." });
    } finally {
      setScanRunning(false);
    }
  };

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

      await loadLatestUserScan(currentUser);

      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
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
      <div className="pt-24 sm:pt-28 lg:pt-32 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === "overview" && (
            <>
              {/* Section 2: Risk Overview */}
              <div className="mb-6 sm:mb-8 rounded-3xl border border-cyan-500/30 bg-[linear-gradient(90deg,#0C1B1F_0%,#0B303B_100%)] p-3 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <RiskScoreCard data={dashboardData.riskScores} embedded />
                  <VulnerabilityRiskSummary data={dashboardData.vulnerabilities} embedded />
                </div>
              </div>

              {/* Section 3: Risk Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <RiskSummary items={dashboardData.riskSummaryItems} />
                <KeyVulnerabilities items={dashboardData.keyVulnerabilities} />
              </div>

              {/* Section 4: Security Scan Status */}
              <SecurityScanStatus data={dashboardData.scanStatus} />
            </>
          )}

          {activeTab === "tools" && (
            <div className="bg-[linear-gradient(41deg,#171717_30%,#0B303C_96%,#0B303C_100%)] border border-cyan-500/30 rounded-3xl p-4 sm:p-6 lg:p-8 font-['Inter'] font-semibold">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Run Security Scan</h2>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                <input
                  type="text"
                  value={domain}
                  onChange={(event) => setDomain(event.target.value)}
                  placeholder="Enter target domain (example.com)"
                  className="flex-1 bg-[#0a0e1a]/80 border border-cyan-500/30 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handleScanStart}
                  disabled={scanRunning}
                  className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed text-[#03141a] font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition text-sm sm:text-base whitespace-nowrap"
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
            <div className="bg-[linear-gradient(41deg,#171717_30%,#0B303C_96%,#0B303C_100%)] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 font-['Inter'] font-semibold">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-semibold">My Scan History</h2>
                <button
                  onClick={() => loadLatestUserScan(auth.currentUser)}
                  className="bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 px-4 py-2 rounded-lg hover:bg-cyan-500/30 transition"
                >
                  Refresh
                </button>
              </div>

              {historyLoading ? (
                <div className="text-gray-300 py-6 sm:py-8 text-center">Loading scan history...</div>
              ) : scanHistory.length === 0 ? (
                <div className="text-gray-400 py-6 sm:py-8 text-center text-sm sm:text-base">
                  No scans found yet. Run a scan from the Tools tab to populate history.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-cyan-500/20">
                  <table className="min-w-full text-xs sm:text-sm">
                    <thead className="bg-cyan-500/10 text-cyan-200">
                      <tr>
                        <th className="text-left px-2 sm:px-4 py-2 sm:py-3">Domain</th>
                        <th className="text-left px-2 sm:px-4 py-2 sm:py-3">Status</th>
                        <th className="text-left px-2 sm:px-4 py-2 sm:py-3">Risk Score</th>
                        <th className="text-left px-2 sm:px-4 py-2 sm:py-3">Vulns</th>
                        <th className="text-left px-2 sm:px-4 py-2 sm:py-3">Scanned At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanHistory.map((scan) => {
                        const createdAtDate = scan.createdAt ? new Date(scan.createdAt) : null;
                        const vulnerabilities =
                          scan.vulnerabilityCount ??
                          scan.webVulnerabilities?.length ??
                          scan.reportSnapshot?.web_vulnerabilities?.length ??
                          0;

                        return (
                          <tr key={scan.id} className="border-t border-cyan-500/10 hover:bg-white/5">
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-white truncate">{scan.domain || "-"}</td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs bg-green-500/20 text-green-300 border border-green-400/30 whitespace-nowrap">
                                {scan.status || "completed"}
                              </span>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-white">{scan.riskScore ?? 0}/10</td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-white">{vulnerabilities}</td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-300 text-[10px] sm:text-xs whitespace-nowrap">
                              {createdAtDate && !Number.isNaN(createdAtDate.getTime())
                                ? createdAtDate.toLocaleString()
                                : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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

      <FloatingAssistant currentUser={auth.currentUser} />
    </div>
  );
}
