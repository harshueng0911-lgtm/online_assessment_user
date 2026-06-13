import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6">
      <div className="text-center">
        <p className="text-7xl font-display font-bold bg-gradient-to-br from-brand-500 to-brand-700 bg-clip-text text-transparent">
          404
        </p>
        <h1 className="mt-2 text-xl font-semibold">Page not found</h1>
        <p className="mt-1 text-slate-500">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/" className="btn-primary mt-6 inline-flex">
          Go home
        </Link>
      </div>
    </div>
  );
}
