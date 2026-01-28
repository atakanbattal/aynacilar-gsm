"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useTheme } from "@/contexts/theme-context"
import {
    Settings,
    Building,
    Palette,
    Mail,
    Bell,
    Shield,
    Save,
    Sun,
    Moon,
    Monitor,
} from "lucide-react"

export default function AyarlarPage() {
    const { theme, setTheme } = useTheme()

    return (
        <div className="flex-1 overflow-auto p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Sistem Ayarları
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                    Genel sistem ayarlarını yapılandırın
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Company Info */}
                <Card className="p-6">
                    <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                        <Building className="h-5 w-5 text-[#135bec]" />
                        Şirket Bilgileri
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Şirket Adı
                            </label>
                            <Input defaultValue="Aynacılar GSM" />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Vergi No
                            </label>
                            <Input defaultValue="1234567890" />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Adres
                            </label>
                            <Input defaultValue="İstanbul, Türkiye" />
                        </div>
                    </div>
                </Card>

                {/* Theme Settings */}
                <Card className="p-6">
                    <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                        <Palette className="h-5 w-5 text-[#135bec]" />
                        Tema Ayarları
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Ana Renk
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    defaultValue="#135bec"
                                    className="h-10 w-20 cursor-pointer rounded-lg border border-slate-200"
                                />
                                <Input defaultValue="#135bec" className="flex-1" />
                            </div>
                        </div>
                        <div>
                            <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Tema Modu
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTheme("light")}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 transition-all ${theme === "light"
                                            ? "border-[#135bec] bg-[#135bec]/10 text-[#135bec]"
                                            : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400"
                                        }`}
                                >
                                    <Sun className="h-5 w-5" />
                                    <span className="text-sm font-medium">Açık</span>
                                </button>
                                <button
                                    onClick={() => setTheme("dark")}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 transition-all ${theme === "dark"
                                            ? "border-[#135bec] bg-[#135bec]/10 text-[#135bec]"
                                            : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400"
                                        }`}
                                >
                                    <Moon className="h-5 w-5" />
                                    <span className="text-sm font-medium">Koyu</span>
                                </button>
                                <button
                                    onClick={() => setTheme("system")}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 transition-all ${theme === "system"
                                            ? "border-[#135bec] bg-[#135bec]/10 text-[#135bec]"
                                            : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400"
                                        }`}
                                >
                                    <Monitor className="h-5 w-5" />
                                    <span className="text-sm font-medium">Sistem</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Email Settings */}
                <Card className="p-6">
                    <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                        <Mail className="h-5 w-5 text-[#135bec]" />
                        E-posta Ayarları
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                SMTP Sunucu
                            </label>
                            <Input defaultValue="smtp.example.com" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Port
                                </label>
                                <Input defaultValue="587" />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Güvenlik
                                </label>
                                <select className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800">
                                    <option>TLS</option>
                                    <option>SSL</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Notification Settings */}
                <Card className="p-6">
                    <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                        <Bell className="h-5 w-5 text-[#135bec]" />
                        Bildirim Ayarları
                    </h3>
                    <div className="space-y-4">
                        {[
                            { label: "Yeni talep geldiğinde admin'e bildir", default: true },
                            { label: "Talep onaylandığında bayiye e-posta gönder", default: true },
                            { label: "Sevkiyat oluşturulduğunda bildir", default: true },
                            { label: "Günlük özet raporu gönder", default: false },
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
                </Card>
            </div>

            <div className="mt-6 flex justify-end">
                <Button>
                    <Save className="h-4 w-4" />
                    Ayarları Kaydet
                </Button>
            </div>
        </div>
    )
}
