import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Comprehensive error suppression for Bryntum Scheduler
if (typeof window !== 'undefined') {
  // Enhanced ResizeObserver error suppression
  const isResizeObserverError = (message: any): boolean => {
    if (typeof message === 'string') {
      const lowerCase = message.toLowerCase();
      return lowerCase.includes('resizeobserver') ||
             lowerCase.includes('resize observer') ||
             lowerCase.includes('undelivered notifications') ||
             lowerCase.includes('loop completed') ||
             lowerCase.includes('loop limit');
    }
    if (message && typeof message === 'object') {
      // Check both message property and direct object properties
      if (message.message && typeof message.message === 'string') {
        return isResizeObserverError(message.message);
      }
      // Check if it's an error object with type property
      if (message.type === 'error' && message.message && 
          typeof message.message === 'string') {
        const lowerCase = message.message.toLowerCase();
        if (lowerCase.includes('resizeobserver') || 
            lowerCase.includes('undelivered notifications')) {
          return true;
        }
      }
      // Check error property
      if (message.error) {
        return isResizeObserverError(message.error);
      }
    }
    return false;
  };

  // Handle error events
  const resizeObserverErrorHandler = (e: ErrorEvent) => {
    if (isResizeObserverError(e.message) || isResizeObserverError(e.error) || isResizeObserverError(e)) {
      e.stopImmediatePropagation();
      e.preventDefault();
      e.stopPropagation();
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
    // Check all arguments for ResizeObserver errors
    for (const arg of args) {
      if (isResizeObserverError(arg)) {
        return; // Suppress ResizeObserver errors
      }
      // Also check if it's a JSON stringified error
      if (typeof arg === 'string') {
        try {
          const parsed = JSON.parse(arg);
          if (isResizeObserverError(parsed)) {
            return;
          }
        } catch {}
      }
      // Check for object with message property
      if (arg && typeof arg === 'object' && 'message' in arg) {
        if (typeof arg.message === 'string' && 
            (arg.message.includes('ResizeObserver') || 
             arg.message.includes('undelivered notifications'))) {
          return;
        }
      }
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
  
  // Add multiple event listeners for comprehensive coverage
  window.addEventListener('error', resizeObserverErrorHandler, true);
  window.addEventListener('unhandledrejection', unhandledRejectionHandler, true);
  
  // Also intercept at the capture phase
  document.addEventListener('error', resizeObserverErrorHandler, true);
  
  // Override window.onerror as a fallback
  const originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    if (isResizeObserverError(message) || isResizeObserverError(error)) {
      return true; // Prevent default error handling
    }
    if (originalOnError) {
      return originalOnError.apply(window, arguments as any);
    }
    return false;
  };
  
  // Also override the global error handler for objects
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('error', (e: any) => {
      if (e && e.message && isResizeObserverError(e.message)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
