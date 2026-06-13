import { motion } from "framer-motion";

export default function QuestionCard({ index, question, value, onChange }) {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="card-elev p-6 sm:p-8"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          {question.section}
        </p>
        <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          Question {index + 1}
        </span>
      </div>
      <h2 className="mt-3 text-lg sm:text-xl font-semibold leading-relaxed">
        {question.text}
      </h2>

      <div className="mt-6 space-y-3">
        {question.options.map((opt, i) => {
          const active = value === i + 1;
          return (
            <label
              key={i}
              className={
                "flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition " +
                (active
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 shadow-sm"
                  : "border-slate-200 dark:border-slate-800 hover:border-brand-300 hover:bg-slate-50 dark:hover:bg-slate-800/50")
              }
            >
              <span
                className={
                  "w-5 h-5 rounded-full border grid place-items-center " +
                  (active
                    ? "border-brand-500 bg-brand-500"
                    : "border-slate-300 dark:border-slate-600")
                }
              >
                {active && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
              <span className="text-sm">{opt}</span>
              <input
                type="radio"
                className="sr-only"
                checked={active}
                onChange={() => onChange(i)}
              />
            </label>
          );
        })}
      </div>
    </motion.div>
  );
}
