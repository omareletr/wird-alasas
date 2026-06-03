"use client";

interface ProgressRingProps {
  count: number;
  target: number;
  size?: number;
  strokeWidth?: number;
  showPulse?: boolean;
  animateProgress?: boolean;
}

export function ProgressRing({
  count,
  target,
  size = 280,
  strokeWidth = 6,
  showPulse = false,
  animateProgress = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const progress = Math.min(count / target, 1);
  const completed = count >= target;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: "min(220px, calc(100vw - 64px))", height: "min(220px, calc(100vw - 64px))" }}
      aria-hidden
    >
      {/* Track ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={completed ? "#22c55e" : "var(--accent)"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: "50% 50%",
          transition: animateProgress ? "stroke-dashoffset 300ms ease-out, stroke 160ms ease-out" : "none",
        }}
      />
      {/* Completion glow pulse */}
      {showPulse && (
        <circle
          key="complete-pulse"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#22c55e"
          strokeWidth={strokeWidth > 1 ? strokeWidth - 1 : strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={0}
          style={{
            animation: "progress-ring-pulse 800ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
            transformOrigin: "50% 50%",
          }}
        />
      )}
    </svg>
  );
}
