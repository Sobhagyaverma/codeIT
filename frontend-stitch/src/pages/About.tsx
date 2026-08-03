import { Link } from "react-router-dom";
import AppNav from "../components/AppNav";

const PILLARS = [
  {
    icon: "account_tree",
    title: "Structured Practice",
    body: "Topic-by-topic DSA roadmap and full problem catalog.",
  },
  {
    icon: "emoji_events",
    title: "Real Contests",
    body: "Timed rounds, hidden tests, and live standings.",
  },
  {
    icon: "smart_toy",
    title: "AI Assistance",
    body: "Intelligent code explanations grounded in problem context.",
  },
  {
    icon: "monitoring",
    title: "Progress Visibility",
    body: "Streaks, heatmaps, and per-topic analytics.",
  },
] as const;

export default function About() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background text-on-surface">
      <AppNav activeHint="/about" />

      <main className="mx-auto w-full max-w-[1440px] space-y-32 px-4 pb-24 pt-32 md:px-12">
        <section className="relative flex flex-col items-center space-y-8 text-center">
          <div className="absolute left-1/2 top-1/2 z-[-1] size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px]" />
          <h1 className="font-headline text-5xl font-extrabold tracking-tight text-primary drop-shadow-[0_0_15px_rgba(183,109,255,0.5)] md:text-6xl">
            CodeIT
          </h1>
          <h2 className="max-w-3xl font-headline text-2xl font-bold text-on-surface md:text-3xl">
            Built for the grind, designed for growth.
          </h2>
          <p className="max-w-2xl font-body text-lg text-on-surface-variant">
            CodeIT combines problem solving, contests, progress tracking, and
            intelligent assistance in one focused environment — practice
            systematically, measure honestly, improve steadily.
          </p>
          <div className="flex flex-col gap-4 pt-4 sm:flex-row">
            <Link
              to="/problems"
              className="rounded-xl bg-primary px-8 py-3 font-label text-sm font-bold text-on-primary transition hover:brightness-110"
            >
              Start practicing
            </Link>
            <Link
              to="/competitions"
              className="rounded-xl border border-outline-variant/40 bg-transparent px-8 py-3 font-label text-sm font-bold text-on-surface backdrop-blur-md transition hover:bg-surface-container-high"
            >
              View competitions
            </Link>
          </div>
        </section>

        <section className="glass-panel group relative overflow-hidden rounded-xl p-12">
          <div className="absolute left-0 top-0 h-full w-1 bg-primary-container shadow-[0_0_10px_#b76dff]" />
          <h3 className="mb-6 flex items-center gap-2 font-headline text-2xl font-bold text-primary">
            <span className="material-symbols-outlined text-3xl">
              rocket_launch
            </span>{" "}
            Mission
          </h3>
          <p className="font-body text-lg leading-relaxed text-on-surface-variant">
            A dedicated platform for DSA practice — structured, interactive, and
            user-focused. CodeIT helps you sharpen technical ability and
            analytical thinking through systematic practice and performance
            evaluation.
          </p>
        </section>

        <section className="space-y-12">
          <h3 className="text-center font-headline text-2xl font-bold text-on-surface">
            Core Pillars
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="glass-panel flex flex-col gap-4 rounded-xl p-8 transition-all duration-300 hover:shadow-[0_0_24px_rgba(183,109,255,0.15)]"
              >
                <div className="flex size-12 items-center justify-center rounded-full border border-primary-container/30 bg-primary-container/20">
                  <span className="material-symbols-outlined text-primary-container">
                    {p.icon}
                  </span>
                </div>
                <h4 className="font-headline text-xl font-bold text-primary-fixed">
                  {p.title}
                </h4>
                <p className="font-body text-on-surface-variant">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-12">
          <h3 className="text-center font-headline text-2xl font-bold text-on-surface">
            Architects
          </h3>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="glass-panel group flex flex-col items-center gap-6 rounded-xl p-8 transition-colors duration-300 hover:border-primary-container md:flex-row md:items-start">
              <div className="relative size-24 flex-shrink-0 overflow-hidden rounded-full border-2 border-outline-variant bg-surface-container-high">
                <img
                  alt="Sobhagya Verma"
                  className="size-full object-cover opacity-80 mix-blend-luminosity transition-all group-hover:opacity-100 group-hover:mix-blend-normal"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCh6qpB1Wbis-GPcJnRdhmjHPlmsk9bfSw0F0j0KcsFcuvLydL3TJcBEBOLMVUGmE3DxN3LSiUbYcr9WFPeS4nJ7OVK3z67Aw5QTQW7eKmYIWYTHELSyz5oDS-g6VzwELmy1FgY0bv5doZunyk4eUTif-su81vxqVheNWRzdUQzSTAz9l3MmV-74oxFQv7p4IIoCtaYYoeeXRgg9XIa3BNylRfu7FFTTT3_qf-aUFHb01gD8Gdjplsj"
                />
              </div>
              <div className="flex flex-col gap-2 text-center md:text-left">
                <h4 className="font-headline text-xl font-bold text-primary">
                  Sobhagya Verma
                </h4>
                <div className="mx-auto inline-block w-max rounded-full border border-primary-container/20 bg-primary-container/10 px-3 py-1 md:mx-0">
                  <span className="font-label text-sm text-primary-container">
                    Backend / Database
                  </span>
                </div>
                <p className="mt-2 font-body text-on-surface-variant">
                  CS undergrad / aspiring AI-ML. Built CodeIT backend + database
                  (scalable APIs, reliable architecture, data handling).
                </p>
              </div>
            </div>
            <div className="glass-panel group flex flex-col items-center gap-6 rounded-xl p-8 transition-colors duration-300 hover:border-primary-container md:flex-row md:items-start">
              <div className="relative size-24 flex-shrink-0 overflow-hidden rounded-full border-2 border-outline-variant bg-surface-container-high">
                <img
                  alt="Manya Katakol"
                  className="size-full object-cover opacity-80 mix-blend-luminosity transition-all group-hover:opacity-100 group-hover:mix-blend-normal"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4R_rlfBx73e0pW7vfST5QRDn3mvTZmzACNrAt24aOdNHf25USEvIo-19ozwnabsnDMdB2ziF84NfyF0Q6QkjLhGDneRdLfWwg8oc1m12u1DPvUFd7stBCnyFL17dmAxShBrUubgkXrfk9-OaIg5_l-vASwxDbpUiNolXxUMcfwI4l8mynBpzyfT_1x46DQFYdnefFC6S9oDN_a2P1Jgow2us7Ug3G5boJwDOBRK6UW7nqp4zFinoV"
                />
              </div>
              <div className="flex flex-col gap-2 text-center md:text-left">
                <h4 className="font-headline text-xl font-bold text-primary">
                  Manya Katakol
                </h4>
                <div className="mx-auto inline-block w-max rounded-full border border-primary-container/20 bg-primary-container/10 px-3 py-1 md:mx-0">
                  <span className="font-label text-sm text-primary-container">
                    Frontend / UI
                  </span>
                </div>
                <p className="mt-2 font-body text-on-surface-variant">
                  CS undergrad; builds innovative tech; explores IoT,
                  cybersecurity, blockchain, AI, software.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto w-full border-t border-outline-variant/10 bg-surface-container-lowest py-12">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between px-4 md:flex-row md:px-12">
          <div className="mb-6 font-headline text-2xl font-bold text-primary md:mb-0">
            CodeIT
          </div>
          <div className="flex gap-6">
            <Link
              className="font-label text-sm text-on-surface-variant opacity-80 transition-colors hover:text-primary hover:opacity-100"
              to="/privacy"
            >
              Privacy Policy
            </Link>
            <Link
              className="font-label text-sm text-on-surface-variant opacity-80 transition-colors hover:text-primary hover:opacity-100"
              to="/terms"
            >
              Terms of Service
            </Link>
            <Link
              className="font-label text-sm text-on-surface-variant opacity-80 transition-colors hover:text-primary hover:opacity-100"
              to="/help"
            >
              Help
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
