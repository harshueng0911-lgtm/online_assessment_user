export default function AnalyticsCard({ icon: Icon, label, value, hint, accent = "brand" }) {
  const colors = {
    brand: "from-brand-500 to-brand-700",
    emerald: "from-emerald-500 to-emerald-700",
    amber: "from-amber-500 to-amber-700",
    rose: "from-rose-500 to-rose-700",
  };
  return (
    <div className="card-elev rounded-2xl p-5 relative overflow-hidden group hover:shadow-lg transition-shadow">
      <div
        className={
          "absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-10 bg-gradient-to-br " +
          colors[accent]
        }
      />
      <div className="flex items-center gap-3">
        <div
          className={
            "w-10 h-10 rounded-xl grid place-items-center text-white bg-gradient-to-br " +
            colors[accent]
          }
        >
          {Icon && <Icon className="h-5 w-5" />}
        </div>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-display font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
