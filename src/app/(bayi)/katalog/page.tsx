"use client"

import { useState, useEffect } from "react"
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
            // Transform nested data from Supabase (converts array relations to single objects)
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

            // Generate request number
            const requestNumber = `REQ-${Date.now()}`

            // Create request
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

            // Create request items
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

    const filteredProducts = products.filter(product => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            product.name.toLowerCase().includes(query) ||
            product.sku.toLowerCase().includes(query) ||
            product.brands?.name?.toLowerCase().includes(query)
        )
    })

    const getProductImage = (product: Product) => {
        if (product.images && product.images.length > 0) {
            return product.images[0]
        }
        return "/placeholder-product.png"
    }

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#135bec]" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
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
                    <span className="text-sm text-slate-500">Sırala:</span>
                    <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-[#135bec] focus:outline-none focus:ring-2 focus:ring-[#135bec]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <option>En Yeni Gelenler</option>
                        <option>Fiyat: Düşükten Yükseğe</option>
                        <option>Fiyat: Yüksekten Düşüğe</option>
                    </select>

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
                        placeholder="SKU, ürün adı veya marka ile ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:hover:border-slate-600">
                    <Filter className="h-4 w-4" />
                    Filtrele
                </button>
            </div>

            {/* Product Grid */}
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
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredProducts.map((product) => {
                        const stockStatus = getStockStatus(product.stock_quantity)
                        return (
                            <div
                                key={product.id}
                                className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-[#135bec]/30 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
                            >
                                {/* Wishlist */}
                                <button className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 text-slate-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100">
                                    <Heart className="h-4 w-4" />
                                </button>

                                {/* Status Badge */}
                                <div className="absolute left-3 top-3 z-10">
                                    <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                                </div>

                                {/* Image */}
                                <div className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-900">
                                    {product.images && product.images.length > 0 ? (
                                        <Image
                                            src={product.images[0]}
                                            alt={product.name}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <Package className="h-12 w-12 text-slate-300" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex flex-1 flex-col p-4">
                                    <p className="mb-1 font-mono text-xs text-slate-400">{product.sku}</p>
                                    <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-slate-900 transition-colors hover:text-[#135bec] dark:text-white">
                                        {product.name}
                                    </h3>
                                    <p className="mb-3 text-xs text-slate-500">
                                        {product.brands?.name || "Marka Yok"} • {product.categories?.name || "Kategori Yok"}
                                    </p>

                                    <div className="mt-auto flex items-end justify-between">
                                        <div>
                                            <span className="text-lg font-bold text-[#135bec]">
                                                {formatPrice(product.price)}
                                            </span>
                                            {product.original_price && (
                                                <span className="ml-2 text-sm text-slate-400 line-through">
                                                    {formatPrice(product.original_price)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-3 flex gap-2">
                                        <Link href={`/katalog/${product.id}`} className="flex-1">
                                            <Button variant="outline" size="sm" className="w-full">
                                                Detaylar
                                            </Button>
                                        </Link>
                                        <Button
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => setRequestModalProduct(product)}
                                            disabled={product.stock_quantity <= 0}
                                        >
                                            + Talep Et
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
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
                            <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
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
                                <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
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
