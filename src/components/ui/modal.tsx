"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    size?: "sm" | "md" | "lg" | "xl"
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
    // Use a ref for the callback to prevent the effect from re-running on every render
    // if the onClose prop function identity changes
    const onCloseRef = React.useRef(onClose)

    React.useEffect(() => {
        onCloseRef.current = onClose
    }, [onClose])

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onCloseRef.current()
            }
        }

        if (isOpen) {
            document.body.style.overflow = "hidden"
            document.addEventListener("keydown", handleKeyDown)
        } else {
            document.body.style.overflow = "unset"
            document.removeEventListener("keydown", handleKeyDown)
        }
        return () => {
            document.body.style.overflow = "unset"
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [isOpen])

    if (!isOpen) return null

    const sizeClasses = {
        sm: "w-[95%] sm:max-w-md",
        md: "w-[95%] sm:max-w-lg",
        lg: "w-[95%] sm:max-w-2xl",
        xl: "w-[95%] sm:max-w-4xl",
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={cn(
                    "relative z-10 w-full rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800",
                    sizeClasses[size],
                    "max-h-[90vh] overflow-hidden"
                )}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-700">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-4 sm:p-6">
                    {children}
                </div>
            </div>
        </div>
    )
}
