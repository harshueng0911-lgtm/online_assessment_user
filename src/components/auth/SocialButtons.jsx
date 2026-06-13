import { Github } from "lucide-react";

export default function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button type="button" className="btn-outline">
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.2-5.5 4.2-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.8 14.6 3 12 3 6.9 3 2.8 7.1 2.8 12.2S6.9 21.4 12 21.4c6.9 0 9.5-4.9 9.5-7.4 0-.5-.1-.9-.1-1.2H12z" />
        </svg>
        Google
      </button>
      <button type="button" className="btn-outline">
        <Github className="h-4 w-4" />
        GitHub
      </button>
    </div>
  );
}
