import React, { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  group: "Operations" | "Driver" | "Sales" | "Warehousing";
  photo: string;
  email?: string;
};

type TeamMasonryProps = {
  members: TeamMember[];
  className?: string;
};

const groups: Array<TeamMember["group"]> = [
  "Operations",
  "Driver",
  "Sales",
  "Warehousing"
];

export function TeamMasonry({ members, className }: TeamMasonryProps) {
  const [active, setActive] = useState<TeamMember["group"] | "All">("All");
  const prefersReducedMotion = useReducedMotion();

  const filtered = useMemo(
    () => (active === "All" ? members : members.filter((m) => m.group === active)),
    [members, active]
  );

  return (
    <div className={className}>
      {/* Enhanced Filter Buttons */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {["All", ...groups].map((g) => (
          <motion.button
            key={g}
            onClick={() => setActive(g as any)}
            className={cn(
              "inline-flex items-center rounded-full border px-5 py-2.5 text-sm font-semibold transition-all relative overflow-hidden",
              active === g
                ? "bg-gradient-to-r from-[#0A6B6B] to-[#0A6B6B]/90 text-white border-[#0A6B6B] shadow-lg"
                : "bg-white/80 backdrop-blur-sm text-[#0D1B2A] border-[#E6E0D6] hover:bg-[#F5EFE6] hover:border-[#0A6B6B]/30"
            )}
            aria-pressed={active === g}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={false}
            animate={
              active === g
                ? {
                    boxShadow: "0 8px 24px rgba(10,107,107,0.3)"
                  }
                : {}
            }
          >
            {active === g && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#0A6B6B] to-[#F6B53A] opacity-20"
                layoutId="activeFilter"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10">{g}</span>
          </motion.button>
        ))}
      </div>

      {/* Animated Grid */}
      <div
        className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]"
        role="list"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((m, i) => (
            <motion.div
              key={m.id}
              role="listitem"
              className="mb-6 break-inside-avoid rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(13,27,42,0.12)] group relative bg-white"
              layout
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0.1 }
                  : {
                      duration: 0.6,
                      delay: i * 0.05,
                      ease: [0.2, 0.9, 0.2, 1]
                    }
              }
              whileHover={{ y: -8, scale: 1.02 }}
            >
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-br from-[#0A6B6B] via-[#F6B53A] to-[#0A6B6B] rounded-3xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500 -z-10" />

            <div className="relative overflow-hidden">
              <motion.img
                src={m.photo}
                alt={`${m.name}, ${m.role}`}
                loading="lazy"
                className="w-full h-auto object-cover"
                initial={{ scale: 1.1 }}
                whileHover={{ scale: 1.15 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
              <motion.div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              <motion.div
                className="absolute left-0 right-0 bottom-0 p-5 flex items-center justify-between text-white"
                initial={{ opacity: 0, y: 20 }}
                whileHover={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div>
                  <div className="text-xl font-bold mb-1">{m.name}</div>
                  <div className="text-sm opacity-90 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#F6B53A]"></span>
                    {m.role}
                  </div>
                  <div className="text-xs opacity-75 mt-1">{m.group}</div>
                </div>
                {m.email && (
                  <motion.a
                    href={`mailto:${m.email}`}
                    aria-label={`Email ${m.name}`}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30"
                    whileHover={{ scale: 1.2, rotate: 360, backgroundColor: "rgba(255,255,255,0.3)" }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Mail className="h-5 w-5" />
                  </motion.a>
                )}
              </motion.div>
            </div>
          </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default TeamMasonry;


