"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import {
    LayoutDashboard,
    Users,
    Package,
    FileText,
    BarChart3,
    Settings,
    LogOut,
    Grid3X3,
    Loader2,
    Bell,
} from "lucide-react"

const menuItems = [
    { title: "Dashboard", href: "/yonetim", icon: LayoutDashboard },
    { title: "Bayiler", href: "/yonetim/bayiler", icon: Users },
    { title: "Ürünler", href: "/yonetim/urunler", icon: Package },
    { title: "Talepler", href: "/yonetim/talepler", icon: FileText },
    { title: "Duyurular", href: "/yonetim/duyurular", icon: Bell },
    { title: "Raporlar", href: "/yonetim/raporlar", icon: BarChart3 },
]

const systemItems = [
    { title: "Ayarlar", href: "/yonetim/ayarlar", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, profile, loading, signOut, isAdmin } = useAuth()

    useEffect(() => {
        if (!loading && !user) {
            router.push("/giris")
        } else if (!loading && user && profile && !isAdmin) {
            // Bayi kullanıcısı admin paneline erişemez
            router.push("/panel")
        }
    }, [user, profile, loading, isAdmin, router])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f6f6f8] dark:bg-[#101622]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-[#135bec]" />
                    <p className="text-slate-500">Yükleniyor...</p>
                </div>
            </div>
        )
    }

    if (!user || !isAdmin) {
        return null
    }

    const handleSignOut = async () => {
        await signOut()
        router.push("/giris")
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#f6f6f8] dark:bg-[#101622]">
            {/* Sidebar */}
            <div className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white md:flex dark:border-slate-800 dark:bg-[#1a2234]">
                {/* Logo */}
                <div className="flex items-center gap-3 p-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#135bec]/10">
                        <Grid3X3 className="h-6 w-6 text-[#135bec]" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-base font-bold leading-tight text-slate-900 dark:text-white">
                            Aynacılar GSM
                        </h1>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Admin Portalı
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-2">
                    {menuItems.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/yonetim" && pathname.startsWith(item.href))
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-[#135bec] text-white shadow-md shadow-[#135bec]/20"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-[#135bec] dark:text-slate-400 dark:hover:bg-slate-800"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {item.title}
                            </Link>
                        )
                    })}

                    <div className="pb-2 pt-4">
                        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Sistem
                        </p>
                    </div>

                    {systemItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-[#135bec] text-white shadow-md shadow-[#135bec]/20"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-[#135bec] dark:text-slate-400 dark:hover:bg-slate-800"
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
                    <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
                        <div
                            className="h-8 w-8 rounded-full bg-slate-200 bg-cover bg-center dark:bg-slate-700"
                            style={{
                                backgroundImage: `url('https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || "Admin")}&background=135bec&color=fff')`,
                            }}
                        />
                        <div className="flex flex-col overflow-hidden">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                {profile?.full_name || "Admin"}
                            </p>
                            <p className="truncate text-xs text-slate-500">{user.email}</p>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title="Çıkış Yap"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="relative flex h-full flex-1 flex-col overflow-hidden">
                {children}
            </main>
        </div>
    )
}
