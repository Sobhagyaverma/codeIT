import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext";
import { RegistrationProvider } from "./context/RegistrationContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RegistrationProvider>
        <App />
      </RegistrationProvider>
    </AuthProvider>
  </StrictMode>
);
