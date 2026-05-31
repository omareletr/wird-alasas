"use client";

interface StreakDisplayProps {
  current: number;
  longest: number;
}

export function StreakDisplay({ current, longest }: StreakDisplayProps) {
  return (
    <div className="flex gap-8">
      <div className="flex flex-col gap-1">
        <span className="text-4xl font-mono text-foreground tabular-nums">{current}</span>
        <span className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground/60">
          Current streak
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-4xl font-mono text-foreground tabular-nums">{longest}</span>
        <span className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground/60">
          Longest streak
        </span>
      </div>
    </div>
  );
}
