import { createRoot } from "react-dom/client";

// Absolute minimal test - no CSS, no external dependencies
function MinimalTest() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Minimal React Test</h1>
      <p>If you see this, React is working!</p>
      <p>Date: {new Date().toLocaleString()}</p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<MinimalTest />);
