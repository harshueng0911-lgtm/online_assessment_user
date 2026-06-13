export default function QuestionPalette({
  questions,
  current,
  answers,
  visited,
  marked,
  onJump,
}) {
  const stateOf = (i) => {
    const id = questions[i].id;
    if (answers[id] != null && marked[id]) return "answered-marked";
    if (answers[id] != null) return "answered";
    if (marked[id]) return "marked";
    if (visited[id]) return "visited";
    return "not-visited";
  };

  const styles = {
    answered: "bg-emerald-500 text-white",
    "answered-marked": "bg-purple-500 text-white",
    marked: "bg-amber-500 text-white",
    visited: "bg-rose-500 text-white",
    "not-visited":
      "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700",
  };

  return (
    <div>
      <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-3">
        Question Palette
      </h4>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, i) => {
          const s = stateOf(i);
          return (
            <button
              key={q.id}
              onClick={() => onJump(i)}
              className={
                "h-9 w-9 rounded-lg text-sm font-semibold transition hover:scale-105 " +
                styles[s] +
                (i === current ? " ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-slate-950" : "")
              }
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <ul className="mt-6 space-y-2 text-xs">
        {[
          ["bg-emerald-500", "Answered"],
          ["bg-rose-500", "Not Answered"],
          ["bg-amber-500", "Marked for Review"],
          ["bg-purple-500", "Answered & Marked"],
          ["bg-white border border-slate-300 dark:bg-slate-800 dark:border-slate-700", "Not Visited"],
        ].map(([cls, lbl]) => (
          <li key={lbl} className="flex items-center gap-2">
            <span className={"inline-block h-4 w-4 rounded " + cls} />
            <span className="text-slate-600 dark:text-slate-300">{lbl}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
