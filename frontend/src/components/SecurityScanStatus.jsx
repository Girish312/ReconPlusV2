export default function SecurityScanStatus({ data }) {
  const progressPercentage = data.progress;

  return (
    <div className="bg-[linear-gradient(41deg,#171717_30%,#0B303C_96%,#0B303C_100%)] border border-cyan-500/30 rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <h2 className="text-2xl font-bold">Security Scan Status</h2>
        <span className="text-cyan-400 text-sm font-semibold mt-2 sm:mt-0 bg-cyan-500/20 px-4 py-1 rounded-full w-fit">
          Current Scan : {data.status}
        </span>
      </div>

      {/* Progress Bar Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold">{progressPercentage}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-700/30 rounded-full h-3 overflow-hidden border border-cyan-500/20">
          <div
            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-[#0a0e1a]/50 rounded-xl p-4 border border-cyan-500/10">
          <p className="text-gray-400 text-sm mb-2">Estimated completion time</p>
          <p className="text-2xl font-bold text-cyan-400">{data.estimatedTime}</p>
        </div>
        
        <div className="bg-[#0a0e1a]/50 rounded-xl p-4 border border-cyan-500/10">
          <p className="text-gray-400 text-sm mb-2">Last scan</p>
          <p className="text-2xl font-bold">{data.lastScan}</p>
        </div>
      </div>
    </div>
  );
}
