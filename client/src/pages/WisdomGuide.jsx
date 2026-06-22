import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BackBar from "../components/BackBar";
import { SearchIcon, SparklesIcon } from "../components/Icons";
import { wisdomApi } from "../lib/api";

const TOPICS = [
  "Relationships",
  "Work & Career",
  "Anxiety & Fear",
  "Purpose & Meaning",
  "Loss & Grief",
  "Personal Growth",
  "Confidence & Self-Worth",
  "Decision Making",
];

export default function WisdomGuide() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runSearch = async (text) => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await wisdomApi.search(text.trim());
      const results = res.data;
      // If the backend returns a single best match, jump straight to it.
      if (results?.[0]?.id) {
        navigate(`/scripture/${results[0].id}`, { state: { results } });
      } else {
        navigate(`/library?q=${encodeURIComponent(text.trim())}`);
      }
    } catch (err) {
      setError("Couldn't find guidance right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <BackBar />

      <section className="mx-auto max-w-2xl px-6 pt-16 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700">
          <SparklesIcon className="h-4 w-4" />
          Wisdom Guide
        </span>

        <h1 className="mt-6 text-4xl font-extrabold text-slate-900">Ask for Guidance</h1>

        <p className="mx-auto mt-4 max-w-lg text-sm text-slate-500">
          Describe your challenge or question. We'll find the most relevant scriptures and
          spiritual wisdom to guide you.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query);
          }}
          className="mt-8"
        >
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
            <SearchIcon className="h-5 w-5 shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What challenge are you facing? (e.g., struggling with relationships, work stress, finding purpose…)"
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-indigo-900 py-3.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
          >
            {loading ? "Searching…" : "Find Relevant Wisdom"}
          </button>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </form>

        <div className="mt-10 text-left">
          <p className="text-sm text-slate-500">Or explore common topics:</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => {
                  setQuery(topic);
                  runSearch(topic);
                }}
                className="rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-medium text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/50"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}