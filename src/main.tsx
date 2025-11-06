import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./providers/AuthProvider";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { LanguageProvider } from "./contexts/LanguageContext";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <SubscriptionProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </SubscriptionProvider>
  </AuthProvider>
);
