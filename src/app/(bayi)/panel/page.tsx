import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Clock,
    CheckCircle,
    Truck,
    TrendingUp,
    ArrowRight,
    Eye,
    Megaphone,
    Package,
} from "lucide-react"

// Demo veriler
const kpiData = [
    {
        title: "Bekleyen Talepler",
        value: "12",
        change: "+2 bu hafta",
        changeType: "positive",
        icon: Clock,
        iconBg: "bg-orange-100 dark:bg-orange-900/30",
        iconColor: "text-orange-600 dark:text-orange-400",
        bgIcon: "text-orange-500",
    },
    {
        title: "Onaylanan Siparişler",
        value: "45",
        change: "+15% geçen aya göre",
        changeType: "positive",
        icon: CheckCircle,
        iconBg: "bg-blue-100 dark:bg-blue-900/30",
        iconColor: "text-[#135bec]",
        bgIcon: "text-[#135bec]",
    },
    {
        title: "Sevkiyatta",
        value: "8",
        change: "Tümü planlandı",
        changeType: "neutral",
        icon: Truck,
        iconBg: "bg-teal-100 dark:bg-teal-900/30",
        iconColor: "text-teal-600 dark:text-teal-400",
        bgIcon: "text-teal-500",
    },
]

const announcements = [
    {
        id: 1,
        type: "Yeni Ürün",
        typeColor: "text-[#135bec]",
        title: "iPhone 15 Pro Aksesuarları",
        description:
            "Şimdi stoklayın! Premium kılıf ve ekran koruyucular bu hafta toplu siparişlerde %10 indirimli.",
        image:
            "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop",
        bgGradient: "from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-900",
        borderColor: "border-indigo-100 dark:border-slate-700",
    },
    {
        id: 2,
        type: "Lojistik Güncelleme",
        typeColor: "text-orange-600",
        title: "Anadolu'ya Hızlı Kargo",
        description:
            "Yeni kargo anlaşmamız ile çoğu bölgeye 24 saat içinde teslimat sağlıyoruz.",
        image:
            "/logistics-delivery.png",
        bgGradient: "from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-900",
        borderColor: "border-orange-100 dark:border-slate-700",
    },
]

const recentRequests = [
    {
        id: "REQ-2023-001",
        date: "24 Eki, 2023",
        product: "25x Ekran Koruyucu...",
        status: "Beklemede",
        statusVariant: "warning" as const,
        total: "₺32.500,00",
    },
    {
        id: "REQ-2023-002",
        date: "22 Eki, 2023",
        product: "10x iPhone 13 Silikon Kılıf...",
        status: "Onaylandı",
        statusVariant: "success" as const,
        total: "₺22.100,00",
    },
    {
        id: "REQ-2023-003",
        date: "20 Eki, 2023",
        product: "50x USB-C Kablo...",
        status: "Sevk Edildi",
        statusVariant: "info" as const,
        total: "₺8.320,00",
    },
    {
        id: "REQ-2023-004",
        date: "18 Eki, 2023",
        product: "5x Samsung Fold 4...",
        status: "Reddedildi",
        statusVariant: "danger" as const,
        total: "₺117.000,00",
    },
]

export default function PanelPage() {
    return (
        <div className="space-y-8">
            {/* KPI Section */}
            <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {kpiData.map((kpi) => {
                    const Icon = kpi.icon
                    return (
                        <Card
                            key={kpi.title}
                            className="group relative flex h-40 flex-col justify-between overflow-hidden p-6"
                        >
                            {/* Background Icon */}
                            <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                                <Icon className={`h-20 w-20 ${kpi.bgIcon}`} />
                            </div>

                            <div className="z-10">
                                <div className="mb-2 flex items-center gap-2">
                                    <div
                                        className={`rounded-md p-1.5 ${kpi.iconBg} ${kpi.iconColor}`}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        {kpi.title}
                                    </h3>
                                </div>
                                <p className="mt-4 text-4xl font-bold text-slate-900 dark:text-white">
                                    {kpi.value}
                                </p>
                                <p
                                    className={`mt-2 flex items-center gap-1 text-xs font-medium ${kpi.changeType === "positive"
                                        ? "text-green-600"
                                        : "text-slate-500 dark:text-slate-400"
                                        }`}
                                >
                                    {kpi.changeType === "positive" && (
                                        <TrendingUp className="h-4 w-4" />
                                    )}
                                    {kpi.change}
                                </p>
                            </div>
                        </Card>
                    )
                })}
            </section>

            {/* Announcements */}
            <section>
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                        <Megaphone className="h-5 w-5 text-[#135bec]" />
                        Son Duyurular
                    </h3>
                    <Link
                        href="#"
                        className="text-sm font-medium text-[#135bec] hover:underline"
                    >
                        Tümünü Gör
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {announcements.map((announcement) => (
                        <div
                            key={announcement.id}
                            className={`flex flex-col overflow-hidden rounded-xl border bg-gradient-to-r shadow-sm sm:flex-row ${announcement.bgGradient} ${announcement.borderColor}`}
                        >
                            <div
                                className="h-48 bg-cover bg-center sm:h-auto sm:w-2/5"
                                style={{ backgroundImage: `url('${announcement.image}')` }}
                            />
                            <div className="flex flex-1 flex-col justify-center p-6">
                                <span
                                    className={`mb-2 text-xs font-bold uppercase tracking-wider ${announcement.typeColor}`}
                                >
                                    {announcement.type}
                                </span>
                                <h4 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
                                    {announcement.title}
                                </h4>
                                <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                                    {announcement.description}
                                </p>
                                <button
                                    className={`flex items-center gap-1 self-start text-sm font-semibold transition-all hover:gap-2 ${announcement.typeColor}`}
                                >
                                    {announcement.type === "Yeni Ürün" ? "Satın Al" : "Devamını Oku"}
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Recent Requests Table */}
            <section className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center dark:border-slate-800">
                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                            <Package className="h-5 w-5 text-[#135bec]" />
                            Son Talepler
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Son satın alma taleplerinizi yönetin ve takip edin.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm">
                            Filtrele
                        </Button>
                        <Button size="sm">
                            + Yeni Talep
                        </Button>
                    </div>
                </div>

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
                            {recentRequests.map((request) => (
                                <tr
                                    key={request.id}
                                    className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                >
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                        #{request.id}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                        {request.date}
                                    </td>
                                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                        {request.product}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={request.statusVariant} dot>
                                            {request.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white">
                                        {request.total}
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

                <div className="flex justify-center border-t border-slate-100 p-4 dark:border-slate-800">
                    <Link
                        href="/taleplerim"
                        className="text-sm font-medium text-[#135bec] transition-colors hover:text-blue-700"
                    >
                        Tüm Talepleri Görüntüle
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="pb-4 text-center text-sm text-slate-400 dark:text-slate-600">
                © 2024 Teknomarket Aynacılar GSM Toptan Portal. Tüm hakları saklıdır.
            </footer>
        </div>
    )
}
