import { FileX } from "lucide-react";

export default function EmptyState({
  title = "Nothing here yet",
  description = "There's no data to display.",
  action,
}) {
  return (
    <div className="card-elev p-12 grid place-items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 grid place-items-center mb-4">
        <FileX className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
