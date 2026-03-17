"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { BayiSidebar } from "@/components/layout/BayiSidebar"
import { Header } from "@/components/layout/Header"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export default function BayiLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, profile, loading, isAdmin } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push("/giris")
        } else if (!loading && user && isAdmin) {
            router.push("/yonetim")
        }
    }, [user, loading, isAdmin, router])

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

    if (!user || isAdmin) {
        return null
    }

    const displayName = profile?.full_name || user.email?.split("@")[0] || "Kullanıcı"

    return (
        <div className="flex h-screen overflow-hidden bg-[#f6f6f8] dark:bg-[#101622]">
            <BayiSidebar />
            <main className="relative flex flex-1 flex-col overflow-hidden">
                <Header title={`Hoş Geldiniz, ${displayName}`} />
                <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                    {children}
                </div>
            </main>
        </div>
    )
}
