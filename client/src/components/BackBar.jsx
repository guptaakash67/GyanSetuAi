import { useNavigate } from "react-router-dom";

export default function BackBar({ user }) {
  const navigate = useNavigate();

  return (
    <header className="border-b border-slate-200 bg-[#F7F8FA]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-slate-700"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-700 text-sm font-semibold text-white">
          {user?.initial || "P"}
        </span>
      </div>
    </header>
  );
}