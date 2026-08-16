import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BackBar from "../components/BackBar";
import { BookOpenIcon, ArrowLeftIcon } from "../components/Icons";
import { api } from "../lib/api";

// Static scripture info matched to your library.json
const SCRIPTURE_INFO = {
  // Hindu
  "bhagavad-gita": {
    title: "Bhagavad Gita",
    tradition: "Hindu",
    traditionSlug: "hindu",
    description: "Divine wisdom through Lord Krishna's teachings on duty, purpose, and enlightenment.",
    verse: "You have a right to perform your prescribed duty, but you are not entitled to the fruits of action.",
    category: "Duty & Action",
    gradient: "from-orange-500 to-red-500",
  },
  "upanishads": {
    title: "Upanishads",
    tradition: "Hindu",
    traditionSlug: "hindu",
    description: "Philosophical treatises exploring the nature of Brahman and the self.",
    verse: "All this is Brahman. This Atman is Brahman.",
    category: "Self-Knowledge",
    gradient: "from-orange-500 to-red-500",
  },
  "ramayana": {
    title: "Ramayana",
    tradition: "Hindu",
    traditionSlug: "hindu",
    description: "Epic tale of Lord Rama embodying dharma, devotion, and righteousness.",
    verse: "One should never do that to another which one regards as injurious to one's own self.",
    category: "Righteousness",
    gradient: "from-orange-500 to-red-500",
  },
  "mahabharata": {
    title: "Mahabharata",
    tradition: "Hindu",
    traditionSlug: "hindu",
    description: "Epic narrative encompassing duty, karma, and the complexities of life.",
    verse: "The soul is never born nor dies at any time. It has not come into being, does not come into being, and will not come into being.",
    category: "Karma & Dharma",
    gradient: "from-orange-500 to-red-500",
  },
  "hindu-philosophy": {
    title: "Hindu Philosophy",
    tradition: "Hindu",
    traditionSlug: "hindu",
    description: "Core philosophical schools and concepts within the Hindu tradition.",
    verse: "Tat Tvam Asi — That thou art.",
    category: "Philosophy",
    gradient: "from-orange-500 to-red-500",
  },
  // Taoism
  "tao-te-ching": {
    title: "Tao Te Ching",
    tradition: "Taoism",
    traditionSlug: "taoism",
    description: "81 chapters of poetic wisdom on living in harmony with the natural way.",
    verse: "The Tao that can be told is not the eternal Tao.",
    category: "The Way",
    gradient: "from-emerald-500 to-teal-500",
  },
  "zhuangzi": {
    title: "Zhuangzi",
    tradition: "Taoism",
    traditionSlug: "taoism",
    description: "Philosophical stories and parables exploring spontaneity and freedom.",
    verse: "I do not know whether I was then a man dreaming I was a butterfly, or whether I am now a butterfly dreaming I am a man.",
    category: "Freedom",
    gradient: "from-emerald-500 to-teal-500",
  },
  "liezi": {
    title: "Liezi",
    tradition: "Taoism",
    traditionSlug: "taoism",
    description: "Ancient Taoist text on existence, fate, and spiritual transformation.",
    verse: "The perfect man ignores self; the divine man ignores action; the true sage ignores reputation.",
    category: "Transformation",
    gradient: "from-emerald-500 to-teal-500",
  },
  "hua-hu-ching": {
    title: "Hua Hu Ching",
    tradition: "Taoism",
    traditionSlug: "taoism",
    description: "Lesser-known teachings of Lao Tzu on practical wisdom.",
    verse: "Return to the root of being and you will find the eternal.",
    category: "Wisdom",
    gradient: "from-emerald-500 to-teal-500",
  },
  "i-ching": {
    title: "I Ching",
    tradition: "Taoism",
    traditionSlug: "taoism",
    description: "Ancient divination text exploring change and the flow of the universe.",
    verse: "Change is the only constant. Adapt and flow with the natural order.",
    category: "Change",
    gradient: "from-emerald-500 to-teal-500",
  },
  // Buddhism
  "dhammapada": {
    title: "Dhammapada",
    tradition: "Buddhism",
    traditionSlug: "buddhism",
    description: "423 verses on the path to enlightenment and ethical living.",
    verse: "Mind is the forerunner of all actions. All deeds are led by mind, created by mind.",
    category: "Mind",
    gradient: "from-amber-400 to-yellow-500",
  },
  "heart-sutra": {
    title: "Heart Sutra",
    tradition: "Buddhism",
    traditionSlug: "buddhism",
    description: "Core Mahayana text on emptiness, wisdom, and the nature of reality.",
    verse: "Form is emptiness, emptiness is form.",
    category: "Emptiness",
    gradient: "from-amber-400 to-yellow-500",
  },
  "lotus-sutra": {
    title: "Lotus Sutra",
    tradition: "Buddhism",
    traditionSlug: "buddhism",
    description: "One of the most influential Mahayana sutras on universal Buddha-nature.",
    verse: "All living beings have the Buddha nature within them.",
    category: "Buddha Nature",
    gradient: "from-amber-400 to-yellow-500",
  },
  "majjhima-nikaya": {
    title: "Majjhima Nikaya",
    tradition: "Buddhism",
    traditionSlug: "buddhism",
    description: "Middle-length discourses of the Buddha on ethics, meditation, and wisdom.",
    verse: "Better it is to live one day seeing the rise and fall of things than to live a hundred years without ever seeing the rise and fall of things.",
    category: "Meditation",
    gradient: "from-amber-400 to-yellow-500",
  },
  "tibetan-book-of-dead": {
    title: "Tibetan Book of the Dead",
    tradition: "Buddhism",
    traditionSlug: "buddhism",
    description: "Guidance on consciousness, death, and the journey toward liberation.",
    verse: "All conditioned things are impermanent. When one sees this with wisdom, one becomes disenchanted with suffering.",
    category: "Liberation",
    gradient: "from-amber-400 to-yellow-500",
  },
  // Christian
  "gospel-of-matthew": {
    title: "Gospel of Matthew",
    tradition: "Christian",
    traditionSlug: "christian",
    description: "Account of Jesus's life, teachings, and the Sermon on the Mount.",
    verse: "Blessed are the poor in spirit, for theirs is the kingdom of heaven.",
    category: "Beatitudes",
    gradient: "from-blue-500 to-indigo-500",
  },
  "psalms": {
    title: "Psalms",
    tradition: "Christian",
    traditionSlug: "christian",
    description: "150 poetic hymns and prayers expressing devotion, gratitude, and lament.",
    verse: "The Lord is my shepherd; I shall not want.",
    category: "Prayer",
    gradient: "from-blue-500 to-indigo-500",
  },
  "proverbs": {
    title: "Proverbs",
    tradition: "Christian",
    traditionSlug: "christian",
    description: "Practical wisdom on righteousness, discipline, and living a godly life.",
    verse: "Trust in the Lord with all your heart and lean not on your own understanding.",
    category: "Wisdom",
    gradient: "from-blue-500 to-indigo-500",
  },
  "gospel-of-john": {
    title: "Gospel of John",
    tradition: "Christian",
    traditionSlug: "christian",
    description: "Spiritual account of Jesus emphasizing love, light, and eternal life.",
    verse: "In the beginning was the Word, and the Word was with God, and the Word was God.",
    category: "Love & Light",
    gradient: "from-blue-500 to-indigo-500",
  },
  "letters-of-paul": {
    title: "Letters of Paul",
    tradition: "Christian",
    traditionSlug: "christian",
    description: "Epistles on faith, grace, love, and the nature of the Christian community.",
    verse: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.",
    category: "Love",
    gradient: "from-blue-500 to-indigo-500",
  },
  // Islamic
  "quran-al-fatiha": {
    title: "Al-Fatiha",
    tradition: "Islamic",
    traditionSlug: "islamic",
    description: "The opening chapter — a prayer for guidance recited in every Muslim prayer.",
    verse: "Guide us to the straight path — the path of those upon whom You have bestowed favor.",
    category: "Guidance",
    gradient: "from-emerald-500 to-green-600",
  },
  "quran-al-baqarah": {
    title: "Al-Baqarah",
    tradition: "Islamic",
    traditionSlug: "islamic",
    description: "The longest surah covering faith, law, prayer, and moral guidance.",
    verse: "Allah does not burden a soul beyond that it can bear.",
    category: "Faith",
    gradient: "from-emerald-500 to-green-600",
  },
  "quran-al-imran": {
    title: "Al-Imran",
    tradition: "Islamic",
    traditionSlug: "islamic",
    description: "Teachings on unity of God and steadfastness in faith.",
    verse: "And hold firmly to the rope of Allah all together and do not become divided.",
    category: "Unity",
    gradient: "from-emerald-500 to-green-600",
  },
  "hadith-bukhari": {
    title: "Hadith — Sahih Bukhari",
    tradition: "Islamic",
    traditionSlug: "islamic",
    description: "Most authentic collection of the Prophet Muhammad's sayings and actions.",
    verse: "The best of people are those who are most beneficial to people.",
    category: "Conduct",
    gradient: "from-emerald-500 to-green-600",
  },
  "rumi-masnavi": {
    title: "Masnavi — Rumi",
    tradition: "Islamic",
    traditionSlug: "islamic",
    description: "Six volumes of mystical Sufi poetry exploring love and divine union.",
    verse: "Out beyond ideas of wrongdoing and rightdoing, there is a field. I'll meet you there.",
    category: "Love & Mysticism",
    gradient: "from-emerald-500 to-green-600",
  },
};

