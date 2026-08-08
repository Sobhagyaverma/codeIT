import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-background text-on-surface">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-1/2 top-1/3 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <main className="relative z-10 flex flex-grow items-center justify-center px-4 py-24 md:px-12">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
          <div className="glass-panel group relative w-full overflow-hidden rounded-xl p-8 md:p-16">
            <div className="pointer-events-none absolute inset-2 rounded-xl border border-primary/10 transition-colors duration-500 group-hover:border-primary/30" />
            <div className="relative z-10 space-y-8">
              <div
                className="glitch-text mb-4 font-['Sora'] text-[120px] font-extrabold leading-none tracking-tighter text-white md:text-[180px]"
                data-text="404"
              >
                404
              </div>
              <div className="relative mx-auto h-32 w-full max-w-2xl overflow-hidden rounded-lg border border-outline-variant/30 opacity-50 mix-blend-screen md:h-48">
                <img
                  alt=""
                  className="size-full object-cover opacity-80 grayscale sepia"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHor0HOxM0kk74GJPZjJNEJaJI8Adm8PU6o1fdzlqnIsHYo3Zk1euH2kv99jWX1Zcx7Q9HiBiQQnHID7dAJWIC4XjvpzQ0BGmnx20hpNedBca-6U8ZAykzSVKhWAqqmBMn_xOdns2yq83JH9f3X8JA-JGM4vD1FnEtuNzTOzmQvMiVfnOxGrts-U0t08YXZls3Vp1nBX8p-A39F58ostbuTmmvgxbiKQgC86N1GOCaaoft5smyqohcIE0AspCG15EfRA"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
              </div>
              <div className="mx-auto mt-8 max-w-2xl space-y-4">
                <h1 className="font-headline text-3xl font-bold tracking-tight text-primary">
                  Signal Lost
                </h1>
                <p className="font-body text-lg text-on-surface-variant">
                  Not Found — This route doesn&apos;t exist — like submitting to
                  a problem that was never created.
                </p>
                <p className="mt-2 inline-block rounded border border-outline-variant/30 bg-surface-container/50 px-4 py-2 font-mono text-sm text-outline">
                  ERR_CODE: 0x404_ROUTE_UNDEFINED
                </p>
              </div>
              <div className="flex flex-col items-center justify-center gap-6 pt-8 md:flex-row">
                <Link
                  to="/"
                  className="neon-button group flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 font-label text-sm font-bold text-white md:w-auto"
                >
                  <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">
                    arrow_back
                  </span>
                  Back home
                </Link>
              </div>
              <div className="mx-auto mt-8 w-full max-w-lg border-t border-outline-variant/20 pt-12">
                <p className="mb-4 font-label text-sm text-outline">
                  RECOVER CONNECTION
                </p>
                <div className="flex flex-wrap justify-center gap-4 font-label text-sm">
                  <Link
                    className="flex items-center gap-2 rounded border border-transparent px-4 py-2 text-secondary transition-colors hover:border-secondary/30 hover:bg-secondary/10 hover:text-white"
                    to="/problems"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      code
                    </span>{" "}
                    Problems Catalog
                  </Link>
                  <Link
                    className="flex items-center gap-2 rounded border border-transparent px-4 py-2 text-secondary transition-colors hover:border-secondary/30 hover:bg-secondary/10 hover:text-white"
                    to="/dsa-sheet"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      list_alt
                    </span>{" "}
                    DSA Sheet
                  </Link>
                  <Link
                    className="flex items-center gap-2 rounded border border-transparent px-4 py-2 text-secondary transition-colors hover:border-secondary/30 hover:bg-secondary/10 hover:text-white"
                    to="/contact"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      support_agent
                    </span>{" "}
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 mt-auto w-full border-t border-outline-variant/10 bg-background/80 py-8 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-12">
          <div className="font-body text-sm text-outline">
            © {new Date().getFullYear()} CodeT. All systems operational.
          </div>
          <div className="flex gap-6 font-label text-sm text-on-surface-variant">
            <Link className="transition-colors hover:text-secondary" to="/privacy">
              Privacy
            </Link>
            <Link className="transition-colors hover:text-secondary" to="/terms">
              Terms
            </Link>
            <Link className="transition-colors hover:text-secondary" to="/help">
              Help
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
