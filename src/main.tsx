import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { ConfigErrorScreen } from "./components/layout/ConfigErrorScreen";
import { AuthProvider } from "./features/auth";
import { ConfigError, loadBrowserConfig } from "./lib/config";
import { createQueryClient } from "./lib/queryClient";

const root = createRoot(document.getElementById("root")!);
const queryClient = createQueryClient();

try {
  const config = loadBrowserConfig(import.meta.env);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider config={config}>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
} catch (error) {
  if (!(error instanceof ConfigError)) {
    throw error;
  }
  root.render(<ConfigErrorScreen problems={error.problems} />);
}
