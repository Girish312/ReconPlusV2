export default function ProblemSection() {
  return (
    <section className="relative py-16 sm:py-20 bg-gradient-to-b from-[#0a0e1a] to-[#0f1421]">
      <div className="max-w-7xl  pr-4 sm:pr-6 lg:pr-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* LEFT: Feature container */}
          <div className="order-2 lg:order-1">
            <div
              className="
                bg-gradient-to-br from-cyan-500/5 to-blue-500/5
                border border-cyan-500/30 border-l-0
                rounded-r-3xl
                p-6 sm:p-8 lg:p-10
              "
            >
              {/* Icons row */}
              <div className="flex flex-row justify-between gap-6">
                {[
                  {
                    title: 'Suspicious Request Monitoring',
                    icon: '/images/icons/suspicious-monitoring.png'
                  },
                  {
                    title: 'Probing Detection',
                    icon: '/images/icons/probing-detection.png'
                  },
                  {
                    title: 'Early warning alerts',
                    icon: '/images/icons/early-warning.png'
                  }
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center text-center space-y-3 w-1/3"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl"></div>
                      <img
                        src={feature.icon}
                        alt={feature.title}
                        className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-24 md:h-24 object-contain"
                      />
                    </div>

                    <p className="text-sm sm:text-base font-semibold text-white leading-snug">
                      {feature.title}
                    </p>
                  </div>
                ))}

              </div>
            </div>
          </div>

          {/* RIGHT: Problem text */}
          <div className="order-1 lg:order-2 space-y-6 px-4 sm:px-6 lg:px-8 text-left">
            <h2 className="text-2xl sm:text-4xl font-bold text-white">
              The Problem
            </h2>
            <p className="text-gray-300 text-lg sm:text-xl leading-relaxed text-justify">
              Attackers begin by probing ports, endpoints & vulnerabilities long
              before launching a full attack. Most systems detect threats only
              after the damage is done, but ReconnPlus identifies these early-stage
              activities in real time, helping you prevent breaches before they
              happen.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
