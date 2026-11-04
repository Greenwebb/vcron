import logoDark from "@/assets/logo-dark.svg";
import logoLight from "@/assets/logo-light.svg";
import { cn } from "@/lib/utils";

export default function Logo({ variant = "default", size = "md", className }) {
  const heights = { sm: 32, md: 40, lg: 56, xl: 64 };
  return <img
    src={variant === "light" ? logoLight : logoDark}
    alt="VChron - Verified Workforce Intelligence"
    height={heights[size] || heights.md}
    className={cn("w-auto object-contain", className)}
    style={{ height: heights[size] || heights.md }}
    draggable={false}
  />;
}
