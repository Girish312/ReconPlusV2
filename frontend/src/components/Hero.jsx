export default function Hero() {
    return (
        <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-20">
            <div className="absolute inset-0 z-0">
                <img
                    src="/images/hero-background.png"
                    alt=""
                    className="w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a]/70 via-[#0a0e1a]/50 to-[#0a0e1a]"></div>
            </div>

            {/* Animated particles effect */}
            <div className="absolute inset-0 z-0 opacity-20">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${5 + Math.random() * 10}s`
                        }}
                    ></div>
                ))}
            </div>

            <div className="relative z-10 max-w-7xl  px-4 sm:px-6 lg:px-8 py-16 w-full">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6 max-w-xl  lg:mx-0 animate-slideInLeft text-center lg:text-left">
                        <h1 className="font-bold leading-tight text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-left">
                            Detect threats <br className="hidden sm:block" />
                            before they detect you.
                        </h1>
                        <p className="text-gray-300 text-lg sm:text-xl md:text-xl leading-relaxed max-w-lg lg:mx-0 text-left">
                            An AI powered reconaissance detection tool that monitors suspicious activity, flags attacker behaviour and help secure your infrastructure proactively
                        </p>
                    </div>

                    <div className="flex justify-center lg:justify-end animate-slideInRight">
                        <div className="relative">
                            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
                            <img
                                src="/images/hero-icon.png"
                                alt="Security Shield"
                                className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-[400px] lg:h-[400px] object-contain drop-shadow-2xl"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
