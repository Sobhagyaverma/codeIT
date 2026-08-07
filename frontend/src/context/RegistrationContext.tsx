import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getRegistrationConfig, type RegistrationConfig } from "../lib/api";

type RegistrationState = {
  config: RegistrationConfig;
  loading: boolean;
};

const DEFAULT: RegistrationConfig = {
  mode: "INVITE_ONLY",
  requiresInvite: true,
  privateBeta: true,
  inviteTtlDays: 7,
};

const RegistrationContext = createContext<RegistrationState>({
  config: DEFAULT,
  loading: true,
});

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<RegistrationConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getRegistrationConfig()
      .then((c) => {
        if (!cancelled) setConfig(c);
      })
      .catch(() => {
        /* keep safe invite-only default */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ config, loading }), [config, loading]);
  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration() {
  return useContext(RegistrationContext);
}
