import { Link } from "react-router-dom";

export default function FinalCtaSection() {
  return (
    <section className="reveal relative z-20 mx-auto w-full max-w-[1000px] px-6 py-24 text-center">
      <div className="glass-card group relative overflow-hidden rounded-3xl border border-[#a855f7]/20 p-12 shadow-[0_0_50px_rgba(168,85,247,0.1)] md:p-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#a855f7]/20 to-transparent opacity-50 transition-opacity duration-700 group-hover:opacity-100" />
        <h2 className="font-headline-lg relative z-10 mb-6 text-[40px] font-medium text-white drop-shadow-lg md:text-[56px]">
          Ready To Level Up Your Coding Journey?
        </h2>
        <p className="relative z-10 mx-auto mb-10 max-w-2xl text-[16px] text-white/60 md:text-[18px]">
          Join thousands of developers mastering algorithms, dominating contests,
          and preparing for top tech interviews.
        </p>
        <div className="relative z-10 flex flex-col items-center justify-center gap-6 sm:flex-row">
          <Link
            to="/problems"
            className="btn-glow font-body-md flex w-full items-center justify-center gap-2 rounded-full bg-[#a855f7] px-10 py-4 text-[15px] font-semibold text-white shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all hover:bg-opacity-90 hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] sm:w-auto"
          >
            Start Coding
          </Link>
          <Link
            to="/competitions/quick"
            className="btn-glow font-body-md flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-transparent px-10 py-4 text-[15px] font-semibold text-white transition-all hover:border-white/50 hover:bg-white/5 sm:w-auto"
          >
            Quick Clash
          </Link>
        </div>
      </div>
    </section>
  );
}
