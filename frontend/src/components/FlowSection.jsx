export default function FlowSection() {
  return (
    <section className="relative py-16 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-4xl font-bold text-white text-center mb-12 sm:mb-16 animate-fadeIn">
          How ReconnPlus Works
        </h2>

        {/* Flowchart - Responsive scaling */}
        <div className="relative w-full animate-slideInUp">
          <div className="w-full flex justify-center items-center">
            <img
              src="/images/flowchart.png"
              alt="ReconnPlus Workflow"
              className="w-full max-w-4xl mx-auto h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </section>

  );
}
