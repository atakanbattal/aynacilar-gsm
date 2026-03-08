"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import {
    Search,
    Filter,
    Heart,
    ShoppingCart,
    Plus,
    Minus,
    X,
    Check,
    Loader2,
    Package,
    Music,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    List,
    Grid,
} from "lucide-react"

interface Product {
    id: string
    sku: string
    name: string
    description: string | null
    price: number
    original_price: number | null
    stock_quantity: number
    status: string
    images: string[]
    categories: { name: string } | null
    brands: { name: string } | null
}

type CartItem = {
    product: Product
    quantity: number
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 2,
    }).format(price)
}

function getStockStatus(quantity: number): { label: string; variant: "success" | "warning" | "danger" } {
    if (quantity <= 0) return { label: "Stok Yok", variant: "danger" }
    if (quantity < 10) return { label: "Az Stok", variant: "warning" }
    return { label: "Stokta", variant: "success" }
}

// ─── Lightbox (Fotoğraf Büyütme) Bileşeni ──────────────────────────────────
function Lightbox({
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
            if (e.key === "ArrowRight") setCurrent((c) => (c + 1) % images.length)
            if (e.key === "ArrowLeft") setCurrent((c) => (c - 1 + images.length) % images.length)
        }
        window.addEventListener("keydown", handleKey)
        return () => window.removeEventListener("keydown", handleKey)
    }, [images.length, onClose])

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Close */}
            <button
                onClick={onClose}
                className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            >
                <X className="h-6 w-6" />
            </button>

            {/* Navigation Left */}
            {images.length > 1 && (
                <button
                    onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c - 1 + images.length) % images.length) }}
                    className="absolute left-4 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
                >
                    <ChevronLeft className="h-7 w-7" />
                </button>
            )}

            {/* Image */}
            <div
                className="relative w-full max-w-4xl max-h-[90vh] aspect-square mx-16"
                onClick={(e) => e.stopPropagation()}
            >
                <Image
                    src={images[current]}
                    alt="Ürün fotoğrafı"
                    fill
                    className="object-contain"
                    sizes="90vw"
                />
            </div>

            {/* Navigation Right */}
            {images.length > 1 && (
                <button
                    onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c + 1) % images.length) }}
                    className="absolute right-4 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
                >
                    <ChevronRight className="h-7 w-7" />
                </button>
            )}

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((img, i) => (
                        <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); setCurrent(i) }}
                            className={`relative h-12 w-12 overflow-hidden rounded-md border-2 transition-all ${i === current ? "border-white" : "border-white/30"}`}
                        >
                            <Image src={img} alt="" fill className="object-cover" />
                        </button>
                    ))}
                </div>
            )}

            {/* Counter */}
            {images.length > 1 && (
                <span className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                    {current + 1} / {images.length}
                </span>
            )}
        </div>
    )
}

