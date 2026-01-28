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
    Upload,
    Loader2,
    ImagePlus,
} from "lucide-react"

interface Product {
    id: string
    sku: string
    name: string
    category: string
    brand: string
    price: number
    stock: number
    status: string
    image_url: string | null
    images: string[]
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
        stock: "",
        status: "active",
        images: [] as string[],
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
                    price,
                    stock_quantity,
                    status,
                    images,
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
                category: p.categories?.name || "Kategorisiz",
                brand: p.brands?.name || "Markasız",
                price: p.price,
                stock: p.stock_quantity,
                status: p.status === "active" ? "Aktif" : "Pasif",
                image_url: p.images?.[0] || null,
                images: p.images || [],
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
                    price: Number(formData.price),
                    stock_quantity: Number(formData.stock),
                    status: formData.status,
                    images: formData.images,
                    category_id: formData.category_id || null,
                    brand_id: formData.brand_id || null,
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
                    price: Number(formData.price),
                    stock_quantity: Number(formData.stock),
                    status: formData.status,
                    images: formData.images,
                    category_id: formData.category_id || null,
                    brand_id: formData.brand_id || null,
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
            stock: "",
            status: "active",
            images: [],
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
            stock: String(product.stock),
            status: product.status === "Aktif" ? "active" : "inactive",
            images: product.images || [],
        })
        setIsEditModalOpen(true)
    }

    // Form component for Add/Edit
    const ProductForm = ({ isEdit = false }: { isEdit?: boolean }) => (
        <div className="space-y-4">
            {/* Image Upload Section */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Ürün Resimleri
                </label>
                <div className="flex flex-wrap gap-3">
                    {formData.images.map((url, index) => (
                        <div key={index} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                            <Image src={url} alt={`Product ${index + 1}`} fill className="object-cover" />
                            <button
                                onClick={() => removeImage(index)}
                                className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition-colors hover:border-[#135bec] hover:text-[#135bec] dark:border-slate-700 dark:bg-slate-800"
                    >
                        {uploading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <>
                                <ImagePlus className="h-6 w-6" />
                                <span className="mt-1 text-xs">Ekle</span>
                            </>
                        )}
                    </button>
                </div>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                />
                <p className="text-xs text-slate-500">Birden fazla resim seçebilirsiniz</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {/* Brand Select */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Marka *</label>
                    <select
                        value={formData.brand_id}
                        onChange={(e) => handleBrandChange(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800"
                    >
                        <option value="">Marka Seçin</option>
                        {brands.map(brand => (
                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                    </select>
                </div>

                {/* Category Select */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Kategori *</label>
                    <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800"
                    >
                        <option value="">Kategori Seçin</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {/* Model Select */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Model *</label>
                    <select
                        value={formData.model}
                        onChange={(e) => handleModelChange(e.target.value)}
                        disabled={!formData.brand_id}
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"
                    >
                        <option value="">Model Seçin</option>
                        {getModelsForBrand().map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                </div>

                {/* Memory Select */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Hafıza/Depolama</label>
                    <select
                        value={formData.memory}
                        onChange={(e) => handleMemoryChange(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800"
                    >
                        <option value="">Hafıza Seçin (Opsiyonel)</option>
                        {memoryOptions.map(mem => (
                            <option key={mem} value={mem}>{mem}</option>
                        ))}
                    </select>
                </div>

                {/* Product Name (Auto-generated or custom) */}
                <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Ürün Adı</label>
                    <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Otomatik oluşturulur veya özel girin"
                    />
                    <p className="mt-1 text-xs text-slate-500">Model ve hafıza seçildiğinde otomatik oluşturulur</p>
                </div>

                {/* SKU */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">SKU</label>
                    <div className="flex gap-2">
                        <Input
                            value={formData.sku}
                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            placeholder="Otomatik oluşturulur"
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData({ ...formData, sku: generateSKU() })}
                        >
                            Oluştur
                        </Button>
                    </div>
                </div>

                {/* Status */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Durum</label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800"
                    >
                        <option value="active">Aktif</option>
                        <option value="inactive">Pasif</option>
                    </select>
                </div>

                {/* Price */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Fiyat (₺) *</label>
                    <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="64999"
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm focus:border-[#135bec] focus:outline-none focus:ring-2 focus:ring-[#135bec]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                </div>

                {/* Stock */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Stok Miktarı *</label>
                    <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        placeholder="100"
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm focus:border-[#135bec] focus:outline-none focus:ring-2 focus:ring-[#135bec]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => isEdit ? setIsEditModalOpen(false) : setIsAddModalOpen(false)}>
                    İptal
                </Button>
                <Button onClick={isEdit ? handleEdit : handleAdd} disabled={loading || uploading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isEdit ? "Kaydet" : "Ürün Ekle"}
                </Button>
            </div>
        </div>
    )

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
                                    <tr key={product.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                                                    {product.image_url ? (
                                                        <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                                                            <ImagePlus className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{product.name}</p>
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
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => { setSelectedProduct(product); setIsViewModalOpen(true); }}
                                                    className="p-1 text-slate-400 hover:text-[#135bec]"
                                                    title="Görüntüle"
                                                >
                                                    <Eye className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(product)}
                                                    className="p-1 text-slate-400 hover:text-[#135bec]"
                                                    title="Düzenle"
                                                >
                                                    <Edit className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedProduct(product); setIsDeleteModalOpen(true); }}
                                                    className="p-1 text-slate-400 hover:text-red-500"
                                                    title="Sil"
                                                >
                                                    <Trash2 className="h-5 w-5" />
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
                <ProductForm />
            </Modal>

            {/* Edit Product Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Ürün Düzenle" size="lg">
                <ProductForm isEdit />
            </Modal>

            {/* View Product Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Ürün Detayları">
                {selectedProduct && (
                    <div className="space-y-4">
                        {/* Images Gallery */}
                        {selectedProduct.images && selectedProduct.images.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedProduct.images.map((url, idx) => (
                                    <div key={idx} className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                                        <Image src={url} alt={`${selectedProduct.name} ${idx + 1}`} fill className="object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedProduct.name}</h3>
                            <p className="text-sm text-slate-500">{selectedProduct.brand} • {selectedProduct.category}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                            <div><span className="text-sm text-slate-500">SKU:</span><p className="font-medium">{selectedProduct.sku}</p></div>
                            <div><span className="text-sm text-slate-500">Fiyat:</span><p className="font-medium text-[#135bec]">{formatPrice(selectedProduct.price)}</p></div>
                            <div><span className="text-sm text-slate-500">Stok:</span><p className="font-medium">{selectedProduct.stock} adet</p></div>
                            <div><span className="text-sm text-slate-500">Durum:</span><p><Badge variant={selectedProduct.status === "Aktif" ? "success" : "default"}>{selectedProduct.status}</Badge></p></div>
                        </div>
                    </div>
                )}
            </Modal>

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
