"use client";

interface StreakDisplayProps {
  current: number;
  longest: number;
}

export function StreakDisplay({ current, longest }: StreakDisplayProps) {
  return (
    <div className="flex gap-8">
      <div className="flex flex-col gap-1">
        <span className="text-4xl font-mono text-white tabular-nums">{current}</span>
        <span className="text-[10px] font-mono tracking-widest uppercase text-white/30">
          Current streak
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-4xl font-mono text-white tabular-nums">{longest}</span>
        <span className="text-[10px] font-mono tracking-widest uppercase text-white/30">
          Longest streak
        </span>
      </div>
    </div>
  );
}
