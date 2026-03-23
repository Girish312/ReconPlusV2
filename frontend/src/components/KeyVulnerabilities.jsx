export default function KeyVulnerabilities({ items }) {
  const toLabel = (status) => {
    if (!status) return "";
    const normalized = String(status).toUpperCase();
    if (["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"].includes(normalized)) {
      return "Detected";
    }
    return status;
  };

  return (
    <div className="h-full min-h-[215px] bg-[linear-gradient(90deg,#171717_0%,#0C1A20_100%)] border border-cyan-400/20 rounded-3xl px-6 py-5 sm:px-6 sm:py-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] font-['Inter'] font-semibold">
      <h2 className="text-white text-[32px] leading-tight font-semibold">Key Vulnerabilities</h2>
      <div className="h-px w-full bg-gradient-to-r from-white/30 to-transparent mt-2 mb-4" />

      <div className="max-h-[220px] overflow-y-auto pr-1 space-y-1.5">
        {items.map((item, index) => {
          const label = toLabel(item.status);
          return (
            <div key={index} className="text-lg sm:text-xl font-semibold leading-snug">
              <span style={{ color: item.color }}>{item.name}</span>
              {label ? <span className="text-gray-400"> {label}</span> : null}
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="text-gray-400 text-base sm:text-lg">No key vulnerabilities yet</div>
        )}
      </div>
    </div>
  );
}
