import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function RiskScoreCard({ data, embedded = false }) {
  const critical = data.find((entry) => entry.name?.toLowerCase() === "critical")?.value || 0;
  const high = data.find((entry) => entry.name?.toLowerCase() === "high")?.value || 0;

  const status = critical >= 20 ? "Critical" : critical > 0 || high >= 30 ? "Warning" : "Stable";

  const statusClasses =
    status === "Critical"
      ? "bg-red-500/80 text-white"
      : status === "Warning"
        ? "bg-amber-500 text-[#1f1204]"
        : "bg-emerald-500/80 text-white";

  const chartPalette = ["#6ddfe0", "#2a7f99", "#3f94ad", "#1e647d"];

  const containerClass = embedded
    ? "h-full min-h-[290px] rounded-2xl p-6 sm:p-7 font-['Inter'] font-semibold"
    : "h-full min-h-[290px] bg-[linear-gradient(100deg,#09121a_0%,#083140_58%,#0a3a4a_100%)] border border-cyan-400/20 rounded-3xl p-6 sm:p-7 shadow-[0_10px_30px_rgba(0,0,0,0.35)] font-['Inter'] font-semibold";

  return (
    <div className={containerClass}>
      <h2 className="text-white text-[28px] leading-tight font-semibold mb-4">Overall Risk Score</h2>

      <div className="h-[185px] sm:h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={74}
              stroke="none"
              paddingAngle={0}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartPalette[index % chartPalette.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1 flex items-center gap-2 text-white/90 text-xl font-semibold">
        <span className="text-[26px] leading-none">Status:</span>
        <span className={`px-6 py-1 rounded-full text-lg font-semibold ${statusClasses}`}>
          {status}
        </span>
      </div>
    </div>
  );
}
