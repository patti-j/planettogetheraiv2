import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/bryntum-theme.css";

// Suppress ResizeObserver errors from Bryntum Scheduler components
if (typeof window !== 'undefined') {
  // Handle error events
  const resizeObserverErrorHandler = (e: ErrorEvent) => {
    if (e.message && (
        e.message.includes('ResizeObserver loop completed') ||
        e.message.includes('ResizeObserver loop limit exceeded') ||
        e.message === 'ResizeObserver loop completed with undelivered notifications.'
    )) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    }
  };
  
  // Also catch unhandled promise rejections for ResizeObserver
  const unhandledRejectionHandler = (e: PromiseRejectionEvent) => {
    if (e.reason && e.reason.message && (
        e.reason.message.includes('ResizeObserver loop completed') ||
        e.reason.message.includes('ResizeObserver loop limit exceeded')
    )) {
      e.preventDefault();
      return false;
    }
  };
  
  // Override console.error for ResizeObserver messages
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const firstArg = args[0];
    if (firstArg && typeof firstArg === 'object' && firstArg.message) {
      if (firstArg.message.includes('ResizeObserver loop completed') ||
          firstArg.message.includes('ResizeObserver loop limit exceeded')) {
        return; // Suppress the error
      }
    }
    // Check for string messages too
    if (typeof firstArg === 'string' && (
        firstArg.includes('ResizeObserver loop completed') ||
        firstArg.includes('ResizeObserver loop limit exceeded')
    )) {
      return; // Suppress the error
    }
    originalConsoleError.apply(console, args);
  };
  
  window.addEventListener('error', resizeObserverErrorHandler, true);
  window.addEventListener('unhandledrejection', unhandledRejectionHandler, true);
}

createRoot(document.getElementById("root")!).render(<App />);
