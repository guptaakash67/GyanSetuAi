import { useState } from "react";
import { Link } from "react-router-dom";
import { MenuIcon, PanelLeftCloseIcon } from "./Icons";

const NAV_LINKS = [
  { label: "Library", to: "/library" },
  { label: "My Journey", to: "/journey" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="border-b border-slate-200 bg-[#F7F8FA]">
        <div className="mx-auto flex max-w-8xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-700 text-sm font-semibold text-white">
              GS
            </span>
            <span className="text-lg font-semibold text-slate-900">GyanSetu</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} to={link.to} className="hover:text-slate-900">
                {link.label}
              </Link>
            ))}
            <Link
              to="/sign-in"
              className="rounded-full bg-indigo-900 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
            >
              Sign In
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />

          {/* Sidebar panel */}
          <div className="relative ml-auto flex h-full w-72 flex-col bg-white shadow-xl">
            {/* Sidebar header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2"
              >
                {/* <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-700 text-sm font-semibold text-white">
                  GS
                </span>
                <span className="text-base font-semibold text-slate-900">GyanSetu</span> */}
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <PanelLeftCloseIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Sidebar links */}
            <nav className="flex flex-col gap-1 p-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Sign In at bottom */}
            <div className="mt-auto border-t border-slate-100 p-4">
              <Link
                to="/sign-in"
                onClick={() => setMobileOpen(false)}
                className="block w-full rounded-full bg-indigo-900 py-3 text-center text-sm font-medium text-white hover:bg-indigo-800"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}