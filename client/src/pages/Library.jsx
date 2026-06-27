import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackBar from "../components/BackBar";
import { SearchIcon, BookOpenIcon } from "../components/Icons";
import { useFetch } from "../hooks/useFetch";
import { libraryApi } from "../lib/api";

// Gradient + emoji per tradition as a visual fallback when the backend
// doesn't supply icon/color (keeps the grid lively even with plain data).
const TRADITION_STYLES = {
  hindu: { gradient: "from-orange-500 to-red-500", emoji: "🕉️" },
  taoism: { gradient: "from-emerald-500 to-teal-500", emoji: "☯️" },
  buddhism: { gradient: "from-amber-400 to-yellow-500", emoji: "🔔" },
  christian: { gradient: "from-blue-500 to-indigo-500", emoji: "📖" },
  islamic: { gradient: "from-emerald-500 to-green-600", emoji: "☪️" },
  teshu: { gradient: "from-sky-400 to-indigo-500", emoji: "🌿" },
  default: { gradient: "from-violet-500 to-fuchsia-500", emoji: "✨" },
};

const HOW_TO_STEPS = [
  { step: 1, title: "Browse Collections", description: "Explore different spiritual traditions and their teachings." },
  { step: 2, title: "Read & Reflect", description: "Take time to read passages and reflect on their meaning." },
  { step: 3, title: "Bookmark & Share", description: "Save your favorite passages and share them with others." },
];

export default function Library() {
  const { slug } = useParams();

  // /library -> grid of all traditions
  // /library/:slug -> texts list for one tradition (e.g. /library/hindu)
  return slug ? <TraditionTexts slug={slug} /> : <TraditionGrid />;
}

// ---- /library ----------------------------------------------------------

function TraditionGrid() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const { data: traditions, loading } = useFetch(() => libraryApi.getTraditions(), []);
  const { data: stats } = useFetch(() => libraryApi.getStats(), []);

  const filtered = useMemo(() => {
    if (!traditions) return [];
    if (!query.trim()) return traditions;
    const q = query.toLowerCase();
    return traditions.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.tradition?.toLowerCase().includes(q) ||
        t.tagline?.toLowerCase().includes(q)
    );
  }, [traditions, query]);

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <BackBar />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-4xl font-extrabold text-slate-900">Scripture Library</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Explore the world's most profound spiritual traditions. Select any scripture to chat
          and ask your doubts.
        </p>

        {/* Search */}
        <div className="mt-6 flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <SearchIcon className="h-5 w-5 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search traditions, books…"
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Tradition cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-white" />
            ))}

          {!loading &&
            filtered.map((t) => {
              const style = TRADITION_STYLES[t.tradition?.toLowerCase()] || TRADITION_STYLES.default;
              return (
                <div
                  key={t.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div
                    className={`relative flex h-28 items-start justify-end bg-gradient-to-br p-4 ${style.gradient}`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-lg backdrop-blur-sm">
                      {style.emoji}
                    </span>
                  </div>

                  <div className="p-5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                      {t.tradition}
                    </span>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">{t.name}</h3>
                    <p className="mt-1.5 text-sm text-slate-500">{t.tagline}</p>

                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                      <BookOpenIcon className="h-3.5 w-3.5" />
                      {t.textCount} texts
                    </div>

                    <button
                      onClick={() => navigate(`/library/${t.slug || t.id}`)}
                      className="mt-4 w-full rounded-full border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-300"
                    >
                      View Texts
                    </button>
                  </div>
                </div>
              );
            })}

          {!loading && filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
              No traditions match "{query}".
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="mt-12 grid grid-cols-1 gap-8 border-y border-slate-200 py-10 text-center sm:grid-cols-3">
          <LibraryStat icon={BookOpenIcon} value={stats?.sacredTexts ?? "—"} label="Sacred Texts" />
          <LibraryStat icon={BookOpenIcon} value={stats?.traditions ?? "—"} label="Wisdom Traditions" />
          <LibraryStat
            icon={BookOpenIcon}
            value={stats?.yearsOfWisdom ? `${stats.yearsOfWisdom}+` : "—"}
            label="Years of Wisdom"
          />
        </div>

        {/* How to use */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900">How to Use the Library</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {HOW_TO_STEPS.map((s) => (
              <div key={s.step} className="rounded-2xl border border-slate-200 bg-white p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-sm font-semibold text-indigo-700">
                  {s.step}
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LibraryStat({ icon: Icon, value, label }) {
  return (
    <div>
      <Icon className="mx-auto h-6 w-6 text-indigo-600" />
      <div className="mt-2 text-2xl font-extrabold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}

// ---- /library/:slug -----------------------------------------------------

function TraditionTexts({ slug }) {
  const navigate = useNavigate();

  const { data: tradition, loading: traditionLoading } = useFetch(
    () => libraryApi.getTraditionBySlug(slug),
    [slug]
  );
  const { data: texts, loading: textsLoading } = useFetch(
    () => libraryApi.getTraditionTexts(slug),
    [slug]
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <BackBar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        {traditionLoading ? (
          <div className="space-y-3">
            <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
            <div className="h-10 w-64 animate-pulse rounded bg-slate-200" />
          </div>
        ) : (
          <>
            <span className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
              {tradition?.name || slug}
            </span>
            <h1 className="mt-1 text-4xl font-extrabold text-slate-900">
              {tradition?.name || "Tradition"} Texts
            </h1>
            {tradition?.tagline && (
              <p className="mt-2 max-w-2xl text-sm text-slate-500">{tradition.tagline}</p>
            )}
          </>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {textsLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />
            ))}

          {!textsLoading &&
            texts?.map((text) => (
              <button
                key={text.id}
                onClick={() => navigate(`/scripture/${text.id}`)}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <BookOpenIcon className="h-4 w-4" />
                </span>
                <h3 className="mt-3 text-base font-semibold text-slate-900">{text.title}</h3>
                {text.description && (
                  <p className="mt-1 text-sm text-slate-500">{text.description}</p>
                )}
              </button>
            ))}

          {!textsLoading && (!texts || texts.length === 0) && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
              No texts found for this tradition yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}