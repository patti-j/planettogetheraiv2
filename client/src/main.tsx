import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("main.tsx: Script loaded!");
console.log("main.tsx: Document ready state:", document.readyState);

// Wait for DOM to be ready
if (document.readyState === "loading") {
  console.log("main.tsx: Waiting for DOM content...");
  document.addEventListener("DOMContentLoaded", () => {
    console.log("main.tsx: DOM content loaded!");
    mountApp();
  });
} else {
  console.log("main.tsx: DOM already ready!");
  mountApp();
}

function mountApp() {
  console.log("main.tsx: Starting React app mount...");
  const rootElement = document.getElementById("root");
  console.log("main.tsx: Root element found:", rootElement);

  if (rootElement) {
    console.log("main.tsx: Creating React root...");
    try {
      const root = createRoot(rootElement);
      console.log("main.tsx: Rendering App component...");
      root.render(<App />);
      console.log("main.tsx: App component rendered successfully!");
    } catch (error) {
      console.error("main.tsx: Error mounting React app:", error);
    }
  } else {
    console.error("main.tsx: Root element not found!");
    // Try again after a short delay
    setTimeout(() => {
      console.log("main.tsx: Retrying mount after delay...");
      const retryElement = document.getElementById("root");
      if (retryElement) {
        const root = createRoot(retryElement);
        root.render(<App />);
        console.log("main.tsx: App mounted on retry!");
      } else {
        console.error("main.tsx: Root element still not found after retry!");
      }
    }, 100);
  }
}
