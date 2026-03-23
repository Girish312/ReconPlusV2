export default function RiskSummary({ items }) {
  return (
    <div className="h-full min-h-[215px] bg-[linear-gradient(90deg,#171717_0%,#0C1A20_100%)] border border-cyan-400/20 rounded-3xl px-6 py-5 sm:px-6 sm:py-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] font-['Inter'] font-semibold">
      <h2 className="text-white text-[32px] leading-tight font-semibold">Risk Summary</h2>
      <div className="h-px w-full bg-gradient-to-r from-white/30 to-transparent mt-2 mb-4" />

      <div className="space-y-4">
        {items.slice(0, 3).map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <span className="text-amber-300 text-lg leading-none mt-0.5">⚠</span>
            <p className="text-gray-300 text-base sm:text-lg leading-snug font-semibold">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
