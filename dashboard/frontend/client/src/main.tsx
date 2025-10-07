import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Create root and render the app
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
