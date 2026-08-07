const STEPS = [
  {
    icon: "person_add",
    title: "Create Account",
    description:
      "Sign up and set up your profile to start tracking your progress.",
    side: "left" as const,
  },
  {
    icon: "school",
    title: "Learn & Practice",
    description:
      "Follow structured DSA sheets and solve curated problems daily.",
    side: "right" as const,
  },
  {
    icon: "emoji_events",
    title: "Compete",
    description:
      "Join Quick Clash battles and live contests to test your speed.",
    side: "left" as const,
  },
  {
    icon: "trending_up",
    title: "Improve Your Skills",
    description:
      "Review your performance, get AI feedback, and watch your rank climb.",
    side: "right" as const,
  },
] as const;

export default function HowItWorksSection() {
  return (
    <section className="reveal relative z-20 mx-auto w-full max-w-[1000px] px-6 py-24">
      <div className="mb-16 text-center">
        <h2 className="font-headline-lg mb-4 text-[32px] font-medium text-white">
          How CodeIT Works
        </h2>
        <p className="text-[15px] text-white/50">
          Your journey to competitive programming mastery.
        </p>
      </div>
      <div className="relative">
        <div className="absolute top-0 bottom-0 left-[28px] w-[2px] bg-white/10 md:left-1/2 md:-translate-x-1/2" />
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className={[
              "reveal group relative mb-12 flex flex-col items-start justify-between md:flex-row md:items-center",
              i === 0
                ? "stagger-1"
                : i === 1
                  ? "stagger-2"
                  : i === 2
                    ? "stagger-3"
                    : "stagger-4",
              i === STEPS.length - 1 ? "mb-0" : "",
            ].join(" ")}
          >
            {step.side === "left" ? (
              <>
                <div className="order-2 mt-4 pl-16 md:order-1 md:mt-0 md:w-[45%] md:pl-0 md:text-right">
                  <h4 className="font-headline-lg-mobile mb-2 text-[20px] text-white">
                    {step.title}
                  </h4>
                  <p className="text-[14px] text-white/50">{step.description}</p>
                </div>
                <div className="absolute left-0 z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#a855f7] bg-[#08080b] shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-transform group-hover:scale-110 group-hover:bg-[#a855f7]/20 md:left-1/2 md:-translate-x-1/2">
                  <span className="material-symbols-outlined text-[#a855f7]">
                    {step.icon}
                  </span>
                </div>
                <div className="order-3 md:order-3 md:w-[45%]" />
              </>
            ) : (
              <>
                <div className="order-2 md:order-1 md:w-[45%]" />
                <div className="absolute left-0 z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#a855f7] bg-[#08080b] shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-transform group-hover:scale-110 group-hover:bg-[#a855f7]/20 md:left-1/2 md:-translate-x-1/2">
                  <span className="material-symbols-outlined text-[#a855f7]">
                    {step.icon}
                  </span>
                </div>
                <div className="order-3 mt-4 pl-16 md:order-3 md:mt-0 md:w-[45%] md:pl-0 md:text-left">
                  <h4 className="font-headline-lg-mobile mb-2 text-[20px] text-white">
                    {step.title}
                  </h4>
                  <p className="text-[14px] text-white/50">{step.description}</p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
