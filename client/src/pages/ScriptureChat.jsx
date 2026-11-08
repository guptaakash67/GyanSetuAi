import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BackBar from "../components/BackBar";
import { BookOpenIcon, ArrowLeftIcon, SparklesIcon } from "../components/Icons";
import { api } from "../lib/api";

import scriptureInfo from "../data/scripture-info.json";

const SUGGESTED_QUESTIONS = [
  "What is the central teaching of this text?",
  "How can I apply this wisdom in daily life?",
  "What does this teach about finding peace?",
];

export default function ScriptureChat() {
  const { tradition, textId } = useParams();
  const navigate = useNavigate();
  const scripture = scriptureInfo[textId];

  if (!scripture) {
    return (
      <div className="min-h-screen bg-[#f7f6f2]">
        <BackBar />
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <BookOpenIcon className="h-10 w-10 text-slate-300" />
          <p className="mt-4 font-medium text-slate-700">We couldn’t find this text.</p>
          <button onClick={() => navigate("/library")} className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Return to the Library
          </button>
        </div>
      </div>
    );
  }

  return <ScriptureChatView key={textId} tradition={tradition} scripture={scripture} />;
}

function ScriptureChatView({ tradition, scripture }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(() => [{
    id: "welcome",
    role: "assistant",
    content: `I'm here to help you explore the wisdom of "${scripture.title}". Feel free to ask any questions about this scripture or how its teachings might apply to your life. What would you like to understand better?`,
  }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const userMsg = { id: Date.now(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await api.post(`/chat/${scripture.traditionSlug}`, {
        message: text,
        tradition: scripture.traditionSlug,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: res.data.content,
          sources: res.data.sources,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <BackBar />

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 pb-6 pt-5 sm:px-6 lg:h-[calc(100vh-4.5rem)] lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:pb-6 lg:pt-6">
        <aside className="h-fit overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className={`relative flex h-36 items-end overflow-hidden bg-gradient-to-br p-6 ${scripture.gradient}`}>
            <span className="absolute -bottom-16 -right-4 text-[11rem] leading-none text-white/10" aria-hidden="true">✦</span>
            <span className="relative rounded-full border border-white/25 bg-black/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
              {scripture.tradition}
            </span>
          </div>

          <div className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">Reflect on a text</p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-slate-900">{scripture.title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{scripture.description}</p>

            {scripture.verse && (
              <blockquote className="mt-6 rounded-2xl border-l-2 border-amber-600 bg-[#f7f5ef] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">A thought to begin with</p>
                <p className="mt-2 font-serif text-sm italic leading-6 text-slate-700">“{scripture.verse}”</p>
              </blockquote>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Theme</p>
                <p className="mt-1 text-sm font-medium text-slate-700">{scripture.category}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-900">
                <BookOpenIcon className="h-5 w-5" />
              </span>
            </div>

            <button
              onClick={() => navigate(`/library/${tradition}`)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-emerald-800/30 hover:bg-emerald-50/50 hover:text-emerald-950"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to {scripture.tradition} texts
            </button>
          </div>
        </aside>

        <section aria-label={`Chat about ${scripture.title}`} className="flex min-h-[70vh] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm lg:min-h-0">
          <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#263d37] text-white">
                <SparklesIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">Explore the teaching</p>
                <p className="truncate text-xs text-slate-500">{scripture.title} · {scripture.tradition}</p>
              </div>
            </div>
            <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Scripture-guided
            </span>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto bg-[#fcfbf8] px-4 py-5 sm:px-7 sm:py-7">
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} />
            ))}

            {messages.length === 1 && !sending && (
              <div className="ml-10 pt-1">
                <p className="mb-2 text-xs font-medium text-slate-500">Not sure where to start? Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => setInput(question)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-600 transition hover:border-emerald-700/40 hover:bg-emerald-50 hover:text-emerald-950"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sending && (
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#263d37] text-white">
                  <SparklesIcon className="h-4 w-4" />
                </span>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-slate-100 bg-white px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-700" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-700 [animation-delay:0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-700 [animation-delay:0.2s]" />
                  <span className="ml-2 text-xs text-slate-500">Reflecting on the text…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="border-t border-slate-100 bg-white p-3 sm:p-5">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-[#fcfbf8] p-2 transition focus-within:border-emerald-700/50 focus-within:ring-4 focus-within:ring-emerald-800/5">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                aria-label={`Ask a question about ${scripture.title}`}
                placeholder={`Ask what ${scripture.title} can teach you…`}
                className="max-h-32 min-h-11 flex-1 resize-y bg-transparent px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#263d37] px-4 text-sm font-semibold text-white transition hover:bg-[#1b2f2a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sending ? "Sending…" : "Send"}
                <span aria-hidden="true">↑</span>
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400">Answers are guided by the selected scripture. Press Enter to send · Shift + Enter for a new line.</p>
          </form>
        </section>
      </main>
    </div>
  );
}

function ChatBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-end gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#263d37] text-white">
          <SparklesIcon className="h-4 w-4" />
        </span>
      )}
      <div className={`max-w-[88%] space-y-2 sm:max-w-[78%]`}>
        <div className={`rounded-2xl px-4 py-3.5 text-sm leading-7 shadow-sm ${
          isUser
            ? "rounded-br-md bg-[#263d37] text-white"
            : "rounded-bl-md border border-slate-100 bg-white text-slate-700"
        }`}>
          {message.content}
        </div>

        {/* Source citations */}
        {message.sources && message.sources.length > 0 && (
          <div className="px-1">
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">From these sources</p>
            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((s, i) => (
                <span
                  key={`${s.title}-${i}`}
                  className="inline-block rounded-full border border-emerald-900/10 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900"
                >
                  {s.title}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      {isUser && <span className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-900">You</span>}
    </div>
  );
}