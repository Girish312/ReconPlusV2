export default function RiskSummary({ items }) {
  return (
    <div className="bg-[linear-gradient(41deg,#171717_30%,#0B303C_96%,#0B303C_100%)] border border-cyan-500/30 rounded-3xl p-6 sm:p-8">
      <h2 className="text-2xl font-bold mb-8">Risk Summary</h2>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-4">
            <span className="text-2xl flex-shrink-0">{item.icon}</span>
            <p className="text-gray-300 leading-relaxed pt-1">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
