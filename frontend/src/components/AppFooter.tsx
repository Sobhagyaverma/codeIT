import { Link } from "react-router-dom";
import BrandMark from "./BrandMark";

const PLATFORM = [
  { to: "/problems", label: "Problems" },
  { to: "/dsa-sheet", label: "DSA Sheet" },
  { to: "/competitions", label: "Competitions" },
  { to: "/competitions/quick", label: "Quick Clash" },
  { to: "/coderoom", label: "CodeRoom" },
] as const;

const RESOURCES = [
  { to: "/friends", label: "Friends" },
  { to: "/problems", label: "AI Coach" },
  { to: "/competitions", label: "Leaderboard" },
  { to: "/about", label: "Blog" },
] as const;

const COMPANY = [
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms of Service" },
] as const;

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { to: string; label: string }[];
}) {
  return (
    <div>
      <h5 className="mb-4 text-[14px] font-semibold text-white">{title}</h5>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            <Link
              to={link.to}
              className="text-[13px] text-white/50 transition-colors hover:text-[#a855f7]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Marketing footer from Stitch landing — shared for home (and reusable elsewhere). */
export default function AppFooter() {
  return (
    <footer className="relative z-10 w-full border-t border-white/5 bg-[#050508] pt-16 pb-8">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <span className="font-headline-lg mb-4 block text-xl font-bold tracking-wide text-[#a855f7]">
              <BrandMark />
            </span>
            <p className="mb-6 max-w-xs text-[13px] text-white/40">
              Connect and build on the advanced collaborative IDE platform.
              Redefining competitive programming.
            </p>
            <div className="flex gap-4">
              <Link
                to="/contact"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/50 transition-colors hover:bg-[#a855f7]/20 hover:text-[#a855f7]"
                aria-label="Contact"
              >
                <span className="material-symbols-outlined text-[20px]">
                  public
                </span>
              </Link>
              <Link
                to="/contact"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/50 transition-colors hover:bg-[#a855f7]/20 hover:text-[#a855f7]"
                aria-label="Email"
              >
                <span className="material-symbols-outlined text-[20px]">
                  mail
                </span>
              </Link>
            </div>
          </div>
          <FooterColumn title="Platform" links={PLATFORM} />
          <FooterColumn title="Resources" links={RESOURCES} />
          <FooterColumn title="Company" links={COMPANY} />
        </div>
        <div className="flex flex-col items-center justify-between border-t border-white/5 pt-8 md:flex-row">
          <span className="font-body-sm text-[12px] text-white/40">
            © {new Date().getFullYear()} CodeT Platform. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
