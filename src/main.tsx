import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import './i18n/config';
import { AuthProvider } from "./providers/AuthProvider";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { QueryProvider } from "./providers/QueryProvider";

createRoot(document.getElementById("root")!).render(
  <QueryProvider>
    <AuthProvider>
      <SubscriptionProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </QueryProvider>
);
