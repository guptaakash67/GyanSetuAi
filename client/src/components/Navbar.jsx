import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MenuIcon, PanelLeftCloseIcon } from "./Icons";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { label: "Library", to: "/library" },
  { label: "My Journey", to: "/journey" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/");
  };

  return (
    <>
      <header className="border-b border-slate-200 bg-[#F7F8FA]">
        <div className="mx-auto flex max-w-8xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-700 text-sm font-semibold text-white">
              GS
            </span>
            <span className="text-lg font-semibold text-slate-900">
              GyanSetu
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-700 text-sm font-semibold text-white">
                  {user.initial}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/sign-in"
                className="rounded-full bg-indigo-900 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
              >
                Sign In
              </Link>
            )}
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
            <div className="flex items-center justify-end border-b border-slate-100 px-5 py-4">
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

            {/* Sign In / Sign Out at bottom */}
            <div className="mt-auto border-t border-slate-100 p-4">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-700 text-sm font-semibold text-white">
                      {user.initial}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-full border border-red-200 py-3 text-center text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full rounded-full bg-indigo-900 py-3 text-center text-sm font-medium text-white hover:bg-indigo-800"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
