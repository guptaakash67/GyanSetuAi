import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-[#F7F8FA]">
      <div className="mx-auto flex max-w-1xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-700 text-sm font-semibold text-white">
            GS
          </span>
          <span className="text-lg font-semibold text-slate-900">GyanSetu</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm text-slate-600">
          <Link to="/library" className="hover:text-slate-900">
            Library
          </Link>
          <Link to="/journey" className="hover:text-slate-900">
            My Journey
          </Link>
          <Link
            to="/sign-in"
            className="rounded-full bg-indigo-900 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
          >
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  );
}