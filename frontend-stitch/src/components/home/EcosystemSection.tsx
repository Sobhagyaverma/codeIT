const FEATURES = [
  {
    icon: "school",
    title: "DSA Learning",
    description:
      "Master Data Structures and Algorithms with step-by-step guidance, curated sheets, and comprehensive learning paths.",
  },
  {
    icon: "psychology",
    title: "AI Coach",
    description:
      "Get personalized feedback, code reviews, and hints precisely when you get stuck, powered by advanced AI.",
  },
  {
    icon: "swords",
    title: "Quick Clash",
    description:
      "Engage in rapid-fire coding battles with friends or random opponents to test your speed and accuracy under pressure.",
  },
] as const;

export default function EcosystemSection() {
  return (
    <section className="reveal relative z-20 mx-auto w-full max-w-[1200px] px-6 py-24">
      <div className="mb-16 text-center">
        <h2 className="font-headline-lg mb-4 text-[32px] font-medium text-white">
          The CodeIT Ecosystem
        </h2>
        <p className="text-[15px] text-white/50">
          Explore our toolkit and shape the future of collaborative coding.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {FEATURES.map((feature, i) => (
          <div
            key={feature.title}
            className={[
              "glass-card hover-lift reveal group relative flex flex-col items-center overflow-hidden rounded-2xl border-white/10 p-10 text-center transition-colors hover:border-[#a855f7]/50",
              i === 0 ? "stagger-1" : i === 1 ? "stagger-2" : "stagger-3",
            ].join(" ")}
          >
            <div className="absolute top-0 h-1 w-full bg-gradient-to-r from-transparent via-[#a855f7] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="material-symbols-outlined mb-6 text-[48px] text-[#a855f7] transition-transform group-hover:scale-110">
              {feature.icon}
            </span>
            <h4 className="font-headline-lg-mobile mb-3 text-[22px] text-white">
              {feature.title}
            </h4>
            <p className="text-[14px] leading-relaxed text-white/60">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
