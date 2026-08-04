const ITEMS = [
  {
    icon: "code_blocks",
    title: "Problems Repository",
    description:
      "Access a massive repository of coding challenges ranging from easy to hard. Filter by topic, company, and difficulty.",
    className: "md:col-span-2 md:row-span-2",
    titleClass: "text-[24px]",
    iconSize: "text-[40px]",
    descClass: "text-[15px]",
    stagger: 1,
  },
  {
    icon: "checklist",
    title: "DSA Learning",
    description: "Structured roadmap to master algorithms.",
    className: "md:col-span-2",
    titleClass: "text-[20px]",
    iconSize: "text-[32px]",
    descClass: "text-[14px]",
    stagger: 2,
  },
  {
    icon: "emoji_events",
    title: "Competitions",
    description: "Join global contests.",
    className: "md:col-span-1",
    titleClass: "text-[20px]",
    iconSize: "text-[32px]",
    descClass: "text-[14px]",
    stagger: 3,
  },
  {
    icon: "flash_on",
    title: "Quick Clash",
    description: "Fast-paced 1v1 battles.",
    className: "md:col-span-1",
    titleClass: "text-[20px]",
    iconSize: "text-[32px]",
    descClass: "text-[14px]",
    stagger: 4,
  },
  {
    icon: "group",
    title: "Friends & Community",
    description: "Connect, track progress, and learn together.",
    className: "md:col-span-2",
    titleClass: "text-[20px]",
    iconSize: "text-[32px]",
    descClass: "text-[14px]",
    stagger: 1,
  },
  {
    icon: "smart_toy",
    title: "AI Coach",
    description: "24/7 personal tutor.",
    className: "md:col-span-1",
    titleClass: "text-[20px]",
    iconSize: "text-[32px]",
    descClass: "text-[14px]",
    stagger: 2,
  },
  {
    icon: "terminal",
    title: "CodeRoom",
    description: "Collaborative IDE.",
    className: "md:col-span-1",
    titleClass: "text-[20px]",
    iconSize: "text-[32px]",
    descClass: "text-[14px]",
    stagger: 3,
  },
] as const;

export default function EverythingIncludedSection() {
  return (
    <section className="reveal relative z-20 mx-auto w-full max-w-[1200px] px-6 py-24">
      <div className="mb-16 text-center">
        <h2 className="font-headline-lg mb-4 text-[32px] font-medium text-white">
          Everything Included
        </h2>
        <p className="text-[15px] text-white/50">
          A complete platform designed to accelerate your growth.
        </p>
      </div>
      <div className="grid auto-rows-[200px] grid-cols-1 gap-4 md:grid-cols-4">
        {ITEMS.map((item) => (
          <div
            key={item.title}
            className={[
              "glass-card hover-lift reveal group relative flex flex-col justify-between overflow-hidden rounded-2xl border-white/5 p-8 transition-all hover:border-[#a855f7]/30",
              item.stagger === 1
                ? "stagger-1"
                : item.stagger === 2
                  ? "stagger-2"
                  : item.stagger === 3
                    ? "stagger-3"
                    : "stagger-4",
              item.className,
            ].join(" ")}
          >
            {item.title === "Problems Repository" && (
              <div className="absolute inset-0 bg-gradient-to-br from-[#a855f7]/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            )}
            <span
              className={`material-symbols-outlined mb-4 text-[#a855f7] transition-transform group-hover:scale-110 ${item.iconSize}`}
            >
              {item.icon}
            </span>
            <div>
              <h4
                className={`font-headline-lg-mobile mb-1 text-white ${item.titleClass} ${
                  item.title === "Problems Repository" ? "mb-2" : ""
                }`}
              >
                {item.title}
              </h4>
              <p className={`leading-relaxed text-white/60 ${item.descClass}`}>
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
