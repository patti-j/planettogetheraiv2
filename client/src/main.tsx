import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/bryntum-theme.css";

// Comprehensive error suppression for Bryntum Scheduler
if (typeof window !== 'undefined') {
  // Enhanced ResizeObserver error suppression
  const isResizeObserverError = (message: any): boolean => {
    if (typeof message === 'string') {
      return message.includes('ResizeObserver') ||
             message.includes('ResizeObserver loop completed') ||
             message.includes('ResizeObserver loop limit exceeded') ||
             message.includes('undelivered notifications');
    }
    if (message && typeof message === 'object' && message.message) {
      return isResizeObserverError(message.message);
    }
    return false;
  };

  // Handle error events
  const resizeObserverErrorHandler = (e: ErrorEvent) => {
    if (isResizeObserverError(e.message) || isResizeObserverError(e.error)) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    }
  };
  
  // Handle promise rejections
  const unhandledRejectionHandler = (e: PromiseRejectionEvent) => {
    if (isResizeObserverError(e.reason)) {
      e.preventDefault();
      return false;
    }
  };
  
  // Override console methods to suppress ResizeObserver messages
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  
  console.error = (...args: any[]) => {
    if (args.some(arg => isResizeObserverError(arg))) {
      return; // Suppress ResizeObserver errors
    }
    // Suppress DOM nesting warnings from tooltips and buttons
    const firstArg = args[0];
    if (typeof firstArg === 'string' && (
        firstArg.includes('validateDOMNesting') ||
        firstArg.includes('cannot appear as a descendant')
    )) {
      return; // Suppress DOM nesting warnings
    }
    originalConsoleError.apply(console, args);
  };
  
  console.warn = (...args: any[]) => {
    if (args.some(arg => isResizeObserverError(arg))) {
      return; // Suppress ResizeObserver warnings
    }
    // Suppress DOM nesting warnings
    const firstArg = args[0];
    if (typeof firstArg === 'string' && (
        firstArg.includes('validateDOMNesting') ||
        firstArg.includes('cannot appear as a descendant')
    )) {
      return; // Suppress DOM nesting warnings
    }
    originalConsoleWarn.apply(console, args);
  };
  
  console.log = (...args: any[]) => {
    if (args.some(arg => isResizeObserverError(arg))) {
      return; // Suppress ResizeObserver logs
    }
    originalConsoleLog.apply(console, args);
  };
  
  // Catch any ResizeObserver constructor errors
  const originalResizeObserver = window.ResizeObserver;
  window.ResizeObserver = class extends originalResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      super((entries, observer) => {
        try {
          callback(entries, observer);
        } catch (error) {
          // Silently ignore ResizeObserver callback errors
          if (!isResizeObserverError(error)) {
            throw error; // Re-throw if not a ResizeObserver error
          }
        }
      });
    }
  };
  
  window.addEventListener('error', resizeObserverErrorHandler, true);
  window.addEventListener('unhandledrejection', unhandledRejectionHandler, true);
}

createRoot(document.getElementById("root")!).render(<App />);