export default function ScriptureChat() {
  const { tradition, textId } = useParams();
  const navigate = useNavigate();
  const scripture = SCRIPTURE_INFO[textId];

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Welcome message on load
  useEffect(() => {
    if (scripture) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `I'm here to help you explore the wisdom of "${scripture.title}". Feel free to ask any questions about this scripture or how its teachings might apply to your life. What would you like to understand better?`,
      }]);
    }
  }, [textId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!scripture) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <BackBar />
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <p>Scripture not found.</p>
          <button onClick={() => navigate("/library")} className="mt-4 text-indigo-700 underline text-sm">
            Back to Library
          </button>
        </div>
      </div>
    );
  }

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
    } catch (err) {
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
    <div className="min-h-screen bg-[#F7F8FA]">
      <BackBar />

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[360px_1fr]">

        {/* Left — Scripture Info Card */}
        <div className="h-fit rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {/* Gradient header */}
          <div className={`h-24 bg-gradient-to-br ${scripture.gradient}`} />

          <div className="p-6">
            <span className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
              {scripture.tradition}
            </span>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{scripture.title}</h1>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Category</p>
              <p className="mt-1 text-sm text-slate-700">{scripture.category}</p>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Verse Preview</p>
              <p className="mt-2 text-sm italic leading-relaxed text-slate-700">"{scripture.verse}"</p>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">About</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{scripture.description}</p>
            </div>

            <button
              onClick={() => navigate(`/library/${tradition}`)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:border-slate-300"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to {scripture.tradition}
            </button>
          </div>
        </div>

        {/* Right — Chat Panel */}
        <div className="flex h-[calc(100vh-8rem)] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <BookOpenIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{scripture.title}</p>
              <p className="text-xs text-slate-500">{scripture.tradition}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} />
            ))}

            {sending && (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:0.2s]" />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-3 border-t border-slate-100 p-4"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${scripture.title}…`}
              className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-300"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="shrink-0 rounded-full bg-indigo-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] space-y-2`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-indigo-900 text-white"
              : "border border-slate-100 bg-slate-50 text-slate-700"
          }`}
        >
          {message.content}
        </div>

        {/* Source citations */}
        {message.sources && message.sources.length > 0 && (
          <div className="space-y-1 px-1">
            <p className="text-xs text-slate-400">Sources:</p>
            {message.sources.map((s, i) => (
              <span
                key={i}
                className="mr-1 inline-block rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
              >
                {s.title}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}