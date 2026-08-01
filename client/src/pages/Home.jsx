import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { SearchIcon, BoltIcon, BookOpenIcon, CompassIcon } from "../components/Icons";
import { useFetch } from "../hooks/useFetch";
import { libraryApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const TOPIC_CHIPS = ["Relationships", "Personal Growth", "Finding Purpose"];

const FEATURE_CARDS = [
  {
    icon: BoltIcon,
    title: "Wisdom Guide",
    description: "Get personalized spiritual guidance based on your specific challenges and questions.",
    to: "/wisdom-guide",
  },
  {
    icon: BookOpenIcon,
    title: "Scripture Library",
    description: "Browse our comprehensive collection of spiritual texts and ancient wisdom.",
    to: "/library",
  },
  {
    icon: CompassIcon,
    title: "My Journey",
    description: "Track your spiritual growth and revisit your most meaningful insights.",
    to: "/journey",
  },
];

const FOOTER_COLUMNS = [
  { title: "Product", links: ["Wisdom Guide", "Library", "My Journey"] },
  { title: "Resources", links: ["Blog", "Guides", "FAQ"] },
  { title: "Community", links: ["Discord", "Forum", "Events"] },
  { title: "Legal", links: ["Privacy", "Terms", "Contact"] },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  // Stats are backend-driven so the numbers stay accurate as the library grows.
  const { data: stats } = useFetch(() => libraryApi.getStats(), []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/wisdom-guide?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-16 text-center">
        <span className="inline-block rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700">
          Welcome to Wisdom
        </span>

        <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-slate-900">
          Ancient Wisdom for Modern Life
        </h1>

        <p className="mx-auto mt-5 max-w-5xl text-base text-slate-500">
          Discover spiritual guidance tailored to your unique challenges. Find clarity through
          timeless wisdom.
        </p>

        <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-xl">
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-sm">
            <SearchIcon className="h-5 w-5 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask for guidance on life, relationships, growth…"
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
        </form>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {TOPIC_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => navigate(`/wisdom-guide?topic=${encodeURIComponent(chip)}`)}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-600 hover:border-slate-300 hover:text-slate-900"
            >
              {chip}
            </button>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w20xl px-5 py-20 text-center sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:gap-8">
          {FEATURE_CARDS.map(({ icon: Icon, title, description, to }) => (
            <button
              key={title}
              onClick={() => navigate(to)}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Stats band */}
      <section className="mt-20 bg-slate-100/80 py-14">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-10 px-6 text-center sm:grid-cols-3">
          <Stat value={stats?.sacredTexts ? `${stats.sacredTexts}+` : "2,500+"} label="Sacred Texts" tone="text-indigo-900" />
          <Stat value={stats?.traditions ? `${stats.traditions}+` : "15+"} label="Wisdom Traditions" tone="text-indigo-700" />
          <Stat value={stats?.seekersConnected ? `${stats.seekersConnected}+` : "10K+"} label="Seekers Connected" tone="text-blue-500" />
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-slate-900">Begin Your Spiritual Journey Today</h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-slate-500">
          Create an account to save insights, track your progress, and personalize your
          experience.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => navigate(user ? "/wisdom-guide" : "/sign-up")}
            className="rounded-full bg-indigo-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-800"
          >
            Get Started
          </button>
          <button
            onClick={() => navigate("/library")}
            className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-300"
          >
            Explore Library
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-0xl px-6 py-12">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-slate-900">{col.title}</h4>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-slate-500 hover:text-slate-800">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 text-sm text-slate-500 sm:flex-row">
            <span>© {new Date().getFullYear()} GyanSetu. All rights reserved.</span>
            <div className="flex gap-5">
              <a href="#" className="hover:text-slate-800">Twitter</a>
              <a href="#" className="hover:text-slate-800">Instagram</a>
              <a href="#" className="hover:text-slate-800">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label, tone }) {
  return (
    <div>
      <div className={`text-4xl font-extrabold ${tone}`}>{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}