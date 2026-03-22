
import { useState, useEffect, useRef } from "react";

// A dedicated component for the feature card with the new effects
const FeatureCard = ({ feature }) => (
  // Main container with 'group' class for hover effects
  <div className="group relative overflow-hidden rounded-xl bg-[#0b1622] p-8 shadow-2xl transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-blue-500/50">

    {/* The "Glow" Effect Container (requires 'after:' config in tailwind.config.js) */}
    {/* This element creates the blurred blue light source */}
    <div className="absolute inset-x-0 top-0 h-48">
      <div className="absolute after:absolute after:h-full after:w-full after:rounded-full after:bg-blue-600/30 after:filter after:blur-3xl after:opacity-70 after:transition-opacity after:duration-500 after:group-hover:opacity-100"></div>
    </div>

    {/* Content Wrapper (Ensures content is above the glow) */}
    <div className="relative z-10 flex flex-col items-center text-center space-y-6">

      {/* Icon/Image Placeholder */}
      <div className="w-20 h-20 rounded-full bg-[#0f2533] flex items-center justify-center">
        <img src={feature.icon} alt={feature.title} className="w-20 h-20" />
      </div>
      
      {/* Text Content */}
      <h3 className="text-lg sm:text-xl font-semibold text-white">
        {feature.title}
      </h3>
      <p className="text-sm sm:text-lg text-gray-400">
        {feature.description}
      </p>

    </div>
  </div>
);


export default function KeyFeatures() {
  const features = [
    {
      title: "Real-time Detection",
      description:
        "Get instant alerts when someone scans, probes or targets your system.",
      icon: "/images/features/realtime-detection.png",
    },
    {
      title: "AI-Driven Accuracy",
      description:
        "Smarter detection with fewer false alarms, learns from real attack patterns.",
      icon: "/images/features/ai-accuracy.png",
    },
    {
      title: "Visual Dashboard",
      description:
        "See all logs, alerts, trends and activity clearly in a user-friendly UI.",
      icon: "/images/features/dashboard.png",
    },
    {
      title: "Proactive Protection",
      description:
        "Identify threats in their earliest stages and prevent damage before it happens.",
      icon: "/images/features/proactive-protection.png",
    },
  ];

  const containerRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(1);

  // Detect visible cards based on screen width
  useEffect(() => {
    const updateVisibleCards = () => {
      const width = window.innerWidth;

      if (width >= 1024) setVisibleCards(4);
      else if (width >= 640) setVisibleCards(2);
      else setVisibleCards(1);
    };

    updateVisibleCards();
    window.addEventListener("resize", updateVisibleCards);
    return () => window.removeEventListener("resize", updateVisibleCards);
  }, []);

  // Clamp index if screen size changes
  useEffect(() => {
    const maxIndex = Math.max(features.length - visibleCards, 0);
    if (index > maxIndex) setIndex(maxIndex);
  }, [visibleCards, index, features.length]);

  const maxIndex = Math.max(features.length - visibleCards, 0);

  return (
    <section className="relative py-20 bg-gradient-to-b from-[#0a0e1a] to-[#0f1421]">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <h2 className="text-2xl sm:text-4xl font-bold text-white text-center mb-20">
          Key Features
        </h2>

        {/* Connector */}
        <div className="absolute left-1/2 top-[120px] -translate-x-1/2 w-[90%] h-[260px] rounded-[40px] border border-cyan-500/30 z-[-1]" />

        {/* MOBILE + TABLET SLIDER */}
        <div className="relative lg:hidden">

          {/* Left Button */}
          {index > 0 && (
            <button
              onClick={() => setIndex((i) => i - 1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-[#0f2533] border border-cyan-500/30 rounded-full w-10 h-10 flex items-center justify-center text-cyan-400"
            >
              ‹
            </button>
          )}

          {/* Right Button */}
          {index < maxIndex && (
            <button
              onClick={() => setIndex((i) => i + 1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-[#0f2533] border border-cyan-500/30 rounded-full w-10 h-10 flex items-center justify-center text-cyan-400"
            >
              ›
            </button>
          )}

          <div className="overflow-hidden">
            <div
              ref={containerRef}
              className="flex transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${index * (100 / visibleCards)}%)`,
              }}
            >
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="w-full sm:w-1/2 flex-shrink-0 px-3"
                >
                  {/* Using the new component here */}
                  <FeatureCard feature={feature} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DESKTOP GRID */}
        <div className="hidden lg:grid grid-cols-4 gap-8 relative z-10">
          {features.map((feature, i) => (
            // Using the new component here
            <FeatureCard key={i} feature={feature} />
          ))}
        </div>

      </div>
    </section>
  );
}
