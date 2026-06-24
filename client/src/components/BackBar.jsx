import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "./Icons";

export default function BackBar() {
  const navigate = useNavigate();

  // Read user from localStorage — set this after login:
  // localStorage.setItem("user", JSON.stringify({ name: "Akash", initial: "A" }))
  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;
  const initial = user?.initial || user?.name?.charAt(0).toUpperCase() || null;

  return (
    <header className="border-b border-slate-200 bg-[#F7F8FA]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-slate-700"
        >
          <ArrowLeftIcon className="h-[18px] w-[18px]" />
          Back
        </button>

        {initial && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-700 text-sm font-semibold text-white">
            {initial}
          </span>
        )}
      </div>
    </header>
  );
}