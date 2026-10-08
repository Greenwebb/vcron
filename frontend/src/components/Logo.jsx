import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Logo({ variant = "default", size = "md", className }) {
  const sizes = { sm: "text-lg", md: "text-2xl", lg: "text-3xl", xl: "text-5xl" };
  return (
    <span className={cn("inline-flex items-center gap-2 font-bold tracking-tight", sizes[size] || sizes.md, variant === "light" ? "text-white" : "text-teal-700", className)}>
      <Clock aria-hidden="true" className="h-[1em] w-[1em]" />
      <span>VChron</span>
    </span>
  );
}
