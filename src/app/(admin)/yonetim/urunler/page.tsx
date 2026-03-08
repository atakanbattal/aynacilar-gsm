"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
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
    X,
    Loader2,
    ImagePlus,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    Tag,
    Layers,
    Hash,
    Package,
    ShoppingBag,
} from "lucide-react"

// ─── ProductForm Props ────────────────────────────────────────────────────────
interface FormData {
    name: string; sku: string; category_id: string; brand_id: string
    model: string; memory: string; price: string; original_price: string
    cost_price: string; stock: string; min_order_quantity: string
    status: string; images: string[]; description: string
    warranty_info: string; delivery_time: string
    specifications: Record<string, string>
}
interface ProductFormProps {
    isEdit?: boolean
    formData: FormData
    setFormData: React.Dispatch<React.SetStateAction<FormData>>
    brands: { id: string; name: string }[]
    categories: { id: string; name: string }[]
    memoryOptions: string[]
    modelsForBrand: string[]
    uploading: boolean
    loading: boolean
    fileInputRef: React.RefObject<HTMLInputElement | null>
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    onRemoveImage: (index: number) => void
    onBrandChange: (id: string) => void
    onModelChange: (model: string) => void
    onMemoryChange: (memory: string) => void
    onGenerateSKU: () => string
    onAddSpecRow: () => void
    onUpdateSpecValue: (key: string, val: string) => void
    onRemoveSpecRow: (key: string) => void
    onSubmit: () => void
    onCancel: () => void
}
// ─── ProductForm (MODÜL DÜZEYİNDE — focus kaybını önler) ──────────────────────
function ProductForm({
    isEdit = false, formData, setFormData, brands, categories,
    memoryOptions, modelsForBrand, uploading, loading, fileInputRef,
    onImageUpload, onRemoveImage, onBrandChange, onModelChange, onMemoryChange,
    onGenerateSKU, onAddSpecRow, onUpdateSpecValue, onRemoveSpecRow,
    onSubmit, onCancel,
}: ProductFormProps) {
    return (
        <div className="space-y-6">
            {/* Görseller */}
            <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">📷 Ürün Görselleri</label>
                <div className="flex flex-wrap gap-3">
                    {formData.images.map((url, index) => (
                        <div key={index} className="group relative h-24 w-24 overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-700">
                            <Image src={url} alt={`Product ${index + 1}`} fill className="object-cover" />
                            <button onClick={() => onRemoveImage(index)}
                                className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                        className="flex h-24 w-24 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition-colors hover:border-[#135bec] hover:text-[#135bec] dark:border-slate-700 dark:bg-slate-800">
                        {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><ImagePlus className="h-6 w-6" /><span className="mt-1 text-xs">Ekle</span></>}
                    </button>
                </div>
                <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={onImageUpload} />
                <p className="text-xs text-slate-500">Birden fazla resim seçebilirsiniz</p>
            </div>

            {/* 1. Temel Bilgiler */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">📋 Temel Bilgiler</p>
                </div>
                <div className="p-4 grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Marka *</label>
                        <select value={formData.brand_id} onChange={e => onBrandChange(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800">
                            <option value="">Marka Seçin</option>
                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Kategori *</label>
                        <select value={formData.category_id} onChange={e => setFormData(p => ({ ...p, category_id: e.target.value }))}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800">
                            <option value="">Kategori Seçin</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Model *</label>
                        <select value={formData.model} onChange={e => onModelChange(e.target.value)}
                            disabled={!formData.brand_id}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800">
                            <option value="">Model Seçin</option>
                            {modelsForBrand.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Hafıza/Depolama</label>
                        <select value={formData.memory} onChange={e => onMemoryChange(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800">
                            <option value="">Hafıza Seçin (Opsiyonel)</option>
                            {memoryOptions.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Ürün Adı</label>
                        <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Otomatik oluşturulur veya özel girin" />
                        <p className="mt-1 text-xs text-slate-500">Model ve hafıza seçildiğinde otomatik oluşturulur</p>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">SKU</label>
                        <div className="flex gap-2">
                            <Input value={formData.sku} onChange={e => setFormData(p => ({ ...p, sku: e.target.value }))} placeholder="Otomatik oluşturulur" className="flex-1" />
                            <Button type="button" variant="outline" size="sm" onClick={() => setFormData(p => ({ ...p, sku: onGenerateSKU() }))}>Oluştur</Button>
                        </div>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Durum</label>
                        <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800">
                            <option value="active">Aktif</option>
                            <option value="inactive">Pasif</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 2. Fiyat & Stok */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">💰 Fiyat & Stok</p>
                </div>
                <div className="p-4 grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Toptan Fiyat (₺) *</label>
                        <input type="number" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} placeholder="64999"
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-[#135bec] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Piyasa Fiyatı (₺) <span className="text-slate-400 font-normal">(opsiyonel)</span></label>
                        <input type="number" value={formData.original_price} onChange={e => setFormData(p => ({ ...p, original_price: e.target.value }))} placeholder="79999"
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-[#135bec] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                        <p className="mt-1 text-xs text-slate-400">Üstü çizili piyasa fiyatı olarak gösterilir</p>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Maliyet Fiyatı (₺) <span className="text-slate-400 font-normal">(gizli)</span></label>
                        <input type="number" value={formData.cost_price} onChange={e => setFormData(p => ({ ...p, cost_price: e.target.value }))} placeholder="55000"
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-[#135bec] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                        <p className="mt-1 text-xs text-slate-400">Kâr marjı hesabı için kullanılır, bayilere gösterilmez</p>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Stok Miktarı *</label>
                        <input type="number" value={formData.stock} onChange={e => setFormData(p => ({ ...p, stock: e.target.value }))} placeholder="100"
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-[#135bec] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Min. Sipariş Adedi</label>
                        <input type="number" value={formData.min_order_quantity} onChange={e => setFormData(p => ({ ...p, min_order_quantity: e.target.value }))} min="1" placeholder="1"
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-[#135bec] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                    </div>
                </div>
            </div>

            {/* 3. Açıklama */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">📝 Ürün Açıklaması</p>
                </div>
                <div className="p-4">
                    <textarea
                        value={formData.description}
                        onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                        placeholder="Ürün hakkında detaylı açıklama yazın: özellikler, kullanım alanları, renkler, dikkat edilmesi gereken hususlar..."
                        rows={5}
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed focus:border-[#135bec] focus:outline-none focus:ring-2 focus:ring-[#135bec]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-none"
                    />
                </div>
            </div>

            {/* 4. Teknik Özellikler */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">📱 Teknik Özellikler</p>
                    <button onClick={onAddSpecRow} type="button"
                        className="flex items-center gap-1 rounded-lg bg-[#135bec] px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
                        + Özellik Ekle
                    </button>
                </div>
                <div className="p-4 space-y-2">
                    {Object.entries(formData.specifications).length === 0 ? (
                        <p className="text-center text-sm text-slate-400 py-4">
                            Henüz özellik eklenmedi. "+ Özellik Ekle" ile ekleyin.<br />
                            <span className="text-xs">Örn: İşlemci, RAM, Ekran Boyutu, Kamera, Batarya, Renk, Ağırlık...</span>
                        </p>
                    ) : (
                        Object.entries(formData.specifications).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-2">
                                <span className="w-36 flex-shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">{key}</span>
                                <input
                                    value={val}
                                    onChange={e => onUpdateSpecValue(key, e.target.value)}
                                    placeholder={`${key} değerini girin`}
                                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-[#135bec] focus:outline-none"
                                />
                                <button onClick={() => onRemoveSpecRow(key)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 5. Garanti & Teslimat */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">🛡️ Garanti & Teslimat</p>
                </div>
                <div className="p-4 grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Garanti Bilgisi</label>
                        <input type="text" value={formData.warranty_info} onChange={e => setFormData(p => ({ ...p, warranty_info: e.target.value }))} placeholder="Örn: 2 Yıl Türkiye Garantisi"
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-[#135bec] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Teslimat Süresi</label>
                        <input type="text" value={formData.delivery_time} onChange={e => setFormData(p => ({ ...p, delivery_time: e.target.value }))} placeholder="Örn: 1-3 İş Günü"
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-[#135bec] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={onCancel}>İptal</Button>
                <Button onClick={onSubmit} disabled={loading || uploading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isEdit ? "Değişiklikleri Kaydet" : "Ürünü Ekle"}
                </Button>
            </div>
        </div>
    )
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function AdminLightbox({
    images,
    initialIndex,
    onClose,
}: {
    images: string[]
    initialIndex: number
    onClose: () => void
}) {
    const [current, setCurrent] = useState(initialIndex)
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
            if (e.key === "ArrowRight") setCurrent(c => (c + 1) % images.length)
            if (e.key === "ArrowLeft") setCurrent(c => (c - 1 + images.length) % images.length)
        }
        window.addEventListener("keydown", handleKey)
        return () => window.removeEventListener("keydown", handleKey)
    }, [images.length, onClose])

    return (
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/97 backdrop-blur-sm"
            onClick={onClose}
        >
            <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/25 transition-colors">
                <X className="h-6 w-6" />
            </button>
            {images.length > 1 && (
                <button
                    onClick={e => { e.stopPropagation(); setCurrent(c => (c - 1 + images.length) % images.length) }}
                    className="absolute left-4 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/25"
                >
                    <ChevronLeft className="h-7 w-7" />
                </button>
            )}
            <div
                className="relative mx-20 flex items-center justify-center"
                style={{ width: "min(90vw,800px)", height: "min(90vh,800px)" }}
                onClick={e => e.stopPropagation()}
            >
                <Image src={images[current]} alt="" fill className="object-contain" sizes="90vw" />
            </div>
            {images.length > 1 && (
                <button
                    onClick={e => { e.stopPropagation(); setCurrent(c => (c + 1) % images.length) }}
                    className="absolute right-4 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/25"
                >
                    <ChevronRight className="h-7 w-7" />
                </button>
            )}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((img, i) => (
                        <button
                            key={i}
                            onClick={e => { e.stopPropagation(); setCurrent(i) }}
                            className={`relative h-14 w-14 overflow-hidden rounded-lg border-2 transition-all ${i === current ? "border-white scale-110" : "border-white/30 opacity-60"}`}
                        >
                            <Image src={img} alt="" fill className="object-cover" />
                        </button>
                    ))}
                </div>
            )}
            {images.length > 1 && (
                <span className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                    {current + 1} / {images.length}
                </span>
            )}
        </div>
    )
}

// ─── Ürün Detay Görüntüleme Modalı (Premium / Büyük) ─────────────────────────
function ProductDetailViewModal({
    product,
    onClose,
    onEdit,
    onDelete,
}: {
    product: Product
    onClose: () => void
    onEdit: (p: Product) => void
    onDelete: (p: Product) => void
}) {
    const [currentImage, setCurrentImage] = useState(0)
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [lightboxIndex, setLightboxIndex] = useState(0)

    const openLightbox = (index: number) => { setLightboxIndex(index); setLightboxOpen(true) }

    const isActive = product.status === "Aktif"
    const stockPct = Math.min(100, Math.round((product.stock / (product.stock + 50)) * 100))
    const stockColor = product.stock === 0 ? "bg-red-500" : product.stock < 15 ? "bg-orange-400" : "bg-green-500"
    const stockLabel = product.stock === 0 ? "Tükendi" : product.stock < 15 ? "Az Stok" : "Yeterli Stok"
    const stockTextColor = product.stock === 0 ? "text-red-600" : product.stock < 15 ? "text-orange-600" : "text-green-600"
    const diskountPct = product.original_price && product.original_price > product.price
        ? Math.round((1 - product.price / product.original_price) * 100)
        : null
    const profitMargin = product.cost_price && product.cost_price > 0
        ? Math.round(((product.price - product.cost_price) / product.cost_price) * 100)
        : null
    const specs = product.specifications && Object.keys(product.specifications).length > 0
        ? Object.entries(product.specifications)
        : null
    const addedDate = product.created_at
        ? new Date(product.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
        : null

    return (
        <>
            {lightboxOpen && product.images?.length > 0 && (
                <AdminLightbox images={product.images} initialIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} />
            )}

            {/* Backdrop */}
            <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
                <div
                    className="relative my-4 w-full max-w-6xl rounded-3xl bg-white shadow-2xl dark:bg-slate-900 overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Premium header bar */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-[#135bec] px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                                <Package className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-white/60">Ürün Detayı</p>
                                <h2 className="text-base font-bold text-white leading-tight line-clamp-1">{product.name}</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isActive ? "bg-green-500/20 text-green-300 ring-1 ring-green-500/40" : "bg-slate-500/20 text-slate-300"
                                }`}>
                                {isActive ? "● Aktif" : "○ Pasif"}
                            </span>
                            <button onClick={onClose} className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/25 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Ana içerik: sol görsel + sağ bilgiler */}
                    <div className="flex flex-col lg:flex-row">

                        {/* SOL: Görsel Galerisi */}
                        <div className="lg:w-[42%] flex-shrink-0 flex flex-col bg-slate-50 dark:bg-slate-800/50">
                            {product.images && product.images.length > 0 ? (
                                <div
                                    className="relative w-full cursor-zoom-in overflow-hidden bg-white dark:bg-slate-800"
                                    style={{ aspectRatio: "1/1" }}
                                    onClick={() => openLightbox(currentImage)}
                                >
                                    <Image
                                        src={product.images[currentImage]}
                                        alt={product.name}
                                        fill
                                        className="object-contain p-4 transition-transform duration-500 hover:scale-110"
                                        sizes="(max-width:1024px) 100vw, 42vw"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 hover:bg-black/10 hover:opacity-100 transition-all">
                                        <span className="flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-xl">
                                            <ZoomIn className="h-4 w-4" /> Tam Ekran Görüntüle
                                        </span>
                                    </div>
                                    {product.images.length > 1 && (
                                        <>
                                            <button onClick={e => { e.stopPropagation(); setCurrentImage(c => (c - 1 + product.images.length) % product.images.length) }}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 hover:bg-white shadow-md transition">
                                                <ChevronLeft className="h-5 w-5" />
                                            </button>
                                            <button onClick={e => { e.stopPropagation(); setCurrentImage(c => (c + 1) % product.images.length) }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 hover:bg-white shadow-md transition">
                                                <ChevronRight className="h-5 w-5" />
                                            </button>
                                            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                                                {currentImage + 1} / {product.images.length}
                                            </span>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800" style={{ aspectRatio: "1/1" }}>
                                    <Package className="h-32 w-32 text-slate-300" />
                                </div>
                            )}

                            {/* Thumbnails */}
                            {product.images && product.images.length > 1 && (
                                <div className="flex flex-wrap gap-2 p-4">
                                    {product.images.map((img, i) => (
                                        <button key={i} onClick={() => setCurrentImage(i)}
                                            className={`relative h-16 w-16 overflow-hidden rounded-xl border-2 transition-all ${i === currentImage ? "border-[#135bec] ring-2 ring-[#135bec]/20 scale-105" : "border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100"
                                                }`}
                                        >
                                            <Image src={img} alt="" fill className="object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* SKU + tarih küçük bilgi */}
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 space-y-1">
                                <div className="flex items-center gap-2">
                                    <Hash className="h-3.5 w-3.5" />
                                    <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">{product.sku}</span>
                                </div>
                                {addedDate && <p>Ekleme tarihi: {addedDate}</p>}
                            </div>
                        </div>

                        {/* SAĞ: Ürün Bilgi Paneli */}
                        <div className="flex-1 overflow-y-auto max-h-[85vh] divide-y divide-slate-100 dark:divide-slate-800">

                            {/* Başlık & Meta */}
                            <div className="p-6">
                                <div className="flex flex-wrap items-start gap-2 mb-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-slate-100 text-slate-500"
                                        }`}>{isActive ? "● Aktif" : "○ Pasif"}</span>
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 ${stockTextColor} dark:bg-slate-800`}>
                                        {stockLabel} ({product.stock} adet)
                                    </span>
                                    {diskountPct && (
                                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600">
                                            %{diskountPct} İndirim
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-2">{product.name}</h3>
                                <div className="flex items-center gap-3 text-sm text-slate-500">
                                    <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" />{product.brand}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{product.category}</span>
                                </div>
                            </div>

                            {/* Fiyat & Stok Analizi */}
                            <div className="p-6 space-y-4">
                                <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400">💰 Fiyat & Stok Analizi</h4>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {/* Toptan Fiyat */}
                                    <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-4 text-white">
                                        <p className="text-xs font-medium text-blue-200 mb-1">Toptan Fiyat</p>
                                        <p className="text-xl font-bold">{formatPrice(product.price)}</p>
                                        <p className="text-xs text-blue-200 mt-0.5">KDV Dahil</p>
                                    </div>
                                    {/* Piyasa Fiyatı */}
                                    {product.original_price ? (
                                        <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-4">
                                            <p className="text-xs font-medium text-slate-400 mb-1">Piyasa Fiyatı</p>
                                            <p className="text-xl font-bold text-slate-700 dark:text-slate-200">{formatPrice(product.original_price)}</p>
                                            {diskountPct && <p className="text-xs text-green-600 mt-0.5 font-medium">%{diskountPct} daha ucuz</p>}
                                        </div>
                                    ) : null}
                                    {/* Maliyet & Kâr */}
                                    {product.cost_price ? (
                                        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
                                            <p className="text-xs font-medium text-emerald-600 mb-1">Tahmini Kâr Marjı</p>
                                            <p className="text-xl font-bold text-emerald-700">{profitMargin !== null ? `%${profitMargin}` : "—"}</p>
                                            <p className="text-xs text-emerald-500 mt-0.5">Maliyet: {formatPrice(product.cost_price)}</p>
                                        </div>
                                    ) : null}
                                </div>

                                {/* Stok göstergesi */}
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-medium text-slate-700 dark:text-slate-300">Stok Durumu</span>
                                        <span className={`font-bold ${stockTextColor}`}>{product.stock} adet • {stockLabel}</span>
                                    </div>
                                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                        <div className={`h-full rounded-full transition-all ${stockColor}`} style={{ width: `${stockPct}%` }} />
                                    </div>
                                    {product.min_order_quantity > 1 && (
                                        <p className="mt-1.5 text-xs text-slate-400">Minimum sipariş: {product.min_order_quantity} adet</p>
                                    )}
                                </div>
                            </div>

                            {/* Açıklama */}
                            {product.description && (
                                <div className="p-6 space-y-2">
                                    <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400">📝 Ürün Açıklaması</h4>
                                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            {/* Teknik Özellikler */}
                            {specs && (
                                <div className="p-6 space-y-3">
                                    <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400">📱 Teknik Özellikler</h4>
                                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                                        {specs.map(([key, val], i) => (
                                            <div key={key} className={`flex items-start gap-4 px-4 py-3 text-sm ${i % 2 === 0 ? "bg-slate-50 dark:bg-slate-800/50" : "bg-white dark:bg-slate-900"
                                                }`}>
                                                <span className="w-36 flex-shrink-0 font-medium text-slate-500 dark:text-slate-400">{key}</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-100">{String(val)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Garanti & Teslimat */}
                            {(product.warranty_info || product.delivery_time) && (
                                <div className="p-6 space-y-3">
                                    <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400">🛡️ Garanti & Teslimat</h4>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {product.warranty_info && (
                                            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                                                <span className="text-2xl">🛡️</span>
                                                <div>
                                                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Garanti Bilgisi</p>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{product.warranty_info}</p>
                                                </div>
                                            </div>
                                        )}
                                        {product.delivery_time && (
                                            <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                                                <span className="text-2xl">🚚</span>
                                                <div>
                                                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Teslimat Süresi</p>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{product.delivery_time}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Aksiyon Butonları */}
                            <div className="sticky bottom-0 flex gap-3 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                                <Button variant="outline" className="flex-1 h-11" onClick={() => { onClose(); onEdit(product); }}>
                                    <Edit className="h-4 w-4" /> Düzenle
                                </Button>
                                <Button variant="danger" className="flex-1 h-11" onClick={() => { onClose(); onDelete(product); }}>
                                    <Trash2 className="h-4 w-4" /> Sil
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

interface Product {
    id: string
    sku: string
    name: string
    category: string
    brand: string
    price: number
    original_price: number | null
    cost_price: number | null
    stock: number
    min_order_quantity: number
    status: string
    image_url: string | null
    images: string[]
    description: string | null
    specifications: Record<string, string> | null
    warranty_info: string | null
    delivery_time: string | null
    created_at: string | null
}

interface Brand {
    id: string
    name: string
}

interface Category {
    id: string
    name: string
}

// Common memory/storage options
const memoryOptions = [
    "32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB"
]

// Common phone models per brand
const modelsByBrand: Record<string, string[]> = {
    "Apple": [
        "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
        "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
        "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
        "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 mini",
        "iPhone SE (3. Nesil)", "iPad Pro 12.9", "iPad Pro 11", "iPad Air",
        "MacBook Pro 16", "MacBook Pro 14", "MacBook Air M3", "MacBook Air M2",
        "Apple Watch Ultra 2", "Apple Watch Series 9", "AirPods Pro 2", "AirPods Max"
    ],
    "Samsung": [
        "Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24",
        "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23",
        "Galaxy Z Fold 5", "Galaxy Z Flip 5",
        "Galaxy Z Fold 4", "Galaxy Z Flip 4",
        "Galaxy A54", "Galaxy A34", "Galaxy A14",
        "Galaxy Tab S9 Ultra", "Galaxy Tab S9+", "Galaxy Tab S9",
        "Galaxy Watch 6", "Galaxy Buds 2 Pro"
    ],
    "Xiaomi": [
        "14 Ultra", "14 Pro", "14",
        "13 Ultra", "13 Pro", "13",
        "Redmi Note 13 Pro+", "Redmi Note 13 Pro", "Redmi Note 13",
        "Redmi 13", "Redmi 12",
        "POCO F5 Pro", "POCO F5", "POCO X5 Pro",
        "Pad 6 Pro", "Pad 6"
    ],
    "Huawei": [
        "Mate 60 Pro+", "Mate 60 Pro", "Mate 60",
        "P60 Pro", "P60 Art", "P60",
        "nova 12 Ultra", "nova 12 Pro", "nova 12",
        "MatePad Pro 13.2", "MatePad 11.5",
        "Watch GT 4", "Watch 4 Pro", "FreeBuds Pro 3"
    ],
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 0,
    }).format(price)
}

export default function UrunlerPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [brands, setBrands] = useState<Brand[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

    // Filter states
    const [searchQuery, setSearchQuery] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("")
    const [brandFilter, setBrandFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState("")

    // Compute filtered products
    const filteredProducts = products.filter(product => {
        const matchesSearch = !searchQuery ||
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = !categoryFilter || product.category === categoryFilter
        const matchesBrand = !brandFilter || product.brand === brandFilter
        const matchesStatus = !statusFilter || product.status === statusFilter
        return matchesSearch && matchesCategory && matchesBrand && matchesStatus
    })

    // Form states
    const [uploading, setUploading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        category_id: "",
        brand_id: "",
        model: "",
        memory: "",
        price: "",
        original_price: "",
        cost_price: "",
        stock: "",
        min_order_quantity: "1",
        status: "active",
        images: [] as string[],
        description: "",
        warranty_info: "",
        delivery_time: "",
        specifications: {} as Record<string, string>,
    })
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        await Promise.all([
            fetchProducts(),
            fetchBrands(),
            fetchCategories(),
        ])
    }

    const fetchBrands = async () => {
        const { data } = await supabase
            .from("brands")
            .select("id, name")
            .eq("is_active", true)
            .order("name")
        setBrands(data || [])
    }

    const fetchCategories = async () => {
        const { data } = await supabase
            .from("categories")
            .select("id, name")
            .eq("is_active", true)
            .order("name")
        setCategories(data || [])
    }

    const fetchProducts = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from("products")
                .select(`
                    id,
                    sku,
                    name,
                    description,
                    price,
                    original_price,
                    cost_price,
                    stock_quantity,
                    min_order_quantity,
                    status,
                    images,
                    specifications,
                    warranty_info,
                    delivery_time,
                    category_id,
                    brand_id,
                    categories (name),
                    brands (name),
                    created_at
                `)
                .order("created_at", { ascending: false })

            if (error) throw error

            const mapped = (data || []).map((p: any) => ({
                id: p.id,
                sku: p.sku,
                name: p.name,
                description: p.description || null,
                category: p.categories?.name || "Kategorisiz",
                brand: p.brands?.name || "Markasız",
                price: p.price,
                original_price: p.original_price || null,
                cost_price: p.cost_price || null,
                stock: p.stock_quantity,
                min_order_quantity: p.min_order_quantity || 1,
                status: p.status === "active" ? "Aktif" : "Pasif",
                image_url: p.images?.[0] || null,
                images: p.images || [],
                specifications: p.specifications || null,
                warranty_info: p.warranty_info || null,
                delivery_time: p.delivery_time || null,
                created_at: p.created_at || null,
            }))

            setProducts(mapped)
        } catch (error) {
            console.error("Error fetching products:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        try {
            setUploading(true)
            const files = Array.from(e.target.files)
            const uploadedUrls: string[] = []

            for (const file of files) {
                const fileExt = file.name.split(".").pop()
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from("product-images")
                    .upload(fileName, file, {
                        cacheControl: "3600",
                        upsert: false,
                    })

                if (uploadError) {
                    console.error("Upload error:", uploadError)
                    continue
                }

                const { data: { publicUrl } } = supabase.storage
                    .from("product-images")
                    .getPublicUrl(fileName)

                uploadedUrls.push(publicUrl)
            }

            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...uploadedUrls],
            }))
        } catch (error) {
            console.error("Error uploading images:", error)
            alert("Resim yüklenirken bir hata oluştu.")
        } finally {
            setUploading(false)
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }))
    }

    const generateSKU = () => {
        const brand = brands.find(b => b.id === formData.brand_id)
        const brandCode = brand ? brand.name.substring(0, 3).toUpperCase() : "XXX"
        const modelCode = formData.model ? formData.model.replace(/\s/g, "").substring(0, 8).toUpperCase() : "MODEL"
        const memoryCode = formData.memory || "XXX"
        const random = Math.random().toString(36).substring(2, 5).toUpperCase()
        return `AYN-${brandCode}-${modelCode}-${memoryCode}-${random}`
    }

    const handleBrandChange = (brandId: string) => {
        setFormData(prev => ({
            ...prev,
            brand_id: brandId,
            model: "", // Reset model when brand changes
        }))
    }

    const handleModelChange = (model: string) => {
        setFormData(prev => ({
            ...prev,
            model,
            name: formData.memory ? `${model} ${formData.memory}` : model,
        }))
    }

    const handleMemoryChange = (memory: string) => {
        setFormData(prev => ({
            ...prev,
            memory,
            name: formData.model ? `${formData.model} ${memory}` : memory,
        }))
    }

    const getModelsForBrand = () => {
        const brand = brands.find(b => b.id === formData.brand_id)
        if (!brand) return []
        return modelsByBrand[brand.name] || []
    }

    const handleAdd = async () => {
        try {
            setLoading(true)
            const { error } = await supabase.from("products").insert([
                {
                    name: formData.name || `${formData.model} ${formData.memory}`.trim(),
                    sku: formData.sku || generateSKU(),
                    description: formData.description || null,
                    price: Number(formData.price),
                    original_price: formData.original_price ? Number(formData.original_price) : null,
                    cost_price: formData.cost_price ? Number(formData.cost_price) : null,
                    stock_quantity: Number(formData.stock),
                    min_order_quantity: Number(formData.min_order_quantity) || 1,
                    status: formData.status,
                    images: formData.images,
                    category_id: formData.category_id || null,
                    brand_id: formData.brand_id || null,
                    warranty_info: formData.warranty_info || null,
                    delivery_time: formData.delivery_time || null,
                    specifications: Object.keys(formData.specifications).length > 0 ? formData.specifications : null,
                },
            ])

            if (error) throw error

            await fetchProducts()
            setIsAddModalOpen(false)
            resetForm()
        } catch (error) {
            console.error("Error adding product:", error)
            alert("Ürün eklenirken bir hata oluştu: " + (error as any)?.message)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = async () => {
        if (!selectedProduct) return

        try {
            setLoading(true)
            const { error } = await supabase
                .from("products")
                .update({
                    name: formData.name,
                    sku: formData.sku,
                    description: formData.description || null,
                    price: Number(formData.price),
                    original_price: formData.original_price ? Number(formData.original_price) : null,
                    cost_price: formData.cost_price ? Number(formData.cost_price) : null,
                    stock_quantity: Number(formData.stock),
                    min_order_quantity: Number(formData.min_order_quantity) || 1,
                    status: formData.status,
                    images: formData.images,
                    category_id: formData.category_id || null,
                    brand_id: formData.brand_id || null,
                    warranty_info: formData.warranty_info || null,
                    delivery_time: formData.delivery_time || null,
                    specifications: Object.keys(formData.specifications).length > 0 ? formData.specifications : null,
                })
                .eq("id", selectedProduct.id)

            if (error) throw error

            await fetchProducts()
            setIsEditModalOpen(false)
        } catch (error) {
            console.error("Error updating product:", error)
            alert("Ürün güncellenirken bir hata oluştu: " + (error as any)?.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedProduct) return

        try {
            setLoading(true)
            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", selectedProduct.id)

            if (error) throw error

            setProducts(products.filter(p => p.id !== selectedProduct.id))
            setIsDeleteModalOpen(false)
            setSelectedProduct(null)
        } catch (error) {
            console.error("Error deleting product:", error)
            alert("Ürün silinirken bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            name: "",
            sku: "",
            category_id: "",
            brand_id: "",
            model: "",
            memory: "",
            price: "",
            original_price: "",
            cost_price: "",
            stock: "",
            min_order_quantity: "1",
            status: "active",
            images: [],
            description: "",
            warranty_info: "",
            delivery_time: "",
            specifications: {},
        })
    }

    const openEditModal = (product: Product) => {
        setSelectedProduct(product)
        setFormData({
            name: product.name,
            sku: product.sku,
            category_id: "",
            brand_id: "",
            model: "",
            memory: "",
            price: String(product.price),
            original_price: product.original_price ? String(product.original_price) : "",
            cost_price: product.cost_price ? String(product.cost_price) : "",
            stock: String(product.stock),
            min_order_quantity: String(product.min_order_quantity || 1),
            status: product.status === "Aktif" ? "active" : "inactive",
            images: product.images || [],
            description: product.description || "",
            warranty_info: product.warranty_info || "",
            delivery_time: product.delivery_time || "",
            specifications: product.specifications || {},
        })
        setIsEditModalOpen(true)
    }

    // Spec helpers
    const addSpecRow = () => {
        const key = prompt("Özellik adı (örn: RAM, Ekran, Renk):")
        if (!key) return
        setFormData(prev => ({ ...prev, specifications: { ...prev.specifications, [key]: "" } }))
    }
    const updateSpecValue = (key: string, val: string) => {
        setFormData(prev => ({ ...prev, specifications: { ...prev.specifications, [key]: val } }))
    }
    const removeSpecRow = (key: string) => {
        setFormData(prev => {
            const updated = { ...prev.specifications }
            delete updated[key]
            return { ...prev, specifications: updated }
        })
    }


    return (
        <div className="flex-1 overflow-auto p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Ürün Yönetimi
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Katalogdaki ürünleri yönetin
                    </p>
                </div>
                <Button onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
                    <Plus className="h-4 w-4" />
                    Yeni Ürün Ekle
                </Button>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Ürün adı veya SKU ile ara..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="">Tüm Kategoriler</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                </select>
                <select
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                >
                    <option value="">Tüm Markalar</option>
                    {brands.map(brand => (
                        <option key={brand.id} value={brand.name}>{brand.name}</option>
                    ))}
                </select>
                <select
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">Tüm Durumlar</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Pasif">Pasif</option>
                </select>
                {(searchQuery || categoryFilter || brandFilter || statusFilter) && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSearchQuery("")
                            setCategoryFilter("")
                            setBrandFilter("")
                            setStatusFilter("")
                        }}
                    >
                        <X className="h-4 w-4 mr-1" /> Filtreleri Temizle
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Ürün</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">SKU</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Kategori</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Fiyat</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Stok</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Durum</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {loading && products.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                                        <p className="mt-2">Ürünler yükleniyor...</p>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        Hiç ürün bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="cursor-pointer transition-colors hover:bg-blue-50/60 dark:hover:bg-slate-800/70"
                                        onClick={() => { setSelectedProduct(product); setIsViewModalOpen(true); }}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 flex-shrink-0">
                                                    {product.image_url ? (
                                                        <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                                                            <ImagePlus className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{product.name}</p>
                                                    <p className="text-xs text-slate-500">{product.brand}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-slate-600 dark:text-slate-300">{product.sku}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{product.category}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white">{formatPrice(product.price)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-medium ${product.stock === 0 ? "text-red-600" : product.stock < 15 ? "text-orange-600" : "text-green-600"}`}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={product.status === "Aktif" ? "success" : "default"}>
                                                {product.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => openEditModal(product)}
                                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#135bec] dark:hover:bg-slate-700"
                                                    title="Düzenle"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedProduct(product); setIsDeleteModalOpen(true); }}
                                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                                                    title="Sil"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Product Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Yeni Ürün Ekle" size="lg">
                <ProductForm
                    formData={formData}
                    setFormData={setFormData}
                    brands={brands}
                    categories={categories}
                    memoryOptions={memoryOptions}
                    modelsForBrand={getModelsForBrand()}
                    uploading={uploading}
                    loading={loading}
                    fileInputRef={fileInputRef}
                    onImageUpload={handleImageUpload}
                    onRemoveImage={removeImage}
                    onBrandChange={handleBrandChange}
                    onModelChange={handleModelChange}
                    onMemoryChange={handleMemoryChange}
                    onGenerateSKU={generateSKU}
                    onAddSpecRow={addSpecRow}
                    onUpdateSpecValue={updateSpecValue}
                    onRemoveSpecRow={removeSpecRow}
                    onSubmit={handleAdd}
                    onCancel={() => setIsAddModalOpen(false)}
                />
            </Modal>

            {/* Edit Product Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Ürün Düzenle" size="lg">
                <ProductForm
                    isEdit
                    formData={formData}
                    setFormData={setFormData}
                    brands={brands}
                    categories={categories}
                    memoryOptions={memoryOptions}
                    modelsForBrand={getModelsForBrand()}
                    uploading={uploading}
                    loading={loading}
                    fileInputRef={fileInputRef}
                    onImageUpload={handleImageUpload}
                    onRemoveImage={removeImage}
                    onBrandChange={handleBrandChange}
                    onModelChange={handleModelChange}
                    onMemoryChange={handleMemoryChange}
                    onGenerateSKU={generateSKU}
                    onAddSpecRow={addSpecRow}
                    onUpdateSpecValue={updateSpecValue}
                    onRemoveSpecRow={removeSpecRow}
                    onSubmit={handleEdit}
                    onCancel={() => setIsEditModalOpen(false)}
                />
            </Modal>

            {/* Detaylı Yeni View Modal */}
            {isViewModalOpen && selectedProduct && (
                <ProductDetailViewModal
                    product={selectedProduct}
                    onClose={() => setIsViewModalOpen(false)}
                    onEdit={(p) => { openEditModal(p) }}
                    onDelete={(p) => { setSelectedProduct(p); setIsDeleteModalOpen(true); }}
                />
            )}

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Ürünü Sil" size="sm">
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-300">
                        <strong>{selectedProduct?.name}</strong> ürününü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>İptal</Button>
                        <Button variant="danger" onClick={handleDelete} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Sil
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
