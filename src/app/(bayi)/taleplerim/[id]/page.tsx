"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import {
    ArrowLeft,
    Download,
    Flag,
    Truck,
    Check,
    Package,
    Clock,
    Copy,
    Loader2,
} from "lucide-react"

interface RequestItem {
    id: string
    quantity: number
    unit_price: number
    products: {
        name: string
        sku: string
        images: string[]
    } | null
}

interface RequestData {
    id: string
    request_number: string
    status: string
    total_amount: number
    notes: string | null
    created_at: string
    approved_at: string | null
    shipped_at: string | null
    delivered_at: string | null
    request_items: RequestItem[]
}

const statusLabels: Record<string, string> = {
    pending: "Beklemede",
    approved: "Onaylandı",
    preparing: "Hazırlanıyor",
    shipping: "Sevkiyatta",
    delivered: "Teslim Edildi",
    rejected: "Reddedildi",
}

const statusVariants: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
    pending: "warning",
    approved: "success",
    preparing: "info",
    shipping: "info",
    delivered: "success",
    rejected: "danger",
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 2,
    }).format(price)
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

export default function TalepDetayPage() {
    const params = useParams()
    const id = params.id as string
    const [request, setRequest] = useState<RequestData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) {
            fetchRequest()
        }
    }, [id])

    const fetchRequest = async () => {
        try {
            const { data, error } = await supabase
                .from("requests")
                .select(`
                    id,
                    request_number,
                    status,
                    total_amount,
                    notes,
                    created_at,
                    approved_at,
                    shipped_at,
                    delivered_at,
                    request_items (
                        id,
                        quantity,
                        unit_price,
                        products (
                            name,
                            sku,
                            images
                        )
                    )
                `)
                .eq("id", id)
                .single()

            if (error) throw error
            setRequest(data as unknown as RequestData)
        } catch (error) {
            console.error("Error fetching request:", error)
        } finally {
            setLoading(false)
        }
    }

    const getTimeline = () => {
        if (!request) return []

        const steps = [
            {
                step: 1,
                title: "Talep Oluşturuldu",
                date: request.created_at ? formatDate(request.created_at) : "",
                completed: true
            },
            {
                step: 2,
                title: "Onaylandı",
                date: request.approved_at ? formatDate(request.approved_at) : "Bekleniyor",
                completed: !!request.approved_at,
                current: request.status === "pending"
            },
            {
                step: 3,
                title: "Hazırlanıyor",
                date: request.status === "preparing" ? "Devam Ediyor" : (request.shipped_at ? formatDate(request.shipped_at) : "Bekleniyor"),
                completed: ["shipping", "delivered"].includes(request.status),
                current: request.status === "preparing"
            },
            {
                step: 4,
                title: "Teslim Edildi",
                date: request.delivered_at ? formatDate(request.delivered_at) : "Bekleniyor",
                completed: request.status === "delivered",
                current: request.status === "shipping"
            },
        ]
        return steps
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#135bec]" />
            </div>
        )
    }

    if (!request) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <p className="text-lg text-slate-500">Talep bulunamadı</p>
                <Link href="/taleplerim" className="mt-4 text-[#135bec] hover:underline">
                    Taleplerime Dön
                </Link>
            </div>
        )
    }

    const timeline = getTimeline()
    const subtotal = request.request_items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0
    const vat = subtotal * 0.20

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/taleplerim"
                            className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl dark:text-white">
                            Talep #{request.request_number}
                        </h1>
                        <Badge variant={statusVariants[request.status] || "default"}>
                            {statusLabels[request.status] || request.status}
                        </Badge>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {formatDate(request.created_at)} tarihinde oluşturuldu
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline">
                        <Flag className="h-4 w-4" />
                        <span>Sorun Bildir</span>
                    </Button>
                    <Button onClick={() => window.print()}>
                        <Download className="h-4 w-4" />
                        <span>PDF İndir</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Main Column */}
                <div className="flex flex-col gap-6 lg:col-span-8">
                    {/* Timeline Card */}
                    <Card className="p-6">
                        <h3 className="mb-6 text-lg font-bold text-slate-900 dark:text-white">
                            Sipariş Durumu
                        </h3>

                        <div className="relative flex w-full items-start justify-between">
                            {/* Connecting Line Background */}
                            <div className="absolute left-0 top-[15px] -z-0 h-0.5 w-full bg-slate-200 dark:bg-slate-700" />

                            {timeline.map((step, index) => (
                                <div
                                    key={step.step}
                                    className="relative z-10 flex w-1/4 flex-col items-center gap-3"
                                >
                                    {/* Active connecting line */}
                                    {step.completed && index > 0 && (
                                        <div className="absolute right-1/2 top-[15px] -z-10 h-0.5 w-full bg-green-500" />
                                    )}

                                    {/* Step Circle */}
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${step.completed
                                            ? "bg-green-500 text-white"
                                            : step.current
                                                ? "bg-[#135bec] text-white shadow-lg shadow-blue-500/30"
                                                : "bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                                            }`}
                                    >
                                        {step.completed ? (
                                            <Check className="h-4 w-4" />
                                        ) : step.current ? (
                                            <Package className="h-4 w-4" />
                                        ) : (
                                            <Clock className="h-4 w-4" />
                                        )}
                                    </div>

                                    {/* Step Info */}
                                    <div className="text-center">
                                        <p
                                            className={`text-sm font-bold ${step.current
                                                ? "text-[#135bec]"
                                                : step.completed
                                                    ? "text-slate-900 dark:text-white"
                                                    : "text-slate-500 dark:text-slate-400"
                                                }`}
                                        >
                                            {step.title}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                            {step.date}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Items Table */}
                    <Card className="flex h-full flex-col overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Sipariş Kalemleri
                            </h3>
                            <span className="text-sm font-medium text-slate-500">
                                {request.request_items?.length || 0} Kalem
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Ürün Detayları
                                        </th>
                                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            SKU
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Adet
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Birim Fiyat
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Ara Toplam
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {request.request_items?.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                                                        {item.products?.images?.[0] ? (
                                                            <Image
                                                                src={item.products.images[0]}
                                                                alt={item.products?.name || ""}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center">
                                                                <Package className="h-6 w-6 text-slate-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                            {item.products?.name || "Ürün bulunamadı"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-sm font-medium text-slate-600 dark:text-slate-300">
                                                {item.products?.sku || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium text-slate-900 dark:text-white">
                                                {item.quantity}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-400">
                                                {formatPrice(item.unit_price)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">
                                                {formatPrice(item.quantity * item.unit_price)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                                        <td
                                            colSpan={4}
                                            className="px-6 py-3 text-right text-sm text-slate-500 dark:text-slate-400"
                                        >
                                            Ara Toplam
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm font-medium text-slate-900 dark:text-white">
                                            {formatPrice(subtotal)}
                                        </td>
                                    </tr>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                                        <td
                                            colSpan={4}
                                            className="px-6 py-3 text-right text-sm text-slate-500 dark:text-slate-400"
                                        >
                                            KDV (%20)
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm font-medium text-slate-900 dark:text-white">
                                            {formatPrice(vat)}
                                        </td>
                                    </tr>
                                    <tr className="border-t border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                                        <td
                                            colSpan={4}
                                            className="px-6 py-4 text-right text-base font-bold text-slate-900 dark:text-white"
                                        >
                                            Genel Toplam
                                        </td>
                                        <td className="px-6 py-4 text-right text-xl font-black text-[#135bec]">
                                            {formatPrice(request.total_amount)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="flex flex-col gap-6 lg:col-span-4">
                    {/* Request Info */}
                    <Card className="p-6">
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                            <Truck className="h-5 w-5 text-[#135bec]" />
                            Talep Bilgileri
                        </h3>

                        <div className="space-y-4">
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Talep No
                                </p>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-[#135bec]">
                                        #{request.request_number}
                                    </p>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(request.request_number)}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {request.notes && (
                                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Notlar
                                    </p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                        {request.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
