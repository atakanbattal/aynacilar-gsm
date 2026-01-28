"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Card } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import {
    Plus,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Loader2,
    Bell,
    AlertCircle,
    CheckCircle,
    Package,
    Truck,
} from "lucide-react"

interface Announcement {
    id: string
    title: string
    content: string
    type: string
    is_active: boolean
    priority: number
    starts_at: string
    ends_at: string | null
    created_at: string
}

const typeOptions = [
    { value: "info", label: "Bilgi", icon: AlertCircle, color: "bg-blue-100 text-blue-700" },
    { value: "warning", label: "Uyarı", icon: AlertCircle, color: "bg-yellow-100 text-yellow-700" },
    { value: "success", label: "Başarı", icon: CheckCircle, color: "bg-green-100 text-green-700" },
    { value: "product", label: "Ürün", icon: Package, color: "bg-purple-100 text-purple-700" },
    { value: "logistics", label: "Kargo", icon: Truck, color: "bg-orange-100 text-orange-700" },
]

export default function DuyurularPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        type: "info",
        priority: 0,
        is_active: true,
    })

    useEffect(() => {
        fetchAnnouncements()
    }, [])

    const fetchAnnouncements = async () => {
        try {
            const { data, error } = await supabase
                .from("announcements")
                .select("*")
                .order("priority", { ascending: false })
                .order("created_at", { ascending: false })

            if (error) throw error
            setAnnouncements(data || [])
        } catch (error) {
            console.error("Error fetching announcements:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!formData.title || !formData.content) {
            alert("Başlık ve içerik zorunludur")
            return
        }

        try {
            if (selectedAnnouncement) {
                // Update
                const { error } = await supabase
                    .from("announcements")
                    .update({
                        title: formData.title,
                        content: formData.content,
                        type: formData.type,
                        priority: formData.priority,
                        is_active: formData.is_active,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", selectedAnnouncement.id)

                if (error) throw error
            } else {
                // Create
                const { error } = await supabase
                    .from("announcements")
                    .insert({
                        title: formData.title,
                        content: formData.content,
                        type: formData.type,
                        priority: formData.priority,
                        is_active: formData.is_active,
                    })

                if (error) throw error
            }

            setIsModalOpen(false)
            resetForm()
            fetchAnnouncements()
        } catch (error) {
            console.error("Error saving announcement:", error)
            alert("Kaydetme sırasında bir hata oluştu")
        }
    }

    const handleDelete = async () => {
        if (!selectedAnnouncement) return

        try {
            const { error } = await supabase
                .from("announcements")
                .delete()
                .eq("id", selectedAnnouncement.id)

            if (error) throw error

            setIsDeleteModalOpen(false)
            setSelectedAnnouncement(null)
            fetchAnnouncements()
        } catch (error) {
            console.error("Error deleting announcement:", error)
        }
    }

    const toggleActive = async (announcement: Announcement) => {
        try {
            const { error } = await supabase
                .from("announcements")
                .update({ is_active: !announcement.is_active })
                .eq("id", announcement.id)

            if (error) throw error
            fetchAnnouncements()
        } catch (error) {
            console.error("Error toggling active:", error)
        }
    }

    const resetForm = () => {
        setFormData({
            title: "",
            content: "",
            type: "info",
            priority: 0,
            is_active: true,
        })
        setSelectedAnnouncement(null)
    }

    const openEditModal = (announcement: Announcement) => {
        setSelectedAnnouncement(announcement)
        setFormData({
            title: announcement.title,
            content: announcement.content,
            type: announcement.type,
            priority: announcement.priority,
            is_active: announcement.is_active,
        })
        setIsModalOpen(true)
    }

    const getTypeConfig = (type: string) => {
        return typeOptions.find(t => t.value === type) || typeOptions[0]
    }

    return (
        <div className="flex-1 overflow-auto p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Duyuru Yönetimi
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Bayilere gösterilecek duyuruları yönetin
                    </p>
                </div>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                    <Plus className="h-4 w-4" />
                    Yeni Duyuru
                </Button>
            </div>

            {/* Announcements List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#135bec]" />
                </div>
            ) : announcements.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-12">
                    <Bell className="mb-4 h-12 w-12 text-slate-300" />
                    <p className="text-lg font-medium text-slate-500">Henüz duyuru yok</p>
                    <p className="text-sm text-slate-400">Yeni duyuru eklemek için butona tıklayın</p>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {announcements.map((announcement) => {
                        const typeConfig = getTypeConfig(announcement.type)
                        const Icon = typeConfig.icon
                        return (
                            <Card key={announcement.id} className={`p-4 ${!announcement.is_active ? 'opacity-50' : ''}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`rounded-lg p-2 ${typeConfig.color}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                                    {announcement.title}
                                                </h3>
                                                {!announcement.is_active && (
                                                    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                                                        Pasif
                                                    </span>
                                                )}
                                                {announcement.priority > 0 && (
                                                    <span className="rounded bg-[#135bec]/10 px-2 py-0.5 text-xs text-[#135bec]">
                                                        Öncelik: {announcement.priority}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                                {announcement.content}
                                            </p>
                                            <p className="mt-2 text-xs text-slate-400">
                                                {new Date(announcement.created_at).toLocaleDateString("tr-TR")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleActive(announcement)}
                                            className="p-2 text-slate-400 hover:text-[#135bec]"
                                            title={announcement.is_active ? "Pasif Yap" : "Aktif Yap"}
                                        >
                                            {announcement.is_active ? (
                                                <Eye className="h-5 w-5" />
                                            ) : (
                                                <EyeOff className="h-5 w-5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => openEditModal(announcement)}
                                            className="p-2 text-slate-400 hover:text-[#135bec]"
                                        >
                                            <Edit className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => { setSelectedAnnouncement(announcement); setIsDeleteModalOpen(true); }}
                                            className="p-2 text-slate-400 hover:text-red-500"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                title={selectedAnnouncement ? "Duyuru Düzenle" : "Yeni Duyuru"}
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Başlık *
                        </label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Duyuru başlığı"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            İçerik *
                        </label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Duyuru içeriği"
                            rows={4}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#135bec] focus:outline-none focus:ring-2 focus:ring-[#135bec]/20 dark:border-slate-700 dark:bg-slate-800"
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Tür
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                            >
                                {typeOptions.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Öncelik
                            </label>
                            <Input
                                type="number"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 text-[#135bec]"
                        />
                        <label htmlFor="is_active" className="text-sm text-slate-700 dark:text-slate-300">
                            Aktif (Bayilere göster)
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                            İptal
                        </Button>
                        <Button onClick={handleSubmit}>
                            {selectedAnnouncement ? "Güncelle" : "Oluştur"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Duyuruyu Sil"
            >
                <p className="text-slate-600 dark:text-slate-400">
                    &quot;{selectedAnnouncement?.title}&quot; duyurusunu silmek istediğinize emin misiniz?
                </p>
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                        İptal
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        Sil
                    </Button>
                </div>
            </Modal>
        </div>
    )
}
