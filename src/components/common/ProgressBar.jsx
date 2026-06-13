export default function ProgressBar({ value = 0, className = "" }) {
  return (
    <div
      className={
        "w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden " +
        className
      }
    >
      <div
        className="h-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
