"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import {
    Users,
    Package,
    FileText,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { formatPrice } from "@/lib/utils/formatters"
import { ACTIVE_REQUEST_STATUSES, LOW_STOCK_THRESHOLD } from "@/lib/constants"

interface LowStockProduct {
    id: string
    name: string
    sku: string
    stock_quantity: number
}

interface KPIData {
    totalDealers: number
    activeProducts: number
    pendingRequests: number
    monthlyRevenue: number
}

export default function AdminDashboardPage() {
    const [kpiData, setKpiData] = useState<KPIData>({
        totalDealers: 0,
        activeProducts: 0,
        pendingRequests: 0,
        monthlyRevenue: 0,
    })
    const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            // Fetch total dealers
            const { count: dealerCount } = await supabase
                .from("dealers")
                .select("*", { count: "exact", head: true })
                .eq("status", "active")

            // Fetch active products
            const { count: productCount } = await supabase
                .from("products")
                .select("*", { count: "exact", head: true })
                .eq("status", "active")

            // Fetch pending requests
            const { count: pendingCount } = await supabase
                .from("requests")
                .select("*", { count: "exact", head: true })
                .eq("status", "pending")

            // Fetch monthly revenue
            const startOfMonth = new Date()
            startOfMonth.setDate(1)
            startOfMonth.setHours(0, 0, 0, 0)

            const { data: revenueData } = await supabase
                .from("requests")
                .select("total_amount")
                .in("status", ACTIVE_REQUEST_STATUSES)
                .gte("created_at", startOfMonth.toISOString())

            const monthlyRevenue = revenueData?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0

            // Fetch low stock products
            const { data: lowStock } = await supabase
                .from("products")
                .select("id, name, sku, stock_quantity")
                .lt("stock_quantity", LOW_STOCK_THRESHOLD)
                .eq("status", "active")
                .order("stock_quantity", { ascending: true })
                .limit(5)

            setKpiData({
                totalDealers: dealerCount || 0,
                activeProducts: productCount || 0,
                pendingRequests: pendingCount || 0,
                monthlyRevenue,
            })
            setLowStockProducts(lowStock || [])
        } catch (error) {
            console.error("Dashboard fetch error:", error)
        } finally {
            setLoading(false)
        }
    }

    const kpiCards = [
        {
            title: "Toplam Bayi",
            value: kpiData.totalDealers.toString(),
            icon: Users,
            iconBg: "bg-blue-100 dark:bg-blue-900/30",
            iconColor: "text-[#135bec]",
            href: "/yonetim/bayiler",
        },
        {
            title: "Aktif Ürün",
            value: kpiData.activeProducts.toString(),
            icon: Package,
            iconBg: "bg-green-100 dark:bg-green-900/30",
            iconColor: "text-green-600",
            href: "/yonetim/urunler",
        },
        {
            title: "Bekleyen Talep",
            value: kpiData.pendingRequests.toString(),
            icon: Clock,
            iconBg: "bg-orange-100 dark:bg-orange-900/30",
            iconColor: "text-orange-600",
            href: "/yonetim/talepler?status=pending",
        },
        {
            title: "Bu Ay Ciro",
            value: formatPrice(kpiData.monthlyRevenue),
            icon: TrendingUp,
            iconBg: "bg-purple-100 dark:bg-purple-900/30",
            iconColor: "text-purple-600",
            href: "/yonetim/raporlar",
        },
    ]

    return (
        <div className="flex-1 overflow-auto p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Yönetim Paneli
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                    Hoş geldiniz! İşte bugünkü genel durumunuz.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {kpiCards.map((kpi) => {
                    const Icon = kpi.icon
                    return (
                        <Link key={kpi.title} href={kpi.href}>
                            <Card className="p-6 transition-all hover:shadow-lg hover:border-[#135bec]/30">
                                <div className="flex items-center gap-4">
                                    <div className={`rounded-lg p-3 ${kpi.iconBg}`}>
                                        <Icon className={`h-6 w-6 ${kpi.iconColor}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {kpi.title}
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {loading ? "..." : kpi.value}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    )
                })}
            </div>

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
                <Card className="mb-6 border-amber-200 bg-amber-50 p-6 dark:border-amber-900/30 dark:bg-amber-900/10">
                    <div className="mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <h3 className="text-lg font-bold text-amber-800 dark:text-amber-400">
                            Düşük Stok Uyarısı
                        </h3>
                    </div>
                    <div className="space-y-2">
                        {lowStockProducts.map((product) => (
                            <Link
                                key={product.id}
                                href={`/yonetim/urunler`}
                                className="flex items-center justify-between rounded-lg bg-white p-3 transition-colors hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                            >
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        {product.name}
                                    </p>
                                    <p className="text-sm text-slate-500">{product.sku}</p>
                                </div>
                                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${product.stock_quantity === 0
                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                    }`}>
                                    {product.stock_quantity === 0 ? "Stokta Yok" : `${product.stock_quantity} adet`}
                                </span>
                            </Link>
                        ))}
                    </div>
                </Card>
            )}

            {/* Quick Actions */}
            <Card className="p-6">
                <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
                    Hızlı İşlemler
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Link
                        href="/yonetim/urunler"
                        className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-4 transition-colors hover:border-[#135bec] hover:bg-[#135bec]/5 dark:border-slate-700"
                    >
                        <Package className="h-8 w-8 text-[#135bec]" />
                        <span className="text-sm font-medium">Ürün Ekle</span>
                    </Link>
                    <Link
                        href="/yonetim/talepler"
                        className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-4 transition-colors hover:border-[#135bec] hover:bg-[#135bec]/5 dark:border-slate-700"
                    >
                        <FileText className="h-8 w-8 text-[#135bec]" />
                        <span className="text-sm font-medium">Talepleri Gör</span>
                    </Link>
                    <Link
                        href="/yonetim/bayiler"
                        className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-4 transition-colors hover:border-[#135bec] hover:bg-[#135bec]/5 dark:border-slate-700"
                    >
                        <Users className="h-8 w-8 text-[#135bec]" />
                        <span className="text-sm font-medium">Bayi Ekle</span>
                    </Link>
                    <Link
                        href="/yonetim/raporlar"
                        className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-4 transition-colors hover:border-[#135bec] hover:bg-[#135bec]/5 dark:border-slate-700"
                    >
                        <TrendingUp className="h-8 w-8 text-[#135bec]" />
                        <span className="text-sm font-medium">Raporlar</span>
                    </Link>
                </div>
            </Card>
        </div>
    )
}
