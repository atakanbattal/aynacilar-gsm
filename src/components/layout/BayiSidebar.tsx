"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import {
    LayoutDashboard,
    ShoppingBag,
    FileText,
    Settings,
    LogOut,
    Store,
} from "lucide-react"

const menuItems = [
    {
        title: "Panel",
        href: "/panel",
        icon: LayoutDashboard,
    },
    {
        title: "Ürün Kataloğu",
        href: "/katalog",
        icon: ShoppingBag,
    },
    {
        title: "Taleplerim",
        href: "/taleplerim",
        icon: FileText,
    },
    {
        title: "Hesap Ayarları",
        href: "/hesap",
        icon: Settings,
    },
]

export function BayiSidebar() {
    const pathname = usePathname()
    const { user, profile, signOut } = useAuth()
    const router = useRouter()

    const handleSignOut = async () => {
        await signOut()
        router.push("/giris")
    }

    const displayName = profile?.full_name || user?.email?.split("@")[0] || "Kullanıcı"
    const displayEmail = user?.email || ""

    return (
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex">
            {/* Logo */}
            <div className="flex items-center gap-3 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#135bec]/10">
                    <Store className="h-6 w-6 text-[#135bec]" />
                </div>
                <div>
                    <h1 className="text-lg font-bold leading-tight text-slate-900 dark:text-white">
                        Teknomarket Aynacılar GSM
                    </h1>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Bayi Portalı
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-4 py-4">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-[#135bec]/10 text-[#135bec]"
                                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {item.title}
                        </Link>
                    )
                })}
            </nav>

            {/* User Info */}
            <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <div
                        className="h-10 w-10 rounded-full bg-slate-200 bg-cover bg-center dark:bg-slate-700"
                        style={{
                            backgroundImage: `url('https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=135bec&color=fff')`,
                        }}
                    />
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {displayName}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {displayEmail}
                        </p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Çıkış Yap"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </aside>
    )
}
