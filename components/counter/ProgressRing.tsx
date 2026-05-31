"use client";
import { motion } from "motion/react";

interface ProgressRingProps {
  count: number;
  target: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({
  count,
  target,
  size = 280,
  strokeWidth = 6,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const progress = Math.min(count / target, 1);
  const completed = count >= target;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: "min(260px, calc(100vw - 64px))", height: "min(260px, calc(100vw - 64px))" }}
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
      <motion.circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={completed ? "var(--foreground)" : "var(--accent)"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: progress }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        style={{ rotate: -90, originX: "50%", originY: "50%" }}
      />
      {/* Completion glow pulse */}
      {completed && (
        <motion.circle
          key="complete-pulse"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--foreground)"
          strokeWidth={strokeWidth * 2.5}
          strokeLinecap="round"
          initial={{ opacity: 0.3, strokeWidth: strokeWidth * 2.5 }}
          animate={{ opacity: 0, strokeWidth: strokeWidth * 5 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ rotate: -90, originX: "50%", originY: "50%" }}
        />
      )}
    </svg>
  );
}