// ─── Ürün Kartı (Grid) ────────────────────────────────────────────────────
function ProductCard({
    product,
    onRequestClick,
    onImageClick,
}: {
    product: Product
    onRequestClick: (p: Product) => void
    onImageClick: (images: string[], index: number) => void
}) {
    const stockStatus = getStockStatus(product.stock_quantity)
    const isMusicPlayer = product.categories?.name?.toLowerCase().includes("müzik çalar") ||
        product.categories?.name?.toLowerCase().includes("muzik calar") ||
        product.categories?.name?.toLowerCase().includes("speaker") ||
        product.categories?.name?.toLowerCase().includes("hoparlör") ||
        product.categories?.name?.toLowerCase().includes("bluetooth")

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-[#135bec]/40 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800">
            {/* Wishlist */}
            <button className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 text-slate-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 dark:bg-slate-900/90">
                <Heart className="h-4 w-4" />
            </button>

            {/* Badges */}
            <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
                <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                {isMusicPlayer && (
                    <span className="flex items-center gap-1 rounded-full bg-purple-600 px-2 py-0.5 text-xs font-semibold text-white shadow">
                        <Music className="h-3 w-3" /> Müzik Çalar
                    </span>
                )}
            </div>

            {/* Image — büyük, ön planda */}
            <div
                className="relative w-full overflow-hidden bg-slate-50 dark:bg-slate-900"
                style={{ aspectRatio: "1 / 1.05", minHeight: 220 }}
            >
                {product.images && product.images.length > 0 ? (
                    <>
                        <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        {/* Zoom overlay */}
                        <button
                            onClick={() => onImageClick(product.images, 0)}
                            className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100"
                        >
                            <span className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-800 shadow-lg">
                                <ZoomIn className="h-4 w-4" /> Büyüt
                            </span>
                        </button>
                    </>
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-16 w-16 text-slate-300" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col p-4">
                <p className="mb-1 font-mono text-xs text-slate-400">{product.sku}</p>
                <h3 className="mb-1 line-clamp-2 text-sm font-bold text-slate-900 leading-snug dark:text-white">
                    {product.name}
                </h3>
                <p className="mb-3 text-xs text-slate-500">
                    {product.brands?.name || "Marka Yok"} • {product.categories?.name || "Kategori Yok"}
                </p>

                <div className="mt-auto">
                    <div className="mb-3 flex items-baseline gap-2">
                        <span className="text-xl font-bold text-[#135bec]">
                            {formatPrice(product.price)}
                        </span>
                        {product.original_price && (
                            <span className="text-sm text-slate-400 line-through">
                                {formatPrice(product.original_price)}
                            </span>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Link href={`/katalog/${product.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                                Detaylar
                            </Button>
                        </Link>
                        <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => onRequestClick(product)}
                            disabled={product.stock_quantity <= 0}
                        >
                            + Talep Et
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Ürün Satırı (Liste) ──────────────────────────────────────────────────
function ProductRow({
    product,
    onRequestClick,
    onImageClick,
}: {
    product: Product
    onRequestClick: (p: Product) => void
    onImageClick: (images: string[], index: number) => void
}) {
    const stockStatus = getStockStatus(product.stock_quantity)
    const isMusicPlayer = product.categories?.name?.toLowerCase().includes("müzik çalar") ||
        product.categories?.name?.toLowerCase().includes("muzik calar") ||
        product.categories?.name?.toLowerCase().includes("speaker") ||
        product.categories?.name?.toLowerCase().includes("hoparlör") ||
        product.categories?.name?.toLowerCase().includes("bluetooth")

    return (
        <div className="group flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-[#135bec]/40 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
            {/* Large image */}
            <div
                className="relative h-28 w-28 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-900"
                onClick={() => product.images?.length > 0 && onImageClick(product.images, 0)}
            >
                {product.images && product.images.length > 0 ? (
                    <>
                        <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                            <ZoomIn className="h-6 w-6 text-white drop-shadow" />
                        </div>
                    </>
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-10 w-10 text-slate-300" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex flex-1 items-center gap-4 min-w-0">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                        {isMusicPlayer && (
                            <span className="flex items-center gap-1 rounded-full bg-purple-600 px-2 py-0.5 text-xs font-semibold text-white">
                                <Music className="h-3 w-3" /> Müzik Çalar
                            </span>
                        )}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white leading-snug truncate">{product.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">{product.sku}</p>
                    <p className="text-xs text-slate-500 mt-1">
                        {product.brands?.name || "Marka Yok"} · {product.categories?.name || "Kategori Yok"}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <div className="text-right">
                        <span className="text-xl font-bold text-[#135bec]">{formatPrice(product.price)}</span>
                        {product.original_price && (
                            <p className="text-xs text-slate-400 line-through">{formatPrice(product.original_price)}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/katalog/${product.id}`}>
                            <Button variant="outline" size="sm">Detaylar</Button>
                        </Link>
                        <Button
                            size="sm"
                            onClick={() => onRequestClick(product)}
                            disabled={product.stock_quantity <= 0}
                        >
                            + Talep Et
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────
export default function KatalogPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("")
    const [cart, setCart] = useState<CartItem[]>([])
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [isSuccessOpen, setIsSuccessOpen] = useState(false)
    const [requestModalProduct, setRequestModalProduct] = useState<Product | null>(null)
    const [quantity, setQuantity] = useState(1)
    const [dealerId, setDealerId] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

    // Lightbox
    const [lightboxImages, setLightboxImages] = useState<string[]>([])
    const [lightboxIndex, setLightboxIndex] = useState(0)
    const [lightboxOpen, setLightboxOpen] = useState(false)

    const openLightbox = (images: string[], index: number) => {
        setLightboxImages(images)
        setLightboxIndex(index)
        setLightboxOpen(true)
    }

    useEffect(() => {
        fetchProducts()
        if (user) {
            fetchDealerId()
        }
    }, [user])

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
                    stock_quantity,
                    status,
                    images,
                    categories (name),
                    brands (name)
                `)
                .eq("status", "active")
                .order("created_at", { ascending: false })

            if (error) throw error
            const mappedData = (data || []).map((p: any) => ({
                id: p.id,
                sku: p.sku,
                name: p.name,
                description: p.description,
                price: p.price,
                original_price: p.original_price,
                stock_quantity: p.stock_quantity,
                status: p.status,
                images: p.images,
                categories: p.categories,
                brands: p.brands,
            })) as Product[]
            setProducts(mappedData)
        } catch (error) {
            console.error("Error fetching products:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchDealerId = async () => {
        const { data } = await supabase
            .from("dealers")
            .select("id")
            .eq("user_id", user?.id)
            .single()

        if (data) {
            setDealerId(data.id)
        }
    }

    const addToCart = (product: Product, qty: number) => {
        const existingItem = cart.find(item => item.product.id === product.id)
        if (existingItem) {
            setCart(cart.map(item =>
                item.product.id === product.id
                    ? { ...item, quantity: item.quantity + qty }
                    : item
            ))
        } else {
            setCart([...cart, { product, quantity: qty }])
        }
        setRequestModalProduct(null)
        setQuantity(1)
    }

    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.product.id !== productId))
    }

    const updateCartQuantity = (productId: string, newQty: number) => {
        if (newQty <= 0) {
            removeFromCart(productId)
        } else {
            setCart(cart.map(item =>
                item.product.id === productId
                    ? { ...item, quantity: newQty }
                    : item
            ))
        }
    }

    const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

    const submitRequest = async () => {
        if (!dealerId) {
            alert("Bayi bilgisi bulunamadı. Lütfen tekrar giriş yapın.")
            return
        }

        if (cart.length === 0) {
            alert("Sepetiniz boş")
            return
        }

        try {
            setSubmitting(true)

            const requestNumber = `REQ-${Date.now()}`

            const { data: requestData, error: requestError } = await supabase
                .from("requests")
                .insert({
                    request_number: requestNumber,
                    dealer_id: dealerId,
                    status: "pending",
                    total_amount: cartTotal,
                    notes: null,
                })
                .select()
                .single()

            if (requestError) throw requestError

            const requestItems = cart.map(item => ({
                request_id: requestData.id,
                product_id: item.product.id,
                quantity: item.quantity,
                unit_price: item.product.price,
                total_price: item.product.price * item.quantity,
            }))

            const { error: itemsError } = await supabase
                .from("request_items")
                .insert(requestItems)

            if (itemsError) throw itemsError

            setIsCartOpen(false)
            setIsSuccessOpen(true)
            setCart([])
        } catch (error: any) {
            console.error("Error creating request:", error)
            alert("Talep oluşturulurken hata oluştu: " + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    // Kategorileri çıkar (müzik çalar filtresi için)
    const categories = Array.from(new Set(products.map(p => p.categories?.name).filter(Boolean))) as string[]
    const isMusicCategory = (cat: string) =>
        cat.toLowerCase().includes("müzik") ||
        cat.toLowerCase().includes("muzik") ||
        cat.toLowerCase().includes("speaker") ||
        cat.toLowerCase().includes("hoparlör") ||
        cat.toLowerCase().includes("bluetooth")

    const filteredProducts = products.filter(product => {
        const matchesSearch = !searchQuery || (() => {
            const q = searchQuery.toLowerCase()
            return (
                product.name.toLowerCase().includes(q) ||
                product.sku.toLowerCase().includes(q) ||
                product.brands?.name?.toLowerCase().includes(q) ||
                product.categories?.name?.toLowerCase().includes(q)
            )
        })()

        const matchesCategory = !selectedCategory || product.categories?.name === selectedCategory

        return matchesSearch && matchesCategory
    })

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#135bec]" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Lightbox */}
            {lightboxOpen && (
                <Lightbox
                    images={lightboxImages}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxOpen(false)}
                />
            )}

            {/* Page Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Ürün Kataloğu
                    </h2>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">
                        Toptan stokları inceleyin ve tedarik taleplerinizi yönetin.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* View mode toggle */}
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden dark:border-slate-700">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`px-3 py-2 transition-colors ${viewMode === "grid" ? "bg-[#135bec] text-white" : "bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400"}`}
                        >
                            <Grid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`px-3 py-2 transition-colors ${viewMode === "list" ? "bg-[#135bec] text-white" : "bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400"}`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Cart Button */}
                    <Button onClick={() => setIsCartOpen(true)} className="relative">
                        <ShoppingCart className="h-5 w-5" />
                        Sepet
                        {cartItemCount > 0 && (
                            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                {cartItemCount}
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="SKU, ürün adı, marka veya kategori ile ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Category filter chips */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory("")}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors border ${!selectedCategory ? "bg-[#135bec] text-white border-[#135bec]" : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700"}`}
                    >
                        Tümü
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
                            className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition-colors border ${selectedCategory === cat ? "bg-[#135bec] text-white border-[#135bec]" : "border-slate-200 text-slate-500 hover:border-[#135bec] hover:text-[#135bec] dark:border-slate-700"}`}
                        >
                            {isMusicCategory(cat) && <Music className="h-3 w-3" />}
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results count */}
            <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-900 dark:text-white">{filteredProducts.length}</span> ürün listeleniyor
            </p>

            {/* Product Grid / List */}
            {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        <Package className="h-8 w-8 text-slate-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Ürün bulunamadı
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Arama kriterlerinize uygun ürün yok
                        </p>
                    </div>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onRequestClick={setRequestModalProduct}
                            onImageClick={openLightbox}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filteredProducts.map((product) => (
                        <ProductRow
                            key={product.id}
                            product={product}
                            onRequestClick={setRequestModalProduct}
                            onImageClick={openLightbox}
                        />
                    ))}
                </div>
            )}

            {/* Request Modal */}
            <Modal
                isOpen={requestModalProduct !== null}
                onClose={() => { setRequestModalProduct(null); setQuantity(1); }}
                title="Talep Oluştur"
            >
                {requestModalProduct && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div
                                className="relative h-24 w-24 flex-shrink-0 cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
                                onClick={() =>
                                    requestModalProduct.images?.length > 0 &&
                                    openLightbox(requestModalProduct.images, 0)
                                }
                            >
                                {requestModalProduct.images && requestModalProduct.images.length > 0 ? (
                                    <Image src={requestModalProduct.images[0]} alt={requestModalProduct.name} fill className="object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-slate-100">
                                        <Package className="h-8 w-8 text-slate-300" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">{requestModalProduct.name}</h3>
                                <p className="text-sm text-slate-500">{requestModalProduct.sku}</p>
                                <p className="text-lg font-bold text-[#135bec]">{formatPrice(requestModalProduct.price)}</p>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Adet</label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-[#135bec] hover:text-[#135bec] dark:border-slate-700"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <Input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-20 text-center"
                                />
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-[#135bec] hover:text-[#135bec] dark:border-slate-700"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Toplam Tutar:</span>
                                <span className="text-xl font-bold text-[#135bec]">{formatPrice(requestModalProduct.price * quantity)}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => { setRequestModalProduct(null); setQuantity(1); }}>İptal</Button>
                            <Button className="flex-1" onClick={() => addToCart(requestModalProduct, quantity)}>
                                <ShoppingCart className="h-4 w-4" />
                                Sepete Ekle
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Cart Modal */}
            <Modal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title="Talep Sepeti" size="lg">
                {cart.length === 0 ? (
                    <div className="py-12 text-center">
                        <ShoppingCart className="mx-auto h-16 w-16 text-slate-300" />
                        <p className="mt-4 text-slate-500">Sepetiniz boş</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {cart.map((item) => (
                            <div key={item.product.id} className="flex items-center gap-4 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                                <div
                                    className="relative h-16 w-16 flex-shrink-0 cursor-zoom-in overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                                    onClick={() => item.product.images?.length > 0 && openLightbox(item.product.images, 0)}
                                >
                                    {item.product.images && item.product.images.length > 0 ? (
                                        <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-slate-100">
                                            <Package className="h-6 w-6 text-slate-300" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-slate-900 dark:text-white">{item.product.name}</h4>
                                    <p className="text-sm text-slate-500">{formatPrice(item.product.price)} x {item.quantity}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)} className="p-1 text-slate-400 hover:text-slate-600">
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                                    <button onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)} className="p-1 text-slate-400 hover:text-slate-600">
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="w-28 text-right font-bold text-slate-900 dark:text-white">
                                    {formatPrice(item.product.price * item.quantity)}
                                </p>
                                <button onClick={() => removeFromCart(item.product.id)} className="p-1 text-slate-400 hover:text-red-500">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        ))}

                        <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                            <div className="flex justify-between text-lg">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Toplam:</span>
                                <span className="text-2xl font-bold text-[#135bec]">{formatPrice(cartTotal)}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setIsCartOpen(false)}>Alışverişe Devam Et</Button>
                            <Button className="flex-1" onClick={submitRequest} disabled={submitting}>
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                Talep Oluştur
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Success Modal */}
            <Modal isOpen={isSuccessOpen} onClose={() => setIsSuccessOpen(false)} size="sm">
                <div className="py-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Talep Oluşturuldu!</h3>
                    <p className="mb-6 text-slate-500">Talebiniz başarıyla alındı. Size en kısa sürede dönüş yapılacaktır.</p>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setIsSuccessOpen(false)}>Tamam</Button>
                        <Button className="flex-1" onClick={() => { setIsSuccessOpen(false); router.push("/taleplerim") }}>
                            Taleplerime Git
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
