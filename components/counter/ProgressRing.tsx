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
      aria-hidden
    >
      {/* Track ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="oklch(1 0 0 / 8%)"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <motion.circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: progress }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        style={{ rotate: -90, originX: "50%", originY: "50%" }}
      />
    </svg>
  );
}
