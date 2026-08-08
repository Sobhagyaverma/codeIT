import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import AppNav from "./AppNav";
import BrandMark from "./BrandMark";

const LINKS = [
  { to: "/privacy", label: "Privacy", short: "Privacy" },
  { to: "/terms", label: "Terms of Service", short: "Terms" },
  { to: "/help", label: "Help & Support", short: "Help" },
] as const;

export type LegalPage = "privacy" | "terms" | "help";

export default function LegalShell({
  active,
  children,
}: {
  active: LegalPage;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background text-on-surface">
      <AppNav />
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[10%] top-[10%] h-[40%] w-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -right-[5%] bottom-[5%] h-[35%] w-[35%] rounded-full bg-secondary/10 blur-[100px]" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-grow flex-col gap-8 px-4 pb-24 pt-[100px] md:flex-row md:gap-12 md:px-12 lg:gap-16">
        <aside className="w-full flex-shrink-0 md:w-64">
          <div className="glass-panel sticky top-[120px] rounded-xl p-4">
            <h3 className="mb-4 px-2 font-label text-xs font-bold tracking-widest text-primary uppercase">
              Legal & Support
            </h3>
            <nav className="flex flex-col gap-1">
              {LINKS.map((link) => {
                const isActive =
                  (active === "privacy" && link.to === "/privacy") ||
                  (active === "terms" && link.to === "/terms") ||
                  (active === "help" && link.to === "/help");
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center justify-between rounded-lg px-4 py-3 font-label text-sm transition-all ${
                      isActive
                        ? "border-l-2 border-primary bg-primary-container/10 text-primary"
                        : "border-l-2 border-transparent text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface"
                    }`}
                  >
                    <span>{link.label}</span>
                    <span
                      className={`material-symbols-outlined text-[18px] transition-opacity ${
                        isActive ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      chevron_right
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <div className="min-w-0 flex-grow">{children}</div>
      </main>

      <footer className="relative z-10 mt-auto flex w-full flex-col items-center justify-between gap-4 border-t border-outline-variant/20 bg-surface-container-lowest px-4 py-8 md:flex-row md:px-12">
        <div className="font-headline text-xl font-bold text-primary opacity-80 transition-opacity hover:opacity-100">
          <BrandMark />
        </div>
        <div className="font-body text-sm text-on-surface-variant">
          © {new Date().getFullYear()} CodeT. Engineering Excellence.
        </div>
        <div className="flex items-center gap-6">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`font-label text-sm transition-colors hover:text-tertiary-fixed ${
                (active === "privacy" && link.to === "/privacy") ||
                (active === "terms" && link.to === "/terms") ||
                (active === "help" && link.to === "/help")
                  ? "font-bold text-primary"
                  : "text-on-surface-variant opacity-80 hover:opacity-100"
              }`}
            >
              {link.short}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
