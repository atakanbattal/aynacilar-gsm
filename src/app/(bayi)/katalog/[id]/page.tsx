"use client"

import { useState, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import {
    ArrowLeft,
    Heart,
    Share2,
    Truck,
    Shield,
    Package,
    Plus,
    Minus,
    ShoppingCart,
    Loader2,
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
    warranty_info: string | null
    delivery_time: string | null
    min_order_quantity: number
    specifications: Record<string, string> | null
    categories: { name: string } | null
    brands: { name: string } | null
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

export default function UrunDetayPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const { user } = useAuth()
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [quantity, setQuantity] = useState(1)
    const [dealerId, setDealerId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [selectedImage, setSelectedImage] = useState(0)

    useEffect(() => {
        if (resolvedParams.id) {
            fetchProduct()
        }
        if (user) {
            fetchDealerId()
        }
    }, [resolvedParams.id, user])

    const fetchProduct = async () => {
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
                    warranty_info,
                    delivery_time,
                    min_order_quantity,
                    specifications,
                    categories (name),
                    brands (name)
                `)
                .eq("id", resolvedParams.id)
                .single()

            if (error) throw error
            setProduct(data as unknown as Product)
        } catch (error) {
            console.error("Error fetching product:", error)
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

    const handleAddToRequest = async () => {
        if (!dealerId || !product) {
            alert("Lütfen giriş yapın")
            return
        }

        try {
            setSubmitting(true)

            // Generate request number
            const requestNumber = `REQ-${Date.now()}`
            const totalAmount = product.price * quantity

            // Create request
            const { data: requestData, error: requestError } = await supabase
                .from("requests")
                .insert({
                    request_number: requestNumber,
                    dealer_id: dealerId,
                    status: "pending",
                    total_amount: totalAmount,
                    notes: null,
                })
                .select()
                .single()

            if (requestError) throw requestError

            // Create request item
            const { error: itemError } = await supabase
                .from("request_items")
                .insert({
                    request_id: requestData.id,
                    product_id: product.id,
                    quantity: quantity,
                    unit_price: product.price,
                    total_price: totalAmount,
                })

            if (itemError) throw itemError

            alert("Talep başarıyla oluşturuldu!")
            router.push("/taleplerim")
        } catch (error: any) {
            console.error("Error creating request:", error)
            alert("Talep oluşturulurken hata: " + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const increaseQuantity = () => {
        if (product && quantity < product.stock_quantity) {
            setQuantity(prev => prev + 1)
        }
    }

    const decreaseQuantity = () => {
        if (quantity > (product?.min_order_quantity || 1)) {
            setQuantity(prev => prev - 1)
        }
    }

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#135bec]" />
            </div>
        )
    }

    if (!product) {
        return (
            <div className="flex h-96 flex-col items-center justify-center">
                <Package className="h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                    Ürün bulunamadı
                </h3>
                <Link href="/katalog" className="mt-2 text-[#135bec] hover:underline">
                    Katalog'a dön
                </Link>
            </div>
        )
    }

    const stockStatus = getStockStatus(product.stock_quantity)
    const specs = product.specifications ? Object.entries(product.specifications) : []

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/katalog" className="flex items-center gap-1 hover:text-[#135bec]">
                    <ArrowLeft className="h-4 w-4" />
                    Katalog
                </Link>
                <span>/</span>
                <span className="text-slate-900 dark:text-white">{product.name}</span>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Images */}
                <div className="space-y-4">
                    <div className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                        {product.images && product.images.length > 0 ? (
                            <Image
                                src={product.images[selectedImage]}
                                alt={product.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-24 w-24 text-slate-300" />
                            </div>
                        )}
                        <div className="absolute left-4 top-4">
                            <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                        </div>
                        <div className="absolute right-4 top-4 flex gap-2">
                            <button className="rounded-full bg-white/90 p-2 text-slate-500 shadow-sm hover:text-red-500">
                                <Heart className="h-5 w-5" />
                            </button>
                            <button className="rounded-full bg-white/90 p-2 text-slate-500 shadow-sm hover:text-[#135bec]">
                                <Share2 className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    {product.images && product.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                            {product.images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedImage(i)}
                                    className={`relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 transition-colors ${selectedImage === i ? "border-[#135bec]" : "border-transparent hover:border-slate-300"}`}
                                >
                                    <Image src={img} alt="" fill className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="space-y-6">
                    <div>
                        <p className="mb-2 text-sm font-medium text-slate-500">{product.sku}</p>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            {product.name}
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            {product.brands?.name || "Marka Yok"} • {product.categories?.name || "Kategori Yok"}
                        </p>
                    </div>

                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-bold text-[#135bec]">
                            {formatPrice(product.price)}
                        </span>
                        {product.original_price && (
                            <span className="mb-1 text-lg text-slate-400 line-through">
                                {formatPrice(product.original_price)}
                            </span>
                        )}
                    </div>

                    {product.description && (
                        <p className="text-slate-600 dark:text-slate-300">{product.description}</p>
                    )}

                    {/* Specs */}
                    {specs.length > 0 && (
                        <Card className="p-4">
                            <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">
                                Teknik Özellikler
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {specs.map(([key, value]) => (
                                    <div key={key} className="flex justify-between text-sm">
                                        <span className="text-slate-500">{key}</span>
                                        <span className="font-medium text-slate-900 dark:text-white">
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-4 text-center dark:border-slate-700">
                            <Truck className="h-6 w-6 text-[#135bec]" />
                            <span className="text-xs text-slate-600 dark:text-slate-300">
                                {product.delivery_time || "1-3 iş günü"}
                            </span>
                        </div>
                        <div className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-4 text-center dark:border-slate-700">
                            <Shield className="h-6 w-6 text-green-600" />
                            <span className="text-xs text-slate-600 dark:text-slate-300">
                                {product.warranty_info || "Garanti"}
                            </span>
                        </div>
                        <div className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-4 text-center dark:border-slate-700">
                            <Package className="h-6 w-6 text-orange-500" />
                            <span className="text-xs text-slate-600 dark:text-slate-300">
                                Min. {product.min_order_quantity || 1} adet
                            </span>
                        </div>
                    </div>

                    {/* Quantity & Add */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={decreaseQuantity}
                                disabled={quantity <= (product.min_order_quantity || 1)}
                                className="p-3 text-slate-500 hover:text-slate-900 disabled:opacity-50"
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-12 text-center font-medium">{quantity}</span>
                            <button
                                onClick={increaseQuantity}
                                disabled={quantity >= product.stock_quantity}
                                className="p-3 text-slate-500 hover:text-slate-900 disabled:opacity-50"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        <Button
                            size="lg"
                            className="flex-1"
                            onClick={handleAddToRequest}
                            disabled={product.stock_quantity <= 0 || submitting}
                        >
                            {submitting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <ShoppingCart className="h-5 w-5" />
                                    Talep Oluştur ({formatPrice(product.price * quantity)})
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Stock info */}
                    <p className="text-sm text-slate-500">
                        Stok: <span className="font-medium">{product.stock_quantity} adet</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
