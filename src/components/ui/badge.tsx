import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
    {
        variants: {
            variant: {
                default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                primary: "bg-[#135bec]/10 text-[#135bec] dark:bg-[#135bec]/20",
                success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
    dot?: boolean
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
    return (
        <span className={cn(badgeVariants({ variant }), className)} {...props}>
            {dot && (
                <span
                    className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        variant === "success" && "bg-emerald-500",
                        variant === "warning" && "bg-amber-500",
                        variant === "danger" && "bg-red-500",
                        variant === "info" && "bg-blue-500",
                        variant === "primary" && "bg-[#135bec]",
                        variant === "default" && "bg-slate-500"
                    )}
                />
            )}
            {children}
        </span>
    )
}

export { Badge, badgeVariants }
