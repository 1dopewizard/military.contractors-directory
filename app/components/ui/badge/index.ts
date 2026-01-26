import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Badge } from "./Badge.vue"

export const badgeVariants = cva(
  "inline-flex gap-1 items-center rounded-md border px-2.5 py-0.5 text-[10px] font-normal transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        ghost: "border-transparent bg-transparent text-foreground hover:bg-muted",
        soft: "border-transparent bg-primary/5 text-primary hover:bg-primary/15",
        // Location type variants
        conus: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20",
        oconus: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20",
        // Theater-specific variants
        centcom: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
        eucom: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
        indopacom: "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-400",
        africom: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400",
        southcom: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export type BadgeVariants = VariantProps<typeof badgeVariants>
