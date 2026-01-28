"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import {
    BarChart3,
    TrendingUp,
    Users,
    Package,
    FileText,
    Download,
    Calendar,
    ArrowUpRight,
    Loader2,
} from "lucide-react"

interface DealerStats {
    dealer_id: string
    company_name: string
    order_count: number
    total_revenue: number
}

interface ProductStats {
    product_id: string
    product_name: string
    total_quantity: number
    total_revenue: number
}

interface Stats {
    totalRevenue: number
    activeDealers: number
    completedRequests: number
    averageOrderValue: number
}

function formatCurrency(amount: number): string {
    if (amount >= 1000000) {
        return `₺${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
        return `₺${(amount / 1000).toFixed(0)}K`
    }
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 0,
    }).format(amount)
}

function formatFullCurrency(amount: number): string {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 0,
    }).format(amount)
}

export default function RaporlarPage() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<Stats>({
        totalRevenue: 0,
        activeDealers: 0,
        completedRequests: 0,
        averageOrderValue: 0,
    })
    const [topDealers, setTopDealers] = useState<DealerStats[]>([])
    const [topProducts, setTopProducts] = useState<ProductStats[]>([])

    useEffect(() => {
        fetchAllData()
    }, [])

    const fetchAllData = async () => {
        try {
            setLoading(true)
            await Promise.all([
                fetchStats(),
                fetchTopDealers(),
                fetchTopProducts(),
            ])
        } catch (error) {
            console.error("Error fetching report data:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        // Get total revenue from approved/shipped/delivered requests
        const { data: revenueData } = await supabase
            .from("requests")
            .select("total_amount, status")
            .in("status", ["approved", "preparing", "shipping", "delivered"])

        const totalRevenue = revenueData?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0

        // Get active dealers count
        const { count: activeDealers } = await supabase
            .from("dealers")
            .select("*", { count: "exact", head: true })
            .eq("status", "active")

        // Get completed requests count (delivered)
        const { count: completedRequests } = await supabase
            .from("requests")
            .select("*", { count: "exact", head: true })
            .eq("status", "delivered")

        // Calculate average order value
        const { data: allRequests } = await supabase
            .from("requests")
            .select("total_amount")
            .in("status", ["approved", "preparing", "shipping", "delivered"])

        const avgOrder = allRequests && allRequests.length > 0
            ? allRequests.reduce((sum, r) => sum + Number(r.total_amount), 0) / allRequests.length
            : 0

        setStats({
            totalRevenue,
            activeDealers: activeDealers || 0,
            completedRequests: completedRequests || 0,
            averageOrderValue: avgOrder,
        })
    }

    const fetchTopDealers = async () => {
        // Get requests with dealer info and calculate totals
        const { data: requests } = await supabase
            .from("requests")
            .select(`
                dealer_id,
                total_amount,
                status,
                dealers (
                    company_name
                )
            `)
            .in("status", ["approved", "preparing", "shipping", "delivered"])

        if (!requests) {
            setTopDealers([])
            return
        }

        // Aggregate by dealer
        const dealerMap = new Map<string, DealerStats>()

        requests.forEach((req: any) => {
            const dealerId = req.dealer_id
            const existing = dealerMap.get(dealerId)

            if (existing) {
                existing.order_count += 1
                existing.total_revenue += Number(req.total_amount)
            } else {
                dealerMap.set(dealerId, {
                    dealer_id: dealerId,
                    company_name: req.dealers?.company_name || "Bilinmeyen Bayi",
                    order_count: 1,
                    total_revenue: Number(req.total_amount),
                })
            }
        })

        // Sort by revenue and take top 5
        const sorted = Array.from(dealerMap.values())
            .sort((a, b) => b.total_revenue - a.total_revenue)
            .slice(0, 5)

        setTopDealers(sorted)
    }

    const fetchTopProducts = async () => {
        // Get request items with product info
        const { data: items } = await supabase
            .from("request_items")
            .select(`
                product_id,
                quantity,
                total_price,
                products (
                    name
                ),
                requests!inner (
                    status
                )
            `)

        if (!items) {
            setTopProducts([])
            return
        }

        // Filter only items from approved requests and aggregate by product
        const productMap = new Map<string, ProductStats>()

        items.forEach((item: any) => {
            if (!["approved", "preparing", "shipping", "delivered"].includes(item.requests?.status)) {
                return
            }

            const productId = item.product_id
            const existing = productMap.get(productId)

            if (existing) {
                existing.total_quantity += item.quantity
                existing.total_revenue += Number(item.total_price)
            } else {
                productMap.set(productId, {
                    product_id: productId,
                    product_name: item.products?.name || "Bilinmeyen Ürün",
                    total_quantity: item.quantity,
                    total_revenue: Number(item.total_price),
                })
            }
        })

        // Sort by revenue and take top 5
        const sorted = Array.from(productMap.values())
            .sort((a, b) => b.total_revenue - a.total_revenue)
            .slice(0, 5)

        setTopProducts(sorted)
    }

    const statsDisplay = [
        {
            title: "Toplam Satış",
            value: formatCurrency(stats.totalRevenue),
            icon: TrendingUp,
        },
        {
            title: "Aktif Bayi",
            value: stats.activeDealers.toString(),
            icon: Users,
        },
        {
            title: "Tamamlanan Talep",
            value: stats.completedRequests.toString(),
            icon: FileText,
        },
        {
            title: "Ortalama Sipariş",
            value: formatCurrency(stats.averageOrderValue),
            icon: Package,
        },
    ]

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#135bec]" />
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-auto p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Raporlar
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Satış ve performans analizleri
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline">
                        <Calendar className="h-4 w-4" />
                        Tüm Zamanlar
                    </Button>
                    <Button>
                        <Download className="h-4 w-4" />
                        Rapor İndir
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {statsDisplay.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Card key={stat.title} className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="rounded-lg bg-[#135bec]/10 p-2">
                                    <Icon className="h-5 w-5 text-[#135bec]" />
                                </div>
                                <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                                    <ArrowUpRight className="h-4 w-4" />
                                </span>
                            </div>
                            <p className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
                                {stat.value}
                            </p>
                            <p className="text-sm text-slate-500">{stat.title}</p>
                        </Card>
                    )
                })}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Top Dealers */}
                <Card className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                            <Users className="h-5 w-5 text-[#135bec]" />
                            En Aktif Bayiler
                        </h3>
                    </div>
                    {topDealers.length === 0 ? (
                        <p className="py-8 text-center text-slate-500">Henüz onaylanan sipariş bulunmuyor</p>
                    ) : (
                        <div className="space-y-4">
                            {topDealers.map((dealer, i) => (
                                <div
                                    key={dealer.dealer_id}
                                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3 dark:border-slate-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            {i + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                {dealer.company_name}
                                            </p>
                                            <p className="text-xs text-slate-500">{dealer.order_count} sipariş</p>
                                        </div>
                                    </div>
                                    <span className="font-semibold text-[#135bec]">{formatFullCurrency(dealer.total_revenue)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Top Products */}
                <Card className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                            <BarChart3 className="h-5 w-5 text-[#135bec]" />
                            En Çok Satan Ürünler
                        </h3>
                    </div>
                    {topProducts.length === 0 ? (
                        <p className="py-8 text-center text-slate-500">Henüz satış verisi bulunmuyor</p>
                    ) : (
                        <div className="space-y-4">
                            {topProducts.map((product, i) => (
                                <div
                                    key={product.product_id}
                                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3 dark:border-slate-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            {i + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                {product.product_name}
                                            </p>
                                            <p className="text-xs text-slate-500">{product.total_quantity} adet</p>
                                        </div>
                                    </div>
                                    <span className="font-semibold text-green-600">{formatFullCurrency(product.total_revenue)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
