import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

export default function RiskScoreCard({ data }) {
  return (
    <div className="bg-[linear-gradient(41deg,#171717_30%,#0B303C_96%,#0B303C_100%)] border border-cyan-500/30 rounded-3xl p-6 sm:p-8">
      <h2 className="text-2xl font-bold mb-6">Overall Risk Score</h2>

      {/* Status Badge */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-gray-400 text-sm mb-2">Status:</p>
          <span className="bg-orange-500/20 text-orange-400 px-4 py-1 rounded-full text-sm font-semibold">
            Warning
          </span>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "rgba(255, 255, 255, 0.8)", 
                border: "1px solid #06b6d4",
                borderRadius: "8px"
              }}
              formatter={(value) => `${value}%`}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              wrapperStyle={{ paddingTop: "20px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
