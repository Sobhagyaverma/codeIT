import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRegistration } from "../context/RegistrationContext";

const STORAGE_KEY = "codeit.privateBeta.bannerDismissed";

/** Dismissible post-login thank-you banner for Private Beta. */
export default function PrivateBetaBanner() {
  const { user } = useAuth();
  const { config } = useRegistration();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user || !config.privateBeta) {
      setVisible(false);
      return;
    }
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, [user, config.privateBeta]);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 top-16 z-40 border-b border-primary/30 bg-primary/15 px-4 py-2.5 text-center backdrop-blur-md">
      <p className="font-body-sm inline pr-8 text-sm text-on-surface">
        Thank you for participating in the CodeIT Private Beta.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-on-surface-variant hover:text-on-surface"
        aria-label="Dismiss banner"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}
