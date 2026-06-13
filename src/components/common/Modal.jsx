import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, footer }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-lg card-elev p-6"
            initial={{ y: 20, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.97, opacity: 0 }}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button onClick={onClose} className="btn-ghost p-1.5">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              {children}
            </div>
            {footer && (
              <div className="mt-6 flex justify-end gap-2">{footer}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
