import { createRoot } from "react-dom/client";
import App from "./App";
import TestApp from "./App.test";
import "./index.css";

// Try test app first to isolate the issue
createRoot(document.getElementById("root")!).render(<TestApp />);
