import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

document.documentElement.dataset.appBuild = "2026-05-25-1525";

createRoot(document.getElementById("root")!).render(<App />);
