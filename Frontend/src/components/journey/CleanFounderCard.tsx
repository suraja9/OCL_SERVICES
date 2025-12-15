import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { Linkedin, Mail, X } from "lucide-react";

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

type CleanFounderCardProps = {
  founder: Founder;
  index: number;
  className?: string;
};

export function CleanFounderCard({
  founder,
  index,
  className
}: CleanFounderCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1]
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -4, transition: { duration: 0.3 } }}
    >
      {founder.avatarSrc && (
        <div className="relative h-64 overflow-hidden bg-gray-100">
          <motion.img
            src={founder.avatarSrc}
            alt={founder.name}
            className="w-full h-full object-cover"
            animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      )}

      <div className="p-6">
        <div className="text-center">
          {!founder.avatarSrc && (
            <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto mb-4 flex items-center justify-center text-2xl text-gray-400">
              {founder.name.charAt(0)}
            </div>
          )}
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {founder.name}
          </h3>
          <div className="text-sm font-semibold text-[#F6B53A] mb-3">
            {founder.role}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            {founder.bio}
          </p>

          <div className="flex items-center justify-center gap-3">
            {founder.linkedin && (
              <motion.a
                href={founder.linkedin}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full border border-gray-200 text-gray-600 hover:border-[#F6B53A] hover:text-[#F6B53A] transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`${founder.name} on LinkedIn`}
              >
                <Linkedin className="h-4 w-4" />
              </motion.a>
            )}
            {founder.email && (
              <motion.a
                href={`mailto:${founder.email}`}
                className="p-2 rounded-full border border-gray-200 text-gray-600 hover:border-[#F6B53A] hover:text-[#F6B53A] transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Email ${founder.name}`}
              >
                <Mail className="h-4 w-4" />
              </motion.a>
            )}
            {founder.story && (
              <FounderDialogTrigger founder={founder} />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FounderDialogTrigger({ founder }: { founder: Founder }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <motion.button
          className="px-4 py-2 bg-[#F6B53A] text-white text-sm font-semibold rounded-full hover:bg-[#F6B53A]/90 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Story
        </motion.button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Dialog.Title className="text-2xl font-bold text-gray-900 mb-1">
                {founder.name}
              </Dialog.Title>
              <Dialog.Description className="text-sm font-semibold text-[#F6B53A]">
                {founder.role}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-gray-600" />
            </Dialog.Close>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed">
            {founder.story}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default CleanFounderCard;

