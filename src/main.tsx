import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize theme immediately to prevent flashing
const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
if (savedTheme === "light") {
  document.documentElement.classList.add("light");
} else {
  document.documentElement.classList.remove("light");
}

createRoot(document.getElementById("root")!).render(<App />);
