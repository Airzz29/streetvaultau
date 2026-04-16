import { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
};

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl bg-white/[0.03] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}
