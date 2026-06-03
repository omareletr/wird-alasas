"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ADHKAR } from "@/lib/data/adhkar";
import { BismillahHeader } from "@/components/counter/BismillahHeader";
import { DhikrCard } from "@/components/counter/DhikrCard";
import { TapSurface } from "@/components/counter/TapSurface";
import { useSessionStore } from "@/lib/store/sessionStore";
import type { DhikrIndex } from "@/lib/storage/schema";
import { IOSInstallCTA } from "@/components/counter/IOSInstallCTA";

function clampPage(index: number): DhikrIndex {
  return Math.max(0, Math.min(ADHKAR.length - 1, index)) as DhikrIndex;
}

export function DhikrDeck() {
  const activeIndex = useSessionStore((s) => s.activeIndex);
  const setActiveIndex = useSessionStore((s) => s.setActiveIndex);
  const counts = useSessionStore((s) => s.counts);
  const mode = useSessionStore((s) => s.mode);
  const reduceMotion = useReducedMotion();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const activeIndexRef = useRef(activeIndex);
  const scrollFrameRef = useRef<number | null>(null);
  const scrollCommittedIndexRef = useRef<DhikrIndex | null>(null);
  const [pageWidth, setPageWidth] = useState(0);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const element = scrollerRef.current;
    if (!element) return;

    const updatePageWidth = () => {
      const width = element.clientWidth;
      setPageWidth(width);
      element.scrollTo({ left: activeIndexRef.current * width, behavior: "auto" });
    };

    updatePageWidth();
    const observer = new ResizeObserver(updatePageWidth);
    observer.observe(element);

    return () => {
      observer.disconnect();
      if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current);
    };
  }, []);

  useEffect(() => {
    const element = scrollerRef.current;
    if (!element || pageWidth === 0) return;

    if (scrollCommittedIndexRef.current === activeIndex) {
      scrollCommittedIndexRef.current = null;
      return;
    }

    element.scrollTo({
      left: activeIndex * pageWidth,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [activeIndex, pageWidth, reduceMotion]);

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (pageWidth === 0) return;

      if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current);

      const element = event.currentTarget;
      scrollFrameRef.current = requestAnimationFrame(() => {
        const nextIndex = clampPage(Math.round(element.scrollLeft / pageWidth));

        if (nextIndex !== activeIndexRef.current) {
          activeIndexRef.current = nextIndex;
          scrollCommittedIndexRef.current = nextIndex;
          setActiveIndex(nextIndex);
        }
      });
    },
    [pageWidth, setActiveIndex]
  );

  const pages = useMemo(() => ADHKAR, []);

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="flex shrink-0 justify-center pb-2 pt-4 pointer-events-none sm:pt-5">
        <BismillahHeader />
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorX: "none",
            touchAction: "pan-x pan-y",
          }}
        >
          {pages.map((entry) => {
            const isActive = entry.index === activeIndex;
            const card = (
              <DhikrCard
                entry={entry}
                count={counts[entry.index]}
                mode={mode}
                dhikrIndex={entry.index}
                isActive={isActive}
              />
            );

            return (
              <div
                key={entry.index}
                className="h-full w-full flex-none snap-center snap-always"
                aria-hidden={!isActive}
              >
                {isActive ? (
                  <TapSurface dhikrIndex={entry.index}>{card}</TapSurface>
                ) : (
                  card
                )}
              </div>
            );
          })}
        </div>
      </div>

      <IOSInstallCTA />
      <div
        className="flex min-h-11 shrink-0 items-center justify-center gap-2.5"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
      >
        {ADHKAR.map((_, i) => (
          <motion.div
            key={i}
            className="rounded-full bg-foreground"
            animate={{
              opacity: i === activeIndex ? 0.95 : 0.22,
              scale: i === activeIndex ? 1.25 : 1,
            }}
            transition={{ duration: reduceMotion ? 0.01 : 0.18, ease: "easeOut" }}
            style={{ width: 6, height: 6 }}
          />
        ))}
      </div>
    </div>
  );
}
