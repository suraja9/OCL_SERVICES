import React from "react";
import { cn } from "@/lib/utils";

type ShowcaseCardProps = {
  className?: string;
  imageSrc?: string;
  imageAlt?: string;
  header?: React.ReactNode;
  subheader?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  as?: "div" | "button" | "a";
  href?: string;
  ariaLabel?: string;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F6B53A] focus-visible:ring-offset-[rgba(250,248,244,1)]";

export function ShowcaseCard({
  className,
  imageSrc,
  imageAlt,
  header,
  subheader,
  children,
  onClick,
  as = "div",
  href,
  ariaLabel
}: ShowcaseCardProps) {
  const Component: any = as === "a" ? "a" : as;

  return (
    <Component
      href={href}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-[20px] bg-white/70 backdrop-blur-md",
        "shadow-[0_20px_40px_rgba(13,27,42,0.08)]",
        "transition-[transform,box-shadow]",
        "will-change-transform",
        "outline-none",
        focusRing,
        "hover:translate-y-[-8px] hover:scale-[1.04] hover:shadow-[0_30px_60px_rgba(13,27,42,0.14)]",
        "focus-visible:translate-y-[-8px] focus-visible:scale-[1.04] focus-visible:shadow-[0_30px_60px_rgba(13,27,42,0.14)]",
        className
      )}
      style={{
        transitionDuration: "360ms",
        transitionTimingFunction: "cubic-bezier(.2,.9,.2,1)"
      }}
    >
      {imageSrc && (
        <div className="relative h-56 w-full overflow-hidden">
          <img
            src={imageSrc}
            alt={imageAlt || ""}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.25)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      )}

      <div className="p-6">
        {(header || subheader) && (
          <div className="mb-3">
            {header && (
              <div
                className="text-[22px] leading-snug font-bold text-[#0D1B2A]"
                style={{ fontFamily: "Merriweather, 'Playfair Display', serif" }}
              >
                {header}
              </div>
            )}
            {subheader && (
              <div className="text-sm text-[#3a4655]">{subheader}</div>
            )}
          </div>
        )}
        {children}
      </div>
    </Component>
  );
}

export default ShowcaseCard;


