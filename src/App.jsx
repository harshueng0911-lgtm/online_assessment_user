import { AnimatePresence } from "framer-motion";
import AppRoutes from "./routes/AppRoutes.jsx";

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <AppRoutes />
    </AnimatePresence>
  );
}
