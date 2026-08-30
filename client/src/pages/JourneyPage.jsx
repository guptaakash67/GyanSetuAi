import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BackBar from "../components/BackBar";
import { BookmarkIcon, CalendarIcon, TrendUpIcon, HeartIcon, MessageIcon, UserIcon } from "../components/Icons";
import { useFetch } from "../hooks/useFetch";
import { journeyApi } from "../lib/api";

export default function JourneyPage() {
  const navigate = useNavigate();

  const { data: summary, loading: summaryLoading } = useFetch(() => journeyApi.getSummary(), []);
  const { data: milestones, loading: milestonesLoading } = useFetch(() => journeyApi.getMilestones(), []);
  const { data: insights, loading: insightsLoading, refetch } = useFetch(() => journeyApi.getInsights(), []);

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <BackBar />

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">My Journey</h1>
            <p className="mt-1 text-sm text-slate-500">Track your spiritual growth and insights</p>
          </div>
          {/* <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-700 text-white">
            <UserIcon className="h-5 w-5" />
          </span> */}
        </div>

        {/* Stat cards */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <StatCard icon={BookmarkIcon} label="Insights Saved" value={summaryLoading ? "—" : summary?.insightsSaved ?? 0} />
          <StatCard icon={CalendarIcon} label="Weeks Active" value={summaryLoading ? "—" : summary?.weeksActive ?? 0} />
          <StatCard icon={TrendUpIcon} label="Growth Score" value={summaryLoading ? "—" : `${summary?.growthScore ?? 0}%`} />
        </div>

        {/* Milestones */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Your Milestones</h2>
          <div className="mt-4 space-y-4">
            {milestonesLoading && (
              <div className="space-y-3">
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
              </div>
            )}
            {!milestonesLoading && (!milestones || milestones.length === 0) && (
              <p className="text-sm text-slate-400">No milestones yet — start exploring!</p>
            )}
            {milestones?.map((m) => (
              <div key={m.id} className="flex items-center gap-6 text-sm">
                <span className="w-14 shrink-0 font-semibold text-indigo-600">{m.date}</span>
                <span className="text-slate-700">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Insights */}
        <h2 className="mt-8 text-xl font-bold text-slate-900">Saved Insights</h2>

        <div className="mt-4 space-y-4">
          {insightsLoading && (
            <>
              <div className="h-40 animate-pulse rounded-2xl bg-white" />
              <div className="h-40 animate-pulse rounded-2xl bg-white" />
            </>
          )}

          {!insightsLoading && (!insights || insights.length === 0) && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              No insights saved yet. Start chatting with scriptures to save wisdom.
            </div>
          )}

          {insights?.map((insight) => (
            <InsightCard key={insight.id} insight={insight} onDelete={refetch} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-2xl bg-slate-100 p-8 text-center">
          <h3 className="text-lg font-bold text-slate-900">Continue Your Journey</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            Keep exploring wisdom and saving insights that resonate with you.
          </p>
          <button
            onClick={() => navigate("/library")}
            className="mt-5 rounded-full bg-indigo-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-800"
          >
            Find More Wisdom
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

function InsightCard({ insight, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(insight.note || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSaveNote = async () => {
    setSaving(true);
    try {
      await journeyApi.updateNote(insight.id, note);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Remove this insight?")) return;
    setDeleting(true);
    try {
      await journeyApi.deleteInsight(insight.id);
      onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <span className="text-xs font-semibold text-indigo-600">{insight.source}</span>
      <h3 className="mt-1 text-base font-semibold text-slate-900">{insight.title}</h3>
      <p className="mt-0.5 text-xs text-slate-400">Saved {insight.savedAt}</p>

      <p className="mt-3 text-sm italic leading-relaxed text-slate-700">"{insight.quote}"</p>

      {/* Note section */}
      {editing ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Add your personal note..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveNote}
              disabled={saving}
              className="rounded-full bg-indigo-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Note"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="mt-3 cursor-pointer rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 hover:bg-slate-100"
        >
          {note ? (
            <><span className="font-medium text-slate-700">Your notes: </span>{note}</>
          ) : (
            <span className="text-slate-400">Click to add a personal note...</span>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex items-center gap-5 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <HeartIcon className="h-3.5 w-3.5" />
            {insight.likes ?? 0} Likes
          </span>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
        >
          {deleting ? "Removing..." : "Remove"}
        </button>
      </div>
    </div>
  );
}