import React, { useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { Linkedin, Mail, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type Founder = {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatarSrc?: string;
  linkedin?: string;
  email?: string;
  story?: string;
};

type FoundersGridProps = {
  founders: Founder[];
  className?: string;
};

export function FoundersGrid({ founders, className }: FoundersGridProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8",
        className
      )}
      role="list"
    >
      {founders.map((f, i) => (
        <FounderCard
          key={f.id}
          founder={f}
          index={i}
          prefersReducedMotion={!!prefersReducedMotion}
          parallaxY={prefersReducedMotion ? undefined : y}
        />
      ))}
    </div>
  );
}

function FounderCard({
  founder,
  index,
  prefersReducedMotion,
  parallaxY
}: {
  founder: Founder;
  index: number;
  prefersReducedMotion: boolean;
  parallaxY?: any;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      role="listitem"
      className="relative group"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={
        prefersReducedMotion
          ? { duration: 0.1 }
          : { duration: 0.8, delay: index * 0.15, ease: [0.2, 0.9, 0.2, 1] }
      }
      whileHover={{ y: -12, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={parallaxY ? { y: parallaxY } : {}}
    >
      {/* Glow Effect */}
      <motion.div
        className="absolute -inset-1 bg-gradient-to-br from-[#0A6B6B] via-[#F6B53A] to-[#0A6B6B] rounded-3xl opacity-0 blur-xl"
        animate={isHovered ? { opacity: 0.3 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
      />

      <div className="relative rounded-3xl bg-white/90 backdrop-blur-xl p-8 shadow-[0_24px_64px_rgba(13,27,42,0.12)] border border-white/20 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-[radial-gradient(closest-side,#F6B53A,transparent)]"
            animate={
              isHovered
                ? { scale: 1.5, opacity: 0.4 }
                : { scale: 1, opacity: 0.2 }
            }
            transition={{ duration: 0.6 }}
          />
          <motion.div
            className="absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-[radial-gradient(closest-side,#0A6B6B,transparent)]"
            animate={
              isHovered
                ? { scale: 1.5, opacity: 0.3 }
                : { scale: 1, opacity: 0.15 }
            }
            transition={{ duration: 0.6 }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Avatar with Parallax */}
          <motion.div
            className="relative mb-6"
            animate={isHovered ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="relative h-32 w-32 rounded-full overflow-hidden ring-4 ring-white shadow-2xl">
              {founder.avatarSrc ? (
                <motion.img
                  src={founder.avatarSrc}
                  alt={`${founder.name} portrait`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ duration: 0.5 }}
                />
              ) : (
                <div className="h-full w-full grid place-items-center bg-gradient-to-br from-[#0A6B6B] to-[#F6B53A] text-3xl text-white">
                  {founder.name.charAt(0)}
                </div>
              )}
            </div>
            <motion.div
              className="absolute -bottom-2 -right-2 rounded-full bg-gradient-to-br from-[#0A6B6B] to-[#0A6B6B]/80 text-white text-xs font-semibold px-3 py-1.5 shadow-lg"
              animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Founder
            </motion.div>
            {/* Pulse Ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-[#0A6B6B]"
              animate={
                isHovered
                  ? { scale: [1, 1.3, 1.3], opacity: [0.6, 0, 0] }
                  : { scale: 1, opacity: 0 }
              }
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          <motion.div
            className="text-2xl md:text-3xl font-bold text-[#0D1B2A] mb-2"
            style={{ fontFamily: "Merriweather, serif" }}
            animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
          >
            {founder.name}
          </motion.div>
          <div className="text-[#0A6B6B] font-semibold text-sm mb-3">
            {founder.role}
          </div>
          <p className="mt-2 text-sm text-[#2b3442] leading-relaxed max-w-xs">
            {founder.bio}
          </p>

          <motion.div
            className="mt-6 flex items-center gap-3"
            animate={isHovered ? { y: -4 } : { y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {founder.linkedin && (
              <motion.a
                href={founder.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label={`${founder.name} on LinkedIn`}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#F5EFE6] to-white text-[#0D1B2A] shadow-lg border border-white/50"
                whileHover={{ scale: 1.15, rotate: 360 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Linkedin className="h-5 w-5" />
              </motion.a>
            )}
            {founder.email && (
              <motion.a
                href={`mailto:${founder.email}`}
                aria-label={`Email ${founder.name}`}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#F5EFE6] to-white text-[#0D1B2A] shadow-lg border border-white/50"
                whileHover={{ scale: 1.15, rotate: -360 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Mail className="h-5 w-5" />
              </motion.a>
            )}
            <FounderDialogTrigger founder={founder} isHovered={isHovered} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function FounderDialogTrigger({
  founder,
  isHovered
}: {
  founder: Founder;
  isHovered: boolean;
}) {
  if (!founder.story) return null;
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <motion.button
          className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0A6B6B] to-[#0A6B6B]/90 px-6 text-white text-sm font-semibold shadow-lg"
          aria-haspopup="dialog"
          whileHover={{ scale: 1.1, boxShadow: "0 8px 24px rgba(10,107,107,0.4)" }}
          whileTap={{ scale: 0.95 }}
          animate={isHovered ? { boxShadow: "0 8px 24px rgba(10,107,107,0.3)" } : {}}
        >
          Story
        </motion.button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] max-w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white/95 backdrop-blur-xl p-8 shadow-2xl border border-white/20">
          <div className="flex items-start justify-between mb-4">
            <Dialog.Title
              className="text-2xl md:text-3xl font-bold text-[#0D1B2A]"
              style={{ fontFamily: "Merriweather, serif" }}
            >
              {founder.name}
            </Dialog.Title>
            <Dialog.Close
              className="inline-flex items-center justify-center rounded-full p-2 text-[#0D1B2A] hover:bg-[#F5EFE6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6B53A]"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="text-[#0A6B6B] font-semibold mb-4">
            {founder.role}
          </Dialog.Description>
          <div className="text-sm md:text-base text-[#2b3442] leading-relaxed">
            {founder.story}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default FoundersGrid;


