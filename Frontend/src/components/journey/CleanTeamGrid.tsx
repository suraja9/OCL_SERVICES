import React, { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Mail } from "lucide-react";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  group: "Operations" | "Driver" | "Sales" | "Warehousing";
  photo: string;
  email?: string;
};

type CleanTeamGridProps = {
  members: TeamMember[];
  className?: string;
};

const groups: Array<TeamMember["group"]> = [
  "Operations",
  "Driver",
  "Sales",
  "Warehousing"
];

export function CleanTeamGrid({ members, className }: CleanTeamGridProps) {
  const [active, setActive] = useState<TeamMember["group"] | "All">("All");
  const prefersReducedMotion = useReducedMotion();

  const filtered = useMemo(
    () => (active === "All" ? members : members.filter((m) => m.group === active)),
    [members, active]
  );

  return (
    <div className={className}>
      {/* Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {["All", ...groups].map((g) => (
          <motion.button
            key={g}
            onClick={() => setActive(g as any)}
            className={`px-4 py-2 text-sm font-semibold rounded-full border transition-colors ${
              active === g
                ? "bg-[#F6B53A] text-white border-[#F6B53A]"
                : "bg-white text-gray-700 border-gray-200 hover:border-[#F6B53A]"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-pressed={active === g}
          >
            {g}
          </motion.button>
        ))}
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((m, i) => (
            <motion.div
              key={m.id}
              className="group relative bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                duration: 0.4,
                delay: i * 0.03,
                ease: [0.16, 1, 0.3, 1]
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <motion.img
                  src={m.photo}
                  alt={`${m.name}, ${m.role}`}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="text-white text-sm font-semibold">{m.name}</div>
                  <div className="text-white/90 text-xs">{m.role}</div>
                </div>
                {m.email && (
                  <motion.a
                    href={`mailto:${m.email}`}
                    className="absolute top-2 right-2 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={`Email ${m.name}`}
                  >
                    <Mail className="h-4 w-4 text-gray-700" />
                  </motion.a>
                )}
              </div>
              <div className="p-3">
                <div className="text-sm font-semibold text-gray-900">{m.name}</div>
                <div className="text-xs text-gray-600">{m.role}</div>
                <div className="text-xs text-[#F6B53A] mt-1">{m.group}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default CleanTeamGrid;

