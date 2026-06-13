export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 py-6 px-6 text-center text-sm text-slate-500">
      © {new Date().getFullYear()} Assesso. Premium online assessment platform.
    </footer>
  );
}
