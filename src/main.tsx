import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ConfigErrorScreen } from "./components/layout/ConfigErrorScreen";
import { ConfigError, loadBrowserConfig } from "./lib/config";

const root = createRoot(document.getElementById("root")!);

try {
  loadBrowserConfig(import.meta.env);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (error) {
  if (!(error instanceof ConfigError)) {
    throw error;
  }
  root.render(<ConfigErrorScreen problems={error.problems} />);
}
