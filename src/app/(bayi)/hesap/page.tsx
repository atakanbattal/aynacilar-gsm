"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import {
    User,
    Mail,
    Phone,
    MapPin,
    Lock,
    Bell,
    Shield,
    Save,
    Eye,
    EyeOff,
    Loader2,
} from "lucide-react"

export default function HesapPage() {
    const { user, profile } = useAuth()
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        city: "",
    })

    // Load profile data when available
    useEffect(() => {
        if (profile) {
            setFormData({
                fullName: profile.full_name || "",
                email: profile.email || "",
                phone: profile.phone || "",
                city: "",  // Not stored in users table currently
            })
        }
    }, [profile])

    const handleSaveProfile = async () => {
        if (!user) return

        try {
            setLoading(true)

            const { error } = await supabase
                .from("users")
                .update({
                    full_name: formData.fullName,
                    phone: formData.phone,
                })
                .eq("id", user.id)

            if (error) throw error

            alert("Profil bilgileri güncellendi!")
        } catch (error: any) {
            console.error("Error updating profile:", error)
            alert("Profil güncellenirken bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Hesap Ayarları
                </h2>
                <p className="mt-1 text-slate-500 dark:text-slate-400">
                    Profil bilgilerinizi ve güvenlik ayarlarınızı yönetin.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Profile Card */}
                <Card className="p-6 lg:col-span-2">
                    <h3 className="mb-6 text-lg font-bold text-slate-900 dark:text-white">
                        Profil Bilgileri
                    </h3>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Ad Soyad
                            </label>
                            <Input
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                icon={<User className="h-5 w-5" />}
                                placeholder="Ad Soyad"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                E-posta
                            </label>
                            <Input
                                type="email"
                                value={formData.email}
                                disabled
                                className="bg-slate-100 dark:bg-slate-800"
                                icon={<Mail className="h-5 w-5" />}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Telefon
                            </label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                icon={<Phone className="h-5 w-5" />}
                                placeholder="+90 5XX XXX XX XX"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Şehir
                            </label>
                            <Input
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                icon={<MapPin className="h-5 w-5" />}
                                placeholder="İstanbul"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleSaveProfile} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Değişiklikleri Kaydet
                        </Button>
                    </div>
                </Card>

                {/* Security Card */}
                <Card className="p-6">
                    <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                        <Shield className="h-5 w-5 text-[#135bec]" />
                        Güvenlik
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Mevcut Şifre
                            </label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    icon={<Lock className="h-5 w-5" />}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Yeni Şifre
                            </label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                icon={<Lock className="h-5 w-5" />}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Yeni Şifre (Tekrar)
                            </label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                icon={<Lock className="h-5 w-5" />}
                            />
                        </div>
                        <Button variant="outline" className="w-full">
                            Şifreyi Güncelle
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Notifications */}
            <Card className="p-6">
                <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                    <Bell className="h-5 w-5 text-[#135bec]" />
                    Bildirim Tercihleri
                </h3>

                <div className="space-y-4">
                    {[
                        { label: "Talep durumu değiştiğinde e-posta almak istiyorum", default: true },
                        { label: "Yeni ürünler hakkında bilgilendirilmek istiyorum", default: true },
                        { label: "Kampanya ve indirimlerden haberdar olmak istiyorum", default: false },
                        { label: "Haftalık özet raporu almak istiyorum", default: false },
                    ].map((item, i) => (
                        <label key={i} className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                defaultChecked={item.default}
                                className="h-4 w-4 rounded border-slate-300 text-[#135bec] focus:ring-[#135bec]"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                {item.label}
                            </span>
                        </label>
                    ))}
                </div>

                <div className="mt-6 flex justify-end">
                    <Button variant="outline">
                        <Save className="h-4 w-4" />
                        Tercihleri Kaydet
                    </Button>
                </div>
            </Card>
        </div>
    )
}

