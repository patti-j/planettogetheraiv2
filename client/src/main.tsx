import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/bryntum-theme.css";

// Suppress ResizeObserver errors from Bryntum Scheduler components
if (typeof window !== 'undefined') {
  const resizeObserverErrorHandler = (e: ErrorEvent) => {
    if (e.message === 'ResizeObserver loop completed with undelivered notifications.' ||
        e.message === 'ResizeObserver loop limit exceeded') {
      e.stopImmediatePropagation();
      e.preventDefault();
      return;
    }
  };
  window.addEventListener('error', resizeObserverErrorHandler);
}

createRoot(document.getElementById("root")!).render(<App />);
