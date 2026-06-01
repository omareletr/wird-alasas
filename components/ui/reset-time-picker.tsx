"use client";

import { useState } from "react";
import { Check, ChevronDown, Clock3 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { formatResetTime } from "@/lib/utils/timeOptions";

interface ResetTimePickerProps {
  value: number;
  onChange(value: number): void;
  className?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const unfoldEase = [0.16, 1, 0.3, 1] as [number, number, number, number];

function toParts(value: number) {
  const hour24 = Math.floor(value);
  const minute = value % 1 === 0.5 ? 30 : 0;
  const period: "AM" | "PM" = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;

  return { hour12, minute, period };
}

function fromParts(hour12: number, minute: number, period: "AM" | "PM") {
  const normalizedHour = hour12 === 12 ? 0 : hour12;
  const hour24 = period === "PM" ? normalizedHour + 12 : normalizedHour;

  return hour24 + (minute === 30 ? 0.5 : 0);
}

function OptionButton({
  selected,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { selected?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "relative flex h-10 items-center justify-center rounded-lg border border-transparent px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card active:bg-accent",
        selected &&
          "border-primary/25 bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        className
      )}
      {...props}
    >
      {children}
      {selected ? (
        <Check className="absolute right-2 size-3.5" aria-hidden="true" />
      ) : null}
    </button>
  );
}

export function ResetTimePicker({
  value,
  onChange,
  className,
}: ResetTimePickerProps) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const { hour12, minute, period } = toParts(value);

  const selectHour = (nextHour: number) => {
    onChange(fromParts(nextHour, minute, period));
  };

  const selectMinute = (nextMinute: 0 | 30) => {
    onChange(fromParts(hour12, nextMinute, period));
  };

  const selectPeriod = (nextPeriod: "AM" | "PM") => {
    onChange(fromParts(hour12, minute, nextPeriod));
  };

  return (
    <motion.div
      layout={!reduceMotion}
      transition={{ duration: 0.22, ease: unfoldEase }}
      className={cn(
        "w-full overflow-hidden rounded-xl border border-input bg-input/20",
        className
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-label={`Daily reset time, ${formatResetTime(value)}`}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/45"
      >
        <span className="flex min-w-0 items-center gap-3">
          <Clock3 className="size-4 shrink-0 text-muted-foreground/75" aria-hidden="true" />
          <span className="font-sans text-xl font-medium tabular-nums text-foreground">
            {formatResetTime(value)}
          </span>
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.18, ease: "easeOut" }}
          className="shrink-0 text-muted-foreground"
          aria-hidden="true"
        >
          <ChevronDown className="size-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="time-options"
            initial={
              reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0, y: -4 }
            }
            animate={
              reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1, y: 0 }
            }
            exit={
              reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0, y: -3 }
            }
            transition={{
              duration: reduceMotion ? 0.01 : 0.22,
              ease: unfoldEase,
            }}
            className="overflow-hidden border-t border-border/70"
          >
            <motion.div
              initial={reduceMotion ? false : "closed"}
              animate="open"
              exit={reduceMotion ? undefined : "closed"}
              variants={{
                open: {
                  transition: {
                    delayChildren: 0.04,
                    staggerChildren: 0.018,
                  },
                },
                closed: {
                  transition: {
                    staggerChildren: 0.012,
                    staggerDirection: -1,
                  },
                },
              }}
              className="px-3 pb-3 pt-2"
            >
              <motion.div
                variants={{
                  open: { opacity: 1, y: 0 },
                  closed: { opacity: 0, y: -3 },
                }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="grid grid-cols-4 gap-1"
              >
                {HOURS.map((hour) => (
                  <OptionButton
                    key={hour}
                    selected={hour12 === hour}
                    onClick={() => selectHour(hour)}
                    aria-label={`Set hour to ${hour}`}
                  >
                    {hour}
                  </OptionButton>
                ))}
              </motion.div>

              <motion.div
                variants={{
                  open: { opacity: 1, y: 0 },
                  closed: { opacity: 0, y: -3 },
                }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="mt-2 grid grid-cols-4 gap-1"
              >
                <OptionButton
                  selected={minute === 0}
                  onClick={() => selectMinute(0)}
                  aria-label="Set minutes to zero"
                  className="col-span-2"
                >
                  00
                </OptionButton>
                <OptionButton
                  selected={minute === 30}
                  onClick={() => selectMinute(30)}
                  aria-label="Set minutes to thirty"
                  className="col-span-2"
                >
                  30
                </OptionButton>
              </motion.div>

              <motion.div
                variants={{
                  open: { opacity: 1, y: 0 },
                  closed: { opacity: 0, y: -3 },
                }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="mt-2 grid grid-cols-2 gap-1"
              >
                <OptionButton
                  selected={period === "AM"}
                  onClick={() => selectPeriod("AM")}
                  aria-label="Set period to AM"
                >
                  AM
                </OptionButton>
                <OptionButton
                  selected={period === "PM"}
                  onClick={() => selectPeriod("PM")}
                  aria-label="Set period to PM"
                >
                  PM
                </OptionButton>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
