export default function Loader({ label = "Loading..." }) {
  return (
    <div className="grid place-items-center py-12 text-slate-500">
      <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-brand-500 animate-spin" />
      <p className="mt-3 text-sm">{label}</p>
    </div>
  );
}
