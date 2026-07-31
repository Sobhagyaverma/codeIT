import { Link, useLocation } from "react-router-dom";

/** Placeholder until the matching Stitch screen is pasted. */
export default function ComingSoon() {
  const { pathname } = useLocation();

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="font-code-sm text-sm tracking-wide text-[#a855f7] uppercase">
        Screen not added yet
      </p>
      <h1 className="font-headline-lg mt-3 text-2xl font-semibold text-white">
        {pathname}
      </h1>
      <p className="mt-3 text-sm text-white/50">
        Paste the next Stitch screen for this route and it will land here.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          to="/"
          className="rounded-full bg-[#a855f7] px-6 py-2.5 text-sm font-semibold text-white"
        >
          Back home
        </Link>
        <Link
          to="/screens"
          className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold text-white"
        >
          Screen catalog
        </Link>
      </div>
    </main>
  );
}
