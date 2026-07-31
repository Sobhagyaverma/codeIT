import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const NAV_LINKS = [
  { to: "/dsa-sheet", label: "DSA Sheet" },
  { to: "/problems", label: "Problems" },
  { to: "/coderoom", label: "CodeRoom" },
  { to: "/competitions", label: "Competitions" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export default function Home() {
  const [navHidden, setNavHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const scrollingDown = y > lastY;
      // Hide once past a small threshold while scrolling down
      setNavHidden(scrollingDown && y > 64);
      lastY = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="font-body-md relative flex min-h-screen flex-col text-on-surface antialiased selection:bg-primary-container/30">
      <nav
        className={`fixed top-0 z-50 w-full bg-transparent py-6 transition-transform duration-300 ease-out ${
          navHidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-10">
          <Link to="/" className="flex items-center">
            <span className="font-headline-lg text-xl font-bold tracking-wide text-[#8b91cc] uppercase">
              CodeIT
            </span>
          </Link>

          <div className="hidden items-center gap-10 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="cursor-pointer text-[14px] text-white/70 transition-colors duration-200 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-full border border-white/20 bg-transparent px-6 py-2.5 text-[14px] font-semibold text-white transition-all hover:border-white/50 hover:bg-white/5"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-[#a855f7] px-6 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-opacity-90 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]"
            >
              Register
            </Link>
            <button type="button" className="ml-1 text-white md:hidden" aria-label="Open menu">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="relative flex-grow pt-32 pb-24">
        <section className="relative z-10 flex min-h-[80vh] w-full flex-col items-center justify-center overflow-hidden py-24">
          <div className="hero-arc-wrap">
            <div className="hero-glow" />
            <div className="hero-arc" />
          </div>

          <div className="relative z-20 mt-12 flex max-w-5xl flex-col items-center gap-6 px-4 text-center">
            <p className="font-code-sm mb-2 text-[12px] font-semibold tracking-[0.2em] text-[#a855f7] uppercase">
              WELCOME TO CODEIT
            </p>
            <h1 className="font-headline-lg-mobile text-[48px] leading-[1.1] font-medium tracking-tight text-white drop-shadow-2xl md:font-headline-xl md:text-[84px]">
              Master the Craft of Code, <br className="hidden md:block" />
              Together.
            </h1>
            <p className="font-body-lg mt-4 max-w-3xl text-[16px] font-light text-white/60 md:text-[20px] md:leading-[32px]">
              Empowering a collaborative future through intelligent IDEs, modular
              design, and ecosystem-driven growth. Execute faster, learn smarter.
            </p>

            <div className="mt-10 flex flex-col items-center gap-6 sm:flex-row">
              <Link
                to="/problems"
                className="font-body-md flex w-full items-center justify-center gap-2 rounded-full bg-[#a855f7] px-10 py-4 text-[15px] font-semibold text-white shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all hover:bg-opacity-90 hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] sm:w-auto"
              >
                Start Coding Now
              </Link>
              <Link
                to="/dsa-sheet"
                className="font-body-md flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-transparent px-10 py-4 text-[15px] font-semibold text-white transition-all hover:border-white/50 hover:bg-white/5 sm:w-auto"
              >
                View Demo
              </Link>
            </div>
          </div>
        </section>

        <section className="relative z-20 mx-auto w-full max-w-[1200px] px-6 py-24">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="flex flex-col justify-center pr-12">
              <p className="font-code-sm mb-4 text-[12px] font-semibold tracking-[0.1em] text-white/50 uppercase">
                ABOUT CODEIT PLATFORM
              </p>
              <h2 className="font-headline-lg mb-6 text-[36px] leading-[1.2] font-medium text-white">
                The Core of Competitive Problem Solving
              </h2>
              <p className="font-body-md mb-8 leading-relaxed text-white/60">
                The ultimate environment for competitive programmers. Solve complex
                problems, participate in high-stakes contests, and master DSA with
                real-time feedback and a unified compiler suite.
              </p>
              <div>
                <Link
                  to="/register"
                  className="mr-4 rounded-full bg-[#a855f7] px-8 py-3 text-[14px] font-semibold text-white transition-all hover:bg-opacity-90"
                >
                  Sign Up
                </Link>
                <Link
                  to="/about"
                  className="rounded-full bg-transparent px-8 py-3 text-[14px] font-semibold text-white transition-all hover:bg-white/5"
                >
                  LEARN MORE
                </Link>
              </div>
            </div>

            <div className="relative grid grid-cols-2 gap-4">
              <div className="grid-pattern pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-30" />
              <MetricCard value="11+" label="Languages Supported" />
              <MetricCard value="1000+" label="Handpicked Problems" />
              <MetricCard value="24/7" label="AI Mentoring" />
              <MetricCard value="99%" label="Uptime Guarantee" />
            </div>
          </div>
        </section>

        <section className="relative z-20 mx-auto w-full max-w-[1200px] px-6 py-24">
          <div className="mb-16 text-center">
            <h2 className="font-headline-lg mb-4 text-[32px] font-medium text-white">
              The CodeIT Ecosystem
            </h2>
            <p className="text-[15px] text-white/50">
              Explore our toolkit and shape the future of collaborative coding.
            </p>
            <Link
              to="/about"
              className="mt-6 inline-block rounded-full bg-[#a855f7] px-8 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-opacity-90"
            >
              Explore Features
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FeatureCard
              icon="groups"
              title="Solving Complexity Together"
              description="Collaborative Swarms: Intelligent networks that combine tools to handle complex workflows instantly."
            />
            <FeatureCard
              icon="psychology"
              title="Agents of Evolution"
              description="Individual AI Mentors form the foundation of our platform, capable of specialized guidance."
            />
            <FeatureCard
              icon="timer"
              title="Live Competition"
              description="Compete in timed contests with instant feedback. Real-time leaderboards and fast execution."
            />
          </div>
        </section>
      </main>

      <footer className="relative z-10 w-full border-t border-white/5 bg-[#030305] pt-16 pb-8">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-5">
            <div className="col-span-2">
              <span className="font-headline-lg mb-4 block text-xl font-bold tracking-wide text-[#8b91cc] uppercase">
                CodeIT
              </span>
              <p className="max-w-xs text-[13px] text-white/40">
                Connect and build on the advanced collaborative IDE platform.
              </p>
            </div>
            <FooterColumn
              title="Services"
              links={[
                { to: "/problems", label: "Features" },
                { to: "/competitions", label: "Solutions" },
                { to: "/about", label: "Testimonials" },
                { to: "/help", label: "FAQ" },
              ]}
            />
            <FooterColumn
              title="Company"
              links={[
                { to: "/about", label: "About" },
                { to: "/contact", label: "Blog" },
                { to: "/privacy", label: "Privacy Policy" },
                { to: "/terms", label: "Terms of Use" },
              ]}
            />
            <FooterColumn
              title="Social"
              links={[
                { to: "/contact", label: "Twitter (X)" },
                { to: "/contact", label: "LinkedIn" },
                { to: "/contact", label: "Discord" },
                { to: "/contact", label: "GitHub" },
              ]}
            />
          </div>

          <div className="flex flex-col items-center justify-between border-t border-white/5 pt-8 md:flex-row">
            <span className="text-[12px] text-white/40">
              © 2024 CodeIT Platform. All rights reserved.
            </span>
            <div className="mt-4 flex gap-4 md:mt-0">
              <Link to="/contact" className="text-white/40 transition-colors hover:text-white">
                <span className="material-symbols-outlined text-[20px]">public</span>
              </Link>
              <Link to="/contact" className="text-white/40 transition-colors hover:text-white">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass-card relative z-10 flex h-[220px] flex-col items-center justify-center rounded-2xl p-8 text-center">
      <h3 className="font-headline-lg mb-2 text-[40px] font-bold text-white">{value}</h3>
      <p className="text-[14px] text-white/50">{label}</p>
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-[#a855f7]/5 to-transparent" />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="glass-card group relative flex flex-col items-center overflow-hidden rounded-2xl p-8 text-center">
      <div className="absolute top-0 h-1 w-full bg-gradient-to-r from-transparent via-[#a855f7] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <span className="material-symbols-outlined mb-6 text-[32px] text-[#a855f7]">{icon}</span>
      <h4 className="font-headline-lg-mobile mb-3 text-[18px] text-white">{title}</h4>
      <p className="text-[13px] leading-relaxed text-white/50">{description}</p>
    </div>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { to: string; label: string }[];
}) {
  return (
    <div>
      <h5 className="mb-4 text-[14px] font-semibold text-white">{title}</h5>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            <Link
              to={link.to}
              className="text-[13px] text-white/50 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
