"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { supabase } from "@/lib/supabase/client"
import {
    Search,
    Calendar,
    Filter,
    Download,
    Eye,
    FileText,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Loader2,
    Check,
    X,
} from "lucide-react"

interface Request {
    id: string
    request_number: string
    dealer_id: string
    status: string
    total_amount: number
    notes: string | null
    created_at: string
    dealers: {
        company_name: string
        users: {
            full_name: string
        } | null
    } | null
}

const statusOptions = ["pending", "approved", "preparing", "shipping", "delivered", "rejected"]
const statusLabels: Record<string, string> = {
    pending: "Beklemede",
    approved: "Onaylandı",
    preparing: "Hazırlanıyor",
    shipping: "Sevkiyatta",
    delivered: "Teslim Edildi",
    rejected: "Reddedildi",
}
const statusStyles: Record<string, string> = {
    pending: "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-700/30 dark:text-yellow-400",
    approved: "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700/30 dark:text-green-400",
    preparing: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-700/30 dark:text-purple-400",
    shipping: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700/30 dark:text-blue-400",
    delivered: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700/30 dark:text-emerald-400",
    rejected: "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-700/30 dark:text-red-400",
}

export default function AdminTaleplerPage() {
    const [requests, setRequests] = useState<Request[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [bulkLoading, setBulkLoading] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

    useEffect(() => {
        fetchRequests()
    }, [statusFilter])

    const fetchRequests = async () => {
        try {
            setLoading(true)
            let query = supabase
                .from("requests")
                .select(`
                    id,
                    request_number,
                    dealer_id,
                    status,
                    total_amount,
                    notes,
                    created_at,
                    dealers (
                        company_name,
                        users (
                            full_name
                        )
                    )
                `)
                .order("created_at", { ascending: false })

            if (statusFilter) {
                query = query.eq("status", statusFilter)
            }

            const { data, error } = await query

            if (error) throw error
            // Transform nested data from Supabase
            const mappedData = (data || []).map((r: any) => ({
                id: r.id,
                request_number: r.request_number,
                dealer_id: r.dealer_id,
                status: r.status,
                total_amount: r.total_amount,
                notes: r.notes,
                created_at: r.created_at,
                dealers: r.dealers ? {
                    company_name: r.dealers.company_name,
                    users: r.dealers.users
                } : null
            })) as Request[]
            setRequests(mappedData)
        } catch (error) {
            console.error("Error fetching requests:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (requestId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from("requests")
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString(),
                    ...(newStatus === "approved" && { approved_at: new Date().toISOString() }),
                    ...(newStatus === "shipping" && { shipped_at: new Date().toISOString() }),
                    ...(newStatus === "delivered" && { delivered_at: new Date().toISOString() }),
                })
                .eq("id", requestId)

            if (error) throw error

            // Refresh list
            fetchRequests()
        } catch (error) {
            console.error("Error updating status:", error)
            alert("Durum güncellenirken hata oluştu")
        }
    }

    // Bulk actions
    const toggleSelectAll = () => {
        if (selectedIds.length === filteredRequests.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredRequests.map(r => r.id))
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleBulkApprove = async () => {
        if (selectedIds.length === 0) return
        if (!confirm(`${selectedIds.length} talebi onaylamak istediğinize emin misiniz?`)) return

        setBulkLoading(true)
        try {
            const { error } = await supabase
                .from("requests")
                .update({
                    status: "approved",
                    approved_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .in("id", selectedIds)

            if (error) throw error

            setSelectedIds([])
            fetchRequests()
        } catch (error) {
            console.error("Bulk approve error:", error)
            alert("Toplu onaylama sırasında hata oluştu")
        } finally {
            setBulkLoading(false)
        }
    }

    const handleBulkReject = async () => {
        if (selectedIds.length === 0) return
        if (!confirm(`${selectedIds.length} talebi reddetmek istediğinize emin misiniz?`)) return

        setBulkLoading(true)
        try {
            const { error } = await supabase
                .from("requests")
                .update({
                    status: "rejected",
                    updated_at: new Date().toISOString(),
                })
                .in("id", selectedIds)

            if (error) throw error

            setSelectedIds([])
            fetchRequests()
        } catch (error) {
            console.error("Bulk reject error:", error)
            alert("Toplu reddetme sırasında hata oluştu")
        } finally {
            setBulkLoading(false)
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

    const filteredRequests = requests.filter((req) => {
        if (!searchQuery) return true
        const searchLower = searchQuery.toLowerCase()
        return (
            req.request_number?.toLowerCase().includes(searchLower) ||
            req.dealers?.company_name?.toLowerCase().includes(searchLower)
        )
    })

    return (
        <>
            {/* Header */}
            <header className="z-10 shrink-0 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#1a2234]">
                <div className="flex flex-col gap-5 px-6 py-5">
                    {/* Title & Action */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="mb-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                <span>Dashboard</span>
                                <ChevronRight className="h-3 w-3" />
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                    Talepler
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Talep Yönetimi
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Tüm bayi ürün taleplerini tek yerden yönetin ve takip edin.
                            </p>
                        </div>
                        <Button>
                            <Download className="h-4 w-4" />
                            Excel&apos;e Aktar
                        </Button>
                    </div>

                    {/* Filter Toolbar */}
                    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-center md:justify-between dark:border-slate-700 dark:bg-slate-800/50">
                        <div className="flex flex-1 flex-col gap-3 md:flex-row">
                            {/* Search */}
                            <div className="relative min-w-[240px] flex-1">
                                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Bayi Adı veya Talep No ile Ara..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {/* Date Filter */}
                            <div className="relative min-w-[200px]">
                                <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <select className="h-12 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-8 text-sm text-slate-700 focus:border-[#135bec] focus:outline-none focus:ring-2 focus:ring-[#135bec]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                    <option>Son 30 Gün</option>
                                    <option>Bu Ay</option>
                                    <option>Geçen Ay</option>
                                    <option>Özel Aralık</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            </div>

                            {/* Status Filter */}
                            <div className="relative min-w-[180px]">
                                <Filter className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-12 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-8 text-sm text-slate-700 focus:border-[#135bec] focus:outline-none focus:ring-2 focus:ring-[#135bec]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                >
                                    <option value="">Tüm Durumlar</option>
                                    <option value="pending">Beklemede</option>
                                    <option value="approved">Onaylandı</option>
                                    <option value="shipping">Sevkiyatta</option>
                                    <option value="delivered">Teslim Edildi</option>
                                    <option value="rejected">Reddedildi</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Table Section */}
            <div className="flex-1 overflow-auto p-6">
                <div className="flex min-h-[500px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1a2234]">
                    {loading ? (
                        <div className="flex flex-1 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-[#135bec]" />
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-500">
                            <FileText className="h-12 w-12 text-slate-300" />
                            <p className="text-lg font-medium">Henüz talep bulunmuyor</p>
                            <p className="text-sm">Bayiler talep oluşturduğunda burada görünecek</p>
                        </div>
                    ) : (
                        <>
                            {/* Bulk Action Bar */}
                            {selectedIds.length > 0 && (
                                <div className="flex items-center justify-between border-b border-slate-200 bg-[#135bec]/5 px-6 py-3 dark:border-slate-700 dark:bg-[#135bec]/10">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {selectedIds.length} talep seçildi
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleBulkApprove}
                                            disabled={bulkLoading}
                                            className="flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
                                        >
                                            <Check className="h-4 w-4" />
                                            Toplu Onayla
                                        </button>
                                        <button
                                            onClick={handleBulkReject}
                                            disabled={bulkLoading}
                                            className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                                        >
                                            <X className="h-4 w-4" />
                                            Toplu Reddet
                                        </button>
                                        <button
                                            onClick={() => setSelectedIds([])}
                                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        >
                                            Seçimi Temizle
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="flex-1 overflow-auto">
                                <table className="w-full border-collapse text-left">
                                    <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50">
                                        <tr>
                                            <th className="w-[50px] px-3 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.length === filteredRequests.length && filteredRequests.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="h-4 w-4 rounded border-slate-300 text-[#135bec] focus:ring-[#135bec]"
                                                />
                                            </th>
                                            <th className="w-[140px] px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Talep No
                                            </th>
                                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Bayi Adı
                                            </th>
                                            <th className="w-[140px] px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Tarih
                                            </th>
                                            <th className="w-[160px] px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Tutar
                                            </th>
                                            <th className="w-[180px] px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Durum
                                            </th>
                                            <th className="w-[120px] px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                İşlemler
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {filteredRequests.map((request) => (
                                            <tr
                                                key={request.id}
                                                className={`group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedIds.includes(request.id) ? 'bg-[#135bec]/5' : ''}`}
                                            >
                                                <td className="px-3 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(request.id)}
                                                        onChange={() => toggleSelect(request.id)}
                                                        className="h-4 w-4 rounded border-slate-300 text-[#135bec] focus:ring-[#135bec]"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-[#135bec]">
                                                    #{request.request_number}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                            {request.dealers?.company_name || "Bilinmiyor"}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            {request.dealers?.users?.full_name || ""}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                                    {formatDate(request.created_at)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                                                    {formatCurrency(request.total_amount)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="relative">
                                                        <select
                                                            value={request.status}
                                                            onChange={(e) => handleStatusChange(request.id, e.target.value)}
                                                            className={`w-full cursor-pointer appearance-none rounded-full border px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 ${statusStyles[request.status] || statusStyles.pending}`}
                                                        >
                                                            {statusOptions.map((status) => (
                                                                <option key={status} value={status}>
                                                                    {statusLabels[status]}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => { setSelectedRequest(request); setIsDetailModalOpen(true); }}
                                                            className="p-1 text-slate-400 transition-colors hover:text-[#135bec]"
                                                            title="Detayları Görüntüle"
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/50">
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                    <span className="font-semibold text-slate-900 dark:text-white">{filteredRequests.length}</span> talep gösteriliyor
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" disabled>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" className="w-9">
                                        1
                                    </Button>
                                    <Button variant="outline" size="icon">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}
