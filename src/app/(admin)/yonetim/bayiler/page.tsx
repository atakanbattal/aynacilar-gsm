"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { supabase } from "@/lib/supabase/client"
import {
    Search,
    Plus,
    Eye,
    Edit,
    Trash2,
    MapPin,
    Phone,
    Mail,
    User,
    Building,
    Lock,
    Loader2,
} from "lucide-react"

// Define types based on DB schema
interface Dealer {
    id: string
    user_id: string
    company_name: string
    contact_name: string // derived from users.full_name
    email: string // derived from users.email
    phone: string // derived from users.phone
    city: string
    address: string
    status: string
    current_balance: number
    total_orders: number // placeholder or calculated
}

const INITIAL_FORM_DATA = {
    name: "",
    contact: "",
    email: "",
    phone: "",
    city: "İstanbul",
    address: "",
    password: "",
    confirmPassword: "",
    status: "active",
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 0,
    }).format(price)
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
    if (error instanceof Error && error.message) {
        return error.message
    }

    if (typeof error === "string" && error.trim()) {
        return error
    }

    return fallbackMessage
}

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function BayilerPage() {
    const [dealers, setDealers] = useState<Dealer[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreatingDealer, setIsCreatingDealer] = useState(false)
    const [isDeletingDealer, setIsDeletingDealer] = useState(false)
    const [createDealerError, setCreateDealerError] = useState<string | null>(null)
    const [deleteDealerError, setDeleteDealerError] = useState<string | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null)
    const [formData, setFormData] = useState(INITIAL_FORM_DATA)

    useEffect(() => {
        fetchDealers()
    }, [])

    const fetchDealers = async () => {
        try {
            setLoading(true)
            // Join dealers with users to get contact info
            const { data, error } = await supabase
                .from("dealers")
                .select(`
                    id,
                    user_id,
                    company_name,
                    tax_number,
                    address,
                    city,
                    status,
                    current_balance,
                    users (
                        email,
                        full_name,
                        phone
                    )
                `)

            if (error) throw error

            // Fetch revenue for each dealer from requests
            const { data: requestsData, error: reqError } = await supabase
                .from("requests")
                .select("dealer_id, total_amount, status")
                .in("status", ["approved", "preparing", "shipping", "delivered"])

            console.log("Requests data for revenue:", requestsData, "Error:", reqError)

            // Calculate revenue per dealer
            const revenueByDealer: Record<string, { revenue: number; orders: number }> = {}
            requestsData?.forEach((req: any) => {
                if (!revenueByDealer[req.dealer_id]) {
                    revenueByDealer[req.dealer_id] = { revenue: 0, orders: 0 }
                }
                revenueByDealer[req.dealer_id].revenue += Number(req.total_amount)
                revenueByDealer[req.dealer_id].orders += 1
            })

            console.log("Revenue by dealer:", revenueByDealer)

            // Map response to component state structure
            const mappedDealers = data.map((d: any) => ({
                id: d.id,
                user_id: d.user_id,
                company_name: d.company_name || "",
                contact_name: d.users?.full_name || "",
                email: d.users?.email || "",
                phone: d.users?.phone || "",
                city: d.city || "",
                address: d.address || "",
                status: d.status || "active",
                current_balance: revenueByDealer[d.id]?.revenue || 0,
                total_orders: revenueByDealer[d.id]?.orders || 0,
            }))

            setDealers(mappedDealers)
        } catch (error) {
            console.error("Error fetching dealers:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = async () => {
        if (isCreatingDealer) return

        const trimmedName = formData.name.trim()
        const trimmedContact = formData.contact.trim()
        const trimmedEmail = formData.email.trim()

        // Validate form
        if (!trimmedName || !trimmedContact || !trimmedEmail || !formData.password) {
            setCreateDealerError("Lütfen zorunlu alanları doldurun (Şirket Adı, Yetkili Kişi, E-posta, Şifre).")
            return
        }

        if (!isValidEmail(trimmedEmail)) {
            setCreateDealerError("Lütfen geçerli bir e-posta adresi girin.")
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setCreateDealerError("Şifreler eşleşmiyor.")
            return
        }

        if (formData.password.length < 6) {
            setCreateDealerError("Şifre en az 6 karakter olmalıdır.")
            return
        }

        try {
            setCreateDealerError(null)
            setIsCreatingDealer(true)

            const response = await fetch('/api/dealers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: trimmedEmail,
                    password: formData.password,
                    fullName: trimmedContact,
                    phone: formData.phone.trim(),
                    companyName: trimmedName,
                    city: formData.city,
                    address: formData.address.trim(),
                }),
            })

            const responseText = await response.text()
            let result: { error?: string; message?: string } = {}

            if (responseText) {
                try {
                    result = JSON.parse(responseText)
                } catch {
                    result = {
                        error: 'Sunucudan beklenmeyen bir yanıt alındı.',
                    }
                }
            }

            if (!response.ok) {
                throw new Error(result.error || 'Bayi oluşturulamadı')
            }

            setCreateDealerError(null)
            setIsAddModalOpen(false)
            setFormData(INITIAL_FORM_DATA)
            alert("Bayi hesabı başarıyla oluşturuldu!")
            await fetchDealers()
        } catch (error: any) {
            console.error("Error creating dealer:", error)
            setCreateDealerError(error.message || "Bayi oluşturulurken bir hata oluştu.")
        } finally {
            setIsCreatingDealer(false)
        }
    }

    const handleEdit = async () => {
        if (!selectedDealer) return

        try {
            setLoading(true)

            // Update dealers table
            const { error: dealerError } = await supabase
                .from("dealers")
                .update({
                    company_name: formData.name,
                    city: formData.city,
                    address: formData.address,
                    status: formData.status
                })
                .eq("id", selectedDealer.id)

            if (dealerError) throw dealerError

            // Update users table
            const { error: userError } = await supabase
                .from("users")
                .update({
                    full_name: formData.contact,
                    phone: formData.phone
                    // Email update implies Auth update, handled separately usually
                })
                .eq("id", selectedDealer.user_id)

            if (userError) throw userError

            await fetchDealers()
            setIsEditModalOpen(false)
        } catch (error) {
            console.error("Error updating dealer:", error)
            alert("Bayi güncellenirken bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedDealer) return

        try {
            setDeleteDealerError(null)
            setIsDeletingDealer(true)

            const response = await fetch(`/api/dealers/${selectedDealer.id}`, {
                method: "DELETE",
            })

            const responseText = await response.text()
            let result: { error?: string; message?: string } = {}

            if (responseText) {
                try {
                    result = JSON.parse(responseText)
                } catch {
                    result = {
                        error: "Sunucudan beklenmeyen bir yanıt alındı.",
                    }
                }
            }

            if (!response.ok) {
                throw new Error(result.error || "Bayi silinemedi")
            }

            await fetchDealers()
            setIsDeleteModalOpen(false)
            setSelectedDealer(null)
        } catch (error) {
            const message = getErrorMessage(error, "Bayi silinirken bir hata oluştu.")
            console.error("Error deleting dealer:", message)
            setDeleteDealerError(message)
        } finally {
            setIsDeletingDealer(false)
        }
    }

    const openEditModal = (dealer: Dealer) => {
        setSelectedDealer(dealer)
        setFormData({
            name: dealer.company_name,
            contact: dealer.contact_name,
            email: dealer.email,
            phone: dealer.phone,
            city: dealer.city,
            address: dealer.address,
            password: "",
            confirmPassword: "",
            status: dealer.status,
        })
        setIsEditModalOpen(true)
    }

    const closeAddModal = () => {
        if (isCreatingDealer) return

        setIsAddModalOpen(false)
        setCreateDealerError(null)
        setFormData(INITIAL_FORM_DATA)
    }

    return (
        <div className="flex-1 overflow-auto p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Bayi Yönetimi</h2>
                    <p className="text-slate-500 dark:text-slate-400">Bayileri görüntüleyin ve yönetin</p>
                </div>
                <Button onClick={() => {
                    setCreateDealerError(null)
                    setFormData(INITIAL_FORM_DATA)
                    setIsAddModalOpen(true)
                }}>
                    <Plus className="h-4 w-4" />
                    Yeni Bayi Ekle
                </Button>
            </div>

            {/* Search */}
            <div className="mb-6 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input placeholder="Bayi adı veya ID ile ara..." className="pl-10" />
                </div>
                <select className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                    <option>Tüm Durumlar</option>
                    <option>active</option>
                    <option>inactive</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Bayi Bilgileri</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">İletişim</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Konum</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Durum</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Toplam Ciro</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {loading && dealers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                                        <p className="mt-2">Bayiler yükleniyor...</p>
                                    </td>
                                </tr>
                            ) : dealers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        Hiç bayi bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                dealers.map((dealer) => (
                                    <tr key={dealer.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{dealer.company_name}</p>
                                                <p className="text-xs text-slate-500">ID: {dealer.id.slice(0, 8)}... • {dealer.contact_name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300"><Mail className="h-3 w-3" />{dealer.email}</p>
                                                <p className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300"><Phone className="h-3 w-3" />{dealer.phone}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300"><MapPin className="h-4 w-4" />{dealer.city}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={dealer.status === "active" ? "success" : "default"}>{dealer.status === "active" ? "Aktif" : "Pasif"}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="font-semibold text-[#135bec]">{formatPrice(dealer.current_balance)}</p>
                                            <p className="text-xs text-slate-500">{dealer.total_orders} sipariş</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => { setSelectedDealer(dealer); setIsViewModalOpen(true); }} className="p-1 text-slate-400 hover:text-[#135bec]" title="Görüntüle"><Eye className="h-5 w-5" /></button>
                                                <button onClick={() => openEditModal(dealer)} className="p-1 text-slate-400 hover:text-[#135bec]" title="Düzenle"><Edit className="h-5 w-5" /></button>
                                                <button onClick={() => { setDeleteDealerError(null); setSelectedDealer(dealer); setIsDeleteModalOpen(true); }} className="p-1 text-slate-400 hover:text-red-500" title="Sil"><Trash2 className="h-5 w-5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Dealer Modal (with Account Creation) */}
            <Modal isOpen={isAddModalOpen} onClose={closeAddModal} title="Yeni Bayi Hesabı Oluştur" size="lg">
                <div className="space-y-6">
                    {/* Company Info */}
                    <div>
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                            <Building className="h-4 w-4 text-[#135bec]" />
                            Şirket Bilgileri
                        </h4>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Şirket Adı *</label>
                                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="TechZone İstanbul" />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Yetkili Kişi *</label>
                                <Input value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="Ahmet Yılmaz" icon={<User className="h-5 w-5" />} />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Şehir</label>
                                <select value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                                    <option>İstanbul</option>
                                    <option>Ankara</option>
                                    <option>İzmir</option>
                                    <option>Bursa</option>
                                    <option>Antalya</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Adres</label>
                                <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Kadıköy, İstanbul" icon={<MapPin className="h-5 w-5" />} />
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                            <Mail className="h-4 w-4 text-[#135bec]" />
                            İletişim Bilgileri
                        </h4>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">E-posta *</label>
                                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="info@sirket.com" icon={<Mail className="h-5 w-5" />} />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Telefon *</label>
                                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+90 532 123 45 67" icon={<Phone className="h-5 w-5" />} />
                            </div>
                        </div>
                    </div>

                    {/* Account Credentials */}
                    <div>
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                            <Lock className="h-4 w-4 text-[#135bec]" />
                            Hesap Bilgileri
                        </h4>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Şifre *</label>
                                <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" icon={<Lock className="h-5 w-5" />} />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Şifre (Tekrar) *</label>
                                <Input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="••••••••" icon={<Lock className="h-5 w-5" />} />
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">Bayi bu bilgilerle portala giriş yapabilecek.</p>
                    </div>

                    {createDealerError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                            {createDealerError}
                        </div>
                    ) : null}

                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
                        <Button variant="outline" onClick={closeAddModal} disabled={isCreatingDealer}>İptal</Button>
                        <Button onClick={handleAdd} isLoading={isCreatingDealer} disabled={isCreatingDealer}>
                            {isCreatingDealer ? "Oluşturuluyor..." : "Bayi Hesabı Oluştur"}
                        </Button>
                    </div>
                    {isCreatingDealer ? (
                        <p className="text-right text-xs text-slate-500 dark:text-slate-400">
                            Bayi hesabı oluşturuluyor. Lütfen sayfadan ayrılmayın.
                        </p>
                    ) : null}
                </div>
            </Modal>

            {/* Edit Dealer Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Bayi Düzenle" size="lg">
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Şirket Adı *</label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Yetkili Kişi *</label>
                            <Input value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">E-posta</label>
                            <Input type="email" value={formData.email} disabled className="bg-slate-100 dark:bg-slate-800" />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Telefon *</label>
                            <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Şehir</label>
                            <select value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                                <option>İstanbul</option>
                                <option>Ankara</option>
                                <option>İzmir</option>
                                <option>Bursa</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Durum</label>
                            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                                <option value="active">Aktif</option>
                                <option value="inactive">Pasif</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>İptal</Button>
                        <Button onClick={handleEdit} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Kaydet
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* View Dealer Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Bayi Detayları">
                {selectedDealer && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#135bec]/10 text-2xl font-bold text-[#135bec]">
                                {selectedDealer.company_name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedDealer.company_name}</h3>
                                <p className="text-sm text-slate-500">ID: {selectedDealer.id.slice(0, 8)}... • {selectedDealer.contact_name}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                            <div><span className="text-sm text-slate-500">E-posta:</span><p className="font-medium">{selectedDealer.email}</p></div>
                            <div><span className="text-sm text-slate-500">Telefon:</span><p className="font-medium">{selectedDealer.phone}</p></div>
                            <div><span className="text-sm text-slate-500">Şehir:</span><p className="font-medium">{selectedDealer.city}</p></div>
                            <div><span className="text-sm text-slate-500">Durum:</span><p><Badge variant={selectedDealer.status === "active" ? "success" : "default"}>{selectedDealer.status === "active" ? "Aktif" : "Pasif"}</Badge></p></div>
                            <div><span className="text-sm text-slate-500">Toplam Sipariş:</span><p className="font-medium">{selectedDealer.total_orders}</p></div>
                            <div><span className="text-sm text-slate-500">Bakiye:</span><p className="font-medium text-[#135bec]">₺{selectedDealer.current_balance}</p></div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => {
                if (isDeletingDealer) return
                setDeleteDealerError(null)
                setIsDeleteModalOpen(false)
            }} title="Bayi Sil" size="sm">
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-300">
                        <strong>{selectedDealer?.company_name}</strong> bayisini silmek istediğinizden emin misiniz? Bayiye bağlı talepler, talep kalemleri, favoriler ve kullanıcı hesabı da silinecek. Bu işlem geri alınamaz.
                    </p>
                    {deleteDealerError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                            {deleteDealerError}
                        </div>
                    ) : null}
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => {
                            if (isDeletingDealer) return
                            setDeleteDealerError(null)
                            setIsDeleteModalOpen(false)
                        }} disabled={isDeletingDealer}>İptal</Button>
                        <Button variant="danger" onClick={handleDelete} disabled={isDeletingDealer} isLoading={isDeletingDealer}>
                            Sil
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
