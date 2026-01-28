"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Eye, Loader2, ShoppingBag, Plus } from "lucide-react"

interface Request {
    id: string
    request_number: string
    status: string
    total_amount: number
    notes: string | null
    created_at: string
    request_items?: {
        quantity: number
        products: {
            name: string
        } | null
    }[]
}

const statusVariants: Record<string, "warning" | "success" | "info" | "danger" | "default"> = {
    pending: "warning",
    approved: "success",
    preparing: "info",
    shipping: "info",
    delivered: "success",
    rejected: "danger",
}

const statusLabels: Record<string, string> = {
    pending: "Beklemede",
    approved: "Onaylandı",
    preparing: "Hazırlanıyor",
    shipping: "Sevkiyatta",
    delivered: "Teslim Edildi",
    rejected: "Reddedildi",
}

export default function TaleplerimPage() {
    const { user } = useAuth()
    const [requests, setRequests] = useState<Request[]>([])
    const [loading, setLoading] = useState(true)
    const [dealerId, setDealerId] = useState<string | null>(null)

    useEffect(() => {
        if (user) {
            fetchDealerAndRequests()
        }
    }, [user])

    const fetchDealerAndRequests = async () => {
        try {
            setLoading(true)

            // First get the dealer id for the current user
            const { data: dealerData, error: dealerError } = await supabase
                .from("dealers")
                .select("id")
                .eq("user_id", user?.id)
                .single()

            if (dealerError || !dealerData) {
                console.error("Dealer not found:", dealerError)
                setLoading(false)
                return
            }

            setDealerId(dealerData.id)

            // Then fetch requests for this dealer
            const { data, error } = await supabase
                .from("requests")
                .select(`
                    id,
                    request_number,
                    status,
                    total_amount,
                    notes,
                    created_at,
                    request_items (
                        quantity,
                        products (
                            name
                        )
                    )
                `)
                .eq("dealer_id", dealerData.id)
                .order("created_at", { ascending: false })

            if (error) throw error
            setRequests((data || []) as unknown as Request[])
        } catch (error) {
            console.error("Error fetching requests:", error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
        }).format(amount)
    }

    const getProductSummary = (items?: Request["request_items"]) => {
        if (!items || items.length === 0) return "Ürün yok"
        const firstProduct = items[0]?.products?.name || "Ürün"
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
        if (items.length === 1) {
            return `${firstProduct} (${totalQuantity} adet)`
        }
        return `${firstProduct} +${items.length - 1} ürün daha`
    }

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#135bec]" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Taleplerim
                    </h2>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">
                        Tüm satın alma taleplerinizi görüntüleyin ve takip edin.
                    </p>
                </div>
                <Link href="/katalog">
                    <Button>
                        <Plus className="h-4 w-4" />
                        Yeni Talep Oluştur
                    </Button>
                </Link>
            </div>

            {/* Table or Empty State */}
            {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        <ShoppingBag className="h-8 w-8 text-slate-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Henüz talep oluşturmadınız
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Katalogdan ürün seçerek ilk talebinizi oluşturun
                        </p>
                    </div>
                    <Link href="/katalog">
                        <Button>
                            <Plus className="h-4 w-4" />
                            Kataloga Git
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                    <th className="px-6 py-4">Talep No</th>
                                    <th className="px-6 py-4">Tarih</th>
                                    <th className="px-6 py-4">Ürün Özeti</th>
                                    <th className="px-6 py-4">Durum</th>
                                    <th className="px-6 py-4 text-right">Toplam Tutar</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
                                {requests.map((request) => (
                                    <tr
                                        key={request.id}
                                        className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    >
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                            #{request.request_number}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                            {formatDate(request.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                            {getProductSummary(request.request_items)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={statusVariants[request.status] || "default"} dot>
                                                {statusLabels[request.status] || request.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white">
                                            {formatCurrency(request.total_amount)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/taleplerim/${request.id}`}
                                                className="text-slate-400 transition-colors hover:text-[#135bec]"
                                            >
                                                <Eye className="h-5 w-5" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
