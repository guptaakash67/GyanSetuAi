import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackBar from "../components/BackBar";
import { SearchIcon, BookOpenIcon } from "../components/Icons";
import { useFetch } from "../hooks/useFetch";
import { libraryApi } from "../lib/api";
import appContent from "../data/app-content.json";

const { traditionStyles: TRADITION_STYLES, howToSteps: HOW_TO_STEPS } = appContent.library;

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

  const collections = useMemo(() => {
    const grouped = new Map();
    for (const tradition of traditions || []) {
      const key = tradition.slug || tradition.id;
      const collection = grouped.get(key);
      if (collection) {
        collection.textTitles = [
          ...new Set([...collection.textTitles, ...(tradition.textTitles || [])]),
        ];
      } else {
        grouped.set(key, {
          ...tradition,
          textTitles: [...(tradition.textTitles || [])],
        });
      }
    }
    return [...grouped.values()];
  }, [traditions]);

  const filtered = useMemo(() => {
    if (!query.trim()) return collections;
    const q = query.toLowerCase();
    return collections.filter(
      (collection) =>
        collection.name.toLowerCase().includes(q) ||
        collection.tradition?.toLowerCase().includes(q) ||
        collection.tagline?.toLowerCase().includes(q) ||
        collection.textTitles.some((title) => title.toLowerCase().includes(q))
    );
  }, [collections, query]);

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <BackBar />

      <main className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8">
        <section className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#192b2a] via-[#223a36] to-[#493a2d] px-6 py-12 text-white shadow-xl shadow-slate-900/10 sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-20 -top-32 -z-10 h-96 w-96 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-8 -top-20 -z-10 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-48 right-24 -z-10 h-96 w-96 rounded-full bg-amber-300/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-100/20 bg-amber-100/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-200" />
              A bridge to timeless wisdom
            </span>
            <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
              Wisdom for real life
              <span className="block font-serif italic text-amber-200">and all its questions.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Facing a hard choice, looking for calm, or trying to understand yourself? Explore
              teachings from different traditions and reflect at your own pace.
            </p>

            <label className="mt-8 flex max-w-xl items-center gap-3 rounded-2xl border border-white/10 bg-white px-4 py-3.5 text-slate-400 shadow-lg shadow-black/10 transition focus-within:ring-4 focus-within:ring-amber-200/20 sm:px-5">
              <SearchIcon className="h-5 w-5 shrink-0" />
              <input
                aria-label="Search traditions and scriptures"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a tradition or text, like Bhagavad Gita…"
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <span className="hidden shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-500 sm:inline">
                Search
              </span>
            </label>
          </div>

          <div aria-hidden="true" className="absolute bottom-8 right-12 hidden h-36 w-36 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-amber-100 shadow-inner lg:flex">
            <span className="absolute inset-3 rounded-full border border-white/10" />
            <BookOpenIcon className="h-14 w-14" />
          </div>
        </section>

        <section className="relative z-10 -mt-5 mx-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-5 shadow-lg shadow-slate-900/5 sm:mx-8 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Looking for guidance on a life question?</p>
              <p className="mt-1 text-sm text-slate-500">The Wisdom Guide can help you explore it through scripture.</p>
            </div>
            <button
              onClick={() => navigate("/wisdom-guide?q=")}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#263d37] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1b2f2a] focus:outline-none focus:ring-4 focus:ring-emerald-100"
            >
              Ask the Wisdom Guide <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>

        <section className="mt-16">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">Explore the collection</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Find a teaching that speaks to you
              </h2>
            </div>
            {!loading && collections.length > 0 && (
              <span className="text-sm text-slate-500">
                {filtered.length} {filtered.length === 1 ? "collection" : "collections"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-3xl bg-white shadow-sm" />
              ))}

            {!loading &&
              filtered.map((collection) => {
                const style =
                  TRADITION_STYLES[collection.tradition?.toLowerCase()] ||
                  TRADITION_STYLES.default;
                return (
                  <article
                    key={collection.slug || collection.id}
                    className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-slate-900/10"
                  >
                    <div
                      className={`relative flex h-36 items-start justify-between overflow-hidden bg-gradient-to-br p-5 ${style.gradient}`}
                    >
                      <span className="rounded-full border border-white/25 bg-black/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                        {collection.tradition}
                      </span>
                      <span
                        aria-hidden="true"
                        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-white/15 text-2xl text-white shadow-sm backdrop-blur-sm"
                      >
                        {style.emoji}
                      </span>
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-16 -left-5 text-[10rem] leading-none text-white/10 transition duration-500 group-hover:rotate-6 group-hover:scale-110"
                      >
                        {style.emoji}
                      </span>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                        {collection.name}
                      </h3>
                      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                        {collection.tagline}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {collection.textTitles.slice(0, 3).map((title) => (
                          <span
                            key={title}
                            className="rounded-full bg-[#f5f4ef] px-3 py-1 text-xs font-medium text-slate-600"
                          >
                            {title}
                          </span>
                        ))}
                        {collection.textTitles.length > 3 && (
                          <span className="rounded-full bg-[#f5f4ef] px-3 py-1 text-xs font-medium text-slate-500">
                            +{collection.textTitles.length - 3} more
                          </span>
                        )}
                      </div>
                      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                        <BookOpenIcon className="h-4 w-4 text-emerald-800" />
                        {collection.textTitles.length} texts to explore
                      </p>
                      <button
                        onClick={() => navigate(`/library/${collection.slug || collection.id}`)}
                        className="mt-5 w-full rounded-xl bg-[#263d37] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1b2f2a] focus:outline-none focus:ring-4 focus:ring-emerald-100"
                      >
                        Explore this tradition
                      </button>
                    </div>
                  </article>
                );
              })}

            {!loading && filtered.length === 0 && (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                  <SearchIcon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">No collections found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try another search term{query ? ` instead of “${query}”` : ""}.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-20">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">A simple way to begin</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Bring your questions. Take what resonates.</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {HOW_TO_STEPS.map((s) => (
              <div key={s.step} className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 font-serif text-lg font-semibold text-orange-800">
                  {s.step}
                </span>
                <h3 className="mt-5 text-base font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-[#e7e1d5] bg-[#eeece3] px-6 py-8 text-center sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-900">Start with what matters to you</p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            You don’t need to know where to begin. Choose a collection that feels meaningful, or bring a personal question to the Wisdom Guide.
          </p>
          <button
            onClick={() => navigate("/wisdom-guide?q=")}
            className="mt-5 rounded-xl border border-emerald-900/20 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-100"
          >
            Explore a question with the Wisdom Guide
          </button>
        </section>
      </main>
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
    <div className="min-h-screen bg-[#f7f6f2]">
      <BackBar />

      <main className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8">
        {traditionLoading ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
            <div className="mt-4 h-10 w-64 animate-pulse rounded bg-slate-200" />
          </div>
        ) : (
          <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-6 py-10 text-white sm:px-10 sm:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">Scripture collection</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
              {tradition?.name || "Tradition"}
              <span className="font-serif italic text-orange-200"> texts</span>
            </h1>
            {tradition?.tagline && (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{tradition.tagline}</p>
            )}
          </section>
        )}

        <div className="mb-5 mt-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">Browse and reflect</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Texts in this collection</h2>
          </div>
          {!textsLoading && texts?.length > 0 && (
            <span className="text-sm text-slate-500">{texts.length} {texts.length === 1 ? "text" : "texts"}</span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {textsLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-3xl bg-white" />
            ))}

          {!textsLoading &&
            texts?.map((text) => (
              <button
                key={text.id}
                onClick={() => navigate(`/chat/${slug}/${text.id}`)}
                className="group flex min-h-36 items-start gap-5 rounded-3xl border border-slate-200/80 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-orange-100"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-800 transition group-hover:bg-orange-100">
                  <BookOpenIcon className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-base font-semibold text-slate-900">{text.title}</span>
                  {text.description && (
                    <span className="mt-2 block text-sm leading-6 text-slate-500">{text.description}</span>
                  )}
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-orange-800">
                    Open text <span aria-hidden="true" className="text-base transition group-hover:translate-x-1">→</span>
                  </span>
                </span>
              </button>
            ))}

          {!textsLoading && (!texts || texts.length === 0) && (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
              No texts found for this tradition yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}