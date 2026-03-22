export default function KeyVulnerabilities({ items }) {
  return (
    <div className="bg-[linear-gradient(41deg,#171717_30%,#0B303C_96%,#0B303C_100%)] border border-cyan-500/30 rounded-3xl p-6 sm:p-8">
      <h2 className="text-2xl font-bold mb-8">Key Vulnerabilities</h2>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-[#0a0e1a]/50 rounded-xl border border-cyan-500/10 hover:border-cyan-500/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="font-semibold">{item.name}</span>
            </div>
            <span className="text-sm font-medium" style={{ color: item.color }}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
