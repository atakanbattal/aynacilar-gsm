import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"

interface Favorite {
    id: string
    product_id: string
    created_at: string
}

interface Product {
    id: string
    name: string
    price: number
    images: string[]
}

interface FavoriteWithProduct extends Favorite {
    products: Product
}

export function useFavorites(dealerId: string | null) {
    const [favorites, setFavorites] = useState<string[]>([])
    const [favoritesWithProducts, setFavoritesWithProducts] = useState<FavoriteWithProduct[]>([])
    const [loading, setLoading] = useState(true)

    const fetchFavorites = useCallback(async () => {
        if (!dealerId) {
            setFavorites([])
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from("favorites")
                .select(`
                    id,
                    product_id,
                    created_at,
                    products (
                        id,
                        name,
                        price,
                        images
                    )
                `)
                .eq("dealer_id", dealerId)

            if (error) throw error

            setFavorites((data || []).map((f: any) => f.product_id))
            setFavoritesWithProducts(data as unknown as FavoriteWithProduct[] || [])
        } catch (error) {
            console.error("Error fetching favorites:", error)
        } finally {
            setLoading(false)
        }
    }, [dealerId])

    useEffect(() => {
        fetchFavorites()
    }, [fetchFavorites])

    const addFavorite = async (productId: string) => {
        if (!dealerId) return false

        try {
            const { error } = await supabase
                .from("favorites")
                .insert({ dealer_id: dealerId, product_id: productId })

            if (error) throw error

            setFavorites((prev) => [...prev, productId])
            fetchFavorites() // Refresh to get product details
            return true
        } catch (error) {
            console.error("Error adding favorite:", error)
            return false
        }
    }

    const removeFavorite = async (productId: string) => {
        if (!dealerId) return false

        try {
            const { error } = await supabase
                .from("favorites")
                .delete()
                .eq("dealer_id", dealerId)
                .eq("product_id", productId)

            if (error) throw error

            setFavorites((prev) => prev.filter((id) => id !== productId))
            setFavoritesWithProducts((prev) => prev.filter((f) => f.product_id !== productId))
            return true
        } catch (error) {
            console.error("Error removing favorite:", error)
            return false
        }
    }

    const toggleFavorite = async (productId: string) => {
        if (favorites.includes(productId)) {
            return removeFavorite(productId)
        } else {
            return addFavorite(productId)
        }
    }

    const isFavorite = (productId: string) => {
        return favorites.includes(productId)
    }

    return {
        favorites,
        favoritesWithProducts,
        loading,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        refetch: fetchFavorites,
    }
}
