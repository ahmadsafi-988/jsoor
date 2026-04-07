import { Progress } from "@/components/ui/progress";

export default function ScoreBadge({ score }: { score: number }) {
  const colour =
    score >= 8
      ? "bg-emerald-100 text-emerald-800"
      : score >= 5
      ? "bg-amber-100 text-amber-800"
      : "bg-red-100 text-red-800";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colour}`}>
      {score}/10
    </span>
  );
}

export function OverallScore({ feedbackItems }: { feedbackItems: FeedbackItem[] }) {
  const avg = feedbackItems.reduce((s, f) => s + f.score, 0) / feedbackItems.length;
  const pct = (avg / 10) * 100;
  const colour = avg >= 8 ? "text-emerald-600" : avg >= 5 ? "text-amber-600" : "text-red-600";
  return (
    <div className="rounded-xl border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground mb-1">Overall score</p>
      <p className={`text-5xl font-bold ${colour}`}>{avg.toFixed(1)}</p>
      <p className="text-xs text-muted-foreground mt-1">out of 10</p>
      <Progress value={pct} className="mt-4 h-2" />
    </div>
  );
}