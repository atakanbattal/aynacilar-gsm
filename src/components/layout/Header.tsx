"use client"

import { Bell, Menu, Search } from "lucide-react"

interface HeaderProps {
    title?: string
    showSearch?: boolean
}

export function Header({ title = "Hoş Geldiniz", showSearch = true }: HeaderProps) {
    return (
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-center gap-4">
                <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden dark:hover:bg-slate-800">
                    <Menu className="h-5 w-5" />
                </button>
                <h2 className="hidden text-lg font-bold text-slate-800 sm:block dark:text-white">
                    {title}
                </h2>
            </div>

            <div className="flex flex-1 items-center justify-end gap-4">
                {/* Search */}
                {showSearch && (
                    <div className="relative hidden w-full max-w-md md:block">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Ürünleri, siparişleri ara..."
                            className="w-full rounded-lg border-none bg-slate-100 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#135bec]/50 dark:bg-slate-800 dark:text-white"
                        />
                    </div>
                )}

                {/* Notifications */}
                <button className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500 dark:border-slate-900" />
                </button>
            </div>
        </header>
    )
}
