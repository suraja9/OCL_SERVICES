import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type Milestone = {
  id: string;
  year: string;
  title: string;
  summary: string;
  details?: string;
  media?: { type: "image" | "video"; src: string; alt?: string };
  pastelClass?: string;
  icon?: React.ReactNode;
};

type TimelineProps = {
  milestones: Milestone[];
  className?: string;
  ariaLabel?: string;
};

export function Timeline({ milestones, className, ariaLabel }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onScroll() {
      const max =
        el.scrollWidth - el.clientWidth > 0
          ? el.scrollWidth - el.clientWidth
          : el.scrollHeight - el.clientHeight;
      const curr = el.scrollLeft || el.scrollTop;
      setProgress(max > 0 ? Math.min(1, Math.max(0, curr / max)) : 0);
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const lineStyle = useMemo(
    () => ({
      transform: `scaleX(${progress})`,
      transformOrigin: "0 0"
    }),
    [progress]
  );

  return (
    <section
      aria-label={ariaLabel || "Company milestones timeline"}
      className={cn("w-full", className)}
    >
      <div className="relative">
        <div
          className={cn(
            "absolute left-4 right-4 h-[2px] bg-[rgba(10,107,107,0.2)] rounded",
            "top-10 md:top-12 lg:top-14"
          )}
          aria-hidden="true"
        />
        <motion.div
          className={cn(
            "absolute left-4 right-4 h-[2px] bg-[#0A6B6B] rounded",
            "top-10 md:top-12 lg:top-14"
          )}
          style={prefersReducedMotion ? undefined : (lineStyle as any)}
          aria-hidden="true"
        />

        <div
          ref={containerRef}
          className={cn(
            "no-scrollbar relative mt-8",
            // Desktop: horizontal scroll-snap
            "hidden md:flex gap-8 overflow-x-auto px-6 py-8 scroll-pl-6 scroll-smooth snap-x snap-mandatory",
            // Mobile fallback: vertical list
            "md:hidden:block"
          )}
        />

        {/* Desktop horizontal */}
        <div
          ref={containerRef}
          className={cn(
            "no-scrollbar relative mt-8 hidden md:flex gap-8 overflow-x-auto px-6 py-8 scroll-pl-6 scroll-smooth snap-x snap-mandatory"
          )}
          role="list"
        >
          {milestones.map((m, i) => (
            <TimelineItem
              key={m.id}
              milestone={m}
              index={i}
              onExpand={() => setActive(m.id)}
            />
          ))}
        </div>

        {/* Mobile vertical */}
        <div
          className="md:hidden grid grid-cols-1 gap-6 mt-8 px-4"
          role="list"
        >
          {milestones.map((m, i) => (
            <TimelineItem
              key={m.id}
              milestone={m}
              index={i}
              vertical
              onExpand={() => setActive(m.id)}
            />
          ))}
        </div>
      </div>

      <MilestoneDialog
        milestone={milestones.find((m) => m.id === active) || null}
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
      />
    </section>
  );
}

function TimelineItem({
  milestone,
  index,
  onExpand,
  vertical
}: {
  milestone: Milestone;
  index: number;
  onExpand: () => void;
  vertical?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.button
      role="listitem"
      className={cn(
        "snap-start min-w-[280px] md:min-w-[360px] lg:min-w-[420px] outline-none",
        "rounded-[18px] text-left",
        "bg-white shadow-[0_18px_40px_rgba(13,27,42,0.08)]",
        "hover:translate-y-[-8px] hover:scale-[1.04] transition-[transform,box-shadow]",
        "focus-visible:ring-2 focus-visible:ring-[#F6B53A] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(250,248,244,1)]",
        vertical ? "" : "mr-2"
      )}
      style={{
        transitionDuration: "360ms",
        transitionTimingFunction: "cubic-bezier(.2,.9,.2,1)"
      }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={
        prefersReducedMotion
          ? { duration: 0.1 }
          : { duration: 0.6, delay: index * 0.05, ease: [0.2, 0.9, 0.2, 1] }
      }
      onClick={onExpand}
      aria-haspopup="dialog"
      aria-label={`${milestone.year} ${milestone.title}`}
    >
      <div
        className={cn(
          "relative flex items-start gap-4 p-5 md:p-6 rounded-[18px]",
          milestone.pastelClass || "bg-[#FAF8F4]"
        )}
      >
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            "bg-white shadow-sm"
          )}
          aria-hidden="true"
        >
          {milestone.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span
              className="inline-flex items-center rounded-full bg-[#0A6B6B] text-white px-3 py-1 text-xs font-semibold"
              aria-hidden="true"
            >
              {milestone.year}
            </span>
            <h3
              className="text-lg md:text-xl font-bold text-[#0D1B2A]"
              style={{ fontFamily: "Merriweather, serif" }}
            >
              {milestone.title}
            </h3>
          </div>
          <p className="text-sm md:text-base text-[#2b3442]">{milestone.summary}</p>
        </div>
      </div>
    </motion.button>
  );
}

function MilestoneDialog({
  milestone,
  open,
  onOpenChange
}: {
  milestone: Milestone | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-[rgba(0,0,0,0.5)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 w-[92vw] max-w-[720px] -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl bg-white shadow-2xl focus:outline-none"
          )}
          aria-label={milestone ? `${milestone.year} ${milestone.title}` : "Milestone details"}
        >
          <div className="p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center rounded-full bg-[#0A6B6B] text-white px-3 py-1 text-xs font-semibold mb-2">
                  {milestone?.year}
                </div>
                <Dialog.Title
                  className="text-2xl md:text-3xl font-bold text-[#0D1B2A]"
                  style={{ fontFamily: "Merriweather, serif" }}
                >
                  {milestone?.title}
                </Dialog.Title>
                {milestone?.summary && (
                  <Dialog.Description className="text-sm md:text-base text-[#2b3442] mt-2">
                    {milestone.summary}
                  </Dialog.Description>
                )}
              </div>
              <Dialog.Close
                className="inline-flex items-center justify-center rounded-full p-2 text-[#0D1B2A] hover:bg-[#F5EFE6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6B53A]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            {milestone?.media && (
              <div className="mt-5 overflow-hidden rounded-xl">
                {milestone.media.type === "image" ? (
                  <img
                    src={milestone.media.src}
                    alt={milestone.media.alt || ""}
                    loading="lazy"
                    className="w-full h-[280px] object-cover"
                  />
                ) : (
                  <video
                    className="w-full h-[280px] object-cover"
                    src={milestone.media.src}
                    controls
                  />
                )}
              </div>
            )}

            {milestone?.details && (
              <div className="mt-4 text-sm md:text-base text-[#0D1B2A]">
                {milestone.details}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default Timeline;


