import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./components/bryntum/bryntum-styles.css";
import "./styles/bryntum-theme.css";

createRoot(document.getElementById("root")!).render(<App />);
