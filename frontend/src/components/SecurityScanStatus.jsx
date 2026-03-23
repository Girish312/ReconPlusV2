export default function SecurityScanStatus({ data }) {
  const progressPercentage = Math.max(0, Math.min(100, Number(data.progress) || 0));

  const toLastScanParts = (value) => {
    if (!value || value === "No scans yet") {
      return { primary: "No scans yet", secondary: "" };
    }

    const parts = String(value).split(",").map((part) => part.trim());
    if (parts.length >= 2) {
      return {
        primary: parts[0],
        secondary: parts.slice(1).join(", "),
      };
    }

    return { primary: String(value), secondary: "" };
  };

  const lastScan = toLastScanParts(data.lastScan);

  return (
    <div className="rounded-3xl border border-cyan-500/30 bg-[linear-gradient(90deg,#0C1B1F_0%,#0B303B_100%)] px-3 py-4 sm:px-6 sm:py-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] font-['Inter'] font-semibold">
      <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h2 className="text-white text-base sm:text-lg lg:text-xl leading-none">Security Scan Status</h2>
          <span className="inline-flex items-center rounded-full border border-cyan-300/20 bg-[#10252d] px-3 py-0.5 sm:px-4 sm:py-1 text-[13px] sm:text-[15px] text-white/70 whitespace-nowrap">
            Current Scan :
            <span className="ml-1.5 sm:ml-2 text-white">{data.status}</span>
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 items-center gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-[1.6fr_0.8fr_0.8fr] lg:gap-8">
        <div className="rounded-2xl bg-[#141414] border border-cyan-500/20 px-4 py-5 sm:px-5 sm:py-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-[32px] lg:text-[36px] leading-none text-cyan-400">{progressPercentage}%</span>
            <div className="h-6 sm:h-8 w-full rounded-full border border-cyan-500/40 bg-[#0f1520] overflow-hidden">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#38d6ff_0%,#1f8fbd_60%,#135a76_100%)] transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="text-center md:text-left">
          <p className="text-lg sm:text-2xl lg:text-3xl leading-tight text-white/80">Estimated</p>
          <p className="text-lg sm:text-2xl lg:text-3xl leading-tight text-white/80">completion time</p>
          <p className="mt-1 text-base sm:text-xl lg:text-2xl leading-none text-white/55">{data.estimatedTime}</p>
        </div>

        <div className="text-center md:text-left">
          <p className="text-lg sm:text-2xl lg:text-3xl leading-tight text-white/80">Last scan</p>
          <p className="mt-1 text-base sm:text-xl lg:text-2xl leading-none text-white/55">{lastScan.primary}</p>
          {lastScan.secondary && (
            <p className="mt-1 text-base sm:text-xl lg:text-2xl leading-none text-white/55">{lastScan.secondary}</p>
          )}
        </div>
      </div>
    </div>
  );
}
