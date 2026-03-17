"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"

type UserRole = "admin" | "dealer"
const ADMIN_EMAILS = new Set(["admin@aynacilar.com.tr"])

interface UserProfile {
    id: string
    email: string
    full_name: string
    role: UserRole
    phone?: string
    avatar_url?: string
}

interface AuthContextType {
    user: User | null
    profile: UserProfile | null
    session: Session | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ data: { user: User | null; session: Session | null }; error: Error | null }>
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
    isAdmin: boolean
    isDealer: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchProfileWithTimeout = async (userId: string, timeoutMs = 5000) => {
        return await Promise.race([
            fetchProfile(userId),
            new Promise<null>((resolve) =>
                setTimeout(() => {
                    console.error(`Profile fetch timed out after ${timeoutMs}ms`, { userId })
                    resolve(null)
                }, timeoutMs)
            ),
        ])
    }

    const getRoleFromUser = (currentUser: User | null, currentProfile: UserProfile | null): UserRole | null => {
        if (currentProfile?.role) {
            return currentProfile.role
        }

        const metadataRole = currentUser?.user_metadata?.role || currentUser?.app_metadata?.role
        if (metadataRole === "admin" || metadataRole === "dealer") {
            return metadataRole
        }

        const email = currentUser?.email?.toLowerCase()
        if (email && ADMIN_EMAILS.has(email)) {
            return "admin"
        }

        return currentUser ? "dealer" : null
    }

    const syncProfile = async (currentUser: User | null) => {
        if (!currentUser) {
            setProfile(null)
            return
        }

        const nextProfile = await fetchProfileWithTimeout(currentUser.id)
        setProfile(nextProfile)
    }

    // Profil bilgilerini getir
    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", userId)
                .single()

            if (error) {
                // Detaylı hata loglama
                console.error("Error fetching profile:", {
                    message: error.message || 'No error message',
                    code: error.code || 'No error code',
                    details: error.details || 'No details',
                    hint: error.hint || 'No hint',
                    userId: userId,
                    fullError: error
                })
                
                // Eğer profil bulunamadıysa (PGRST116), otomatik oluşturmayı dene
                if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
                    console.log("Profil bulunamadı, otomatik oluşturuluyor...")
                    
                    // Mevcut kullanıcı bilgilerini al
                    const { data: { user } } = await supabase.auth.getUser()
                    
                    if (user) {
                        // Önce mevcut profili kontrol et
                        const { data: existingProfile } = await supabase
                            .from("users")
                            .select("*")
                            .eq("id", user.id)
                            .single()
                        
                        if (existingProfile) {
                            return existingProfile as UserProfile
                        }
                        
                        // Varsayılan profil oluştur
                        const { data: newProfile, error: createError } = await supabase
                            .from("users")
                            .insert({
                                id: user.id,
                                email: user.email || '',
                                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı',
                                role: 'dealer'
                            })
                            .select()
                            .single()
                        
                        if (createError) {
                            console.error("Profil oluşturma hatası:", {
                                message: createError.message,
                                code: createError.code,
                                details: createError.details,
                                hint: createError.hint
                            })
                            
                            // Conflict hatası ise (409), tekrar fetch etmeyi dene
                            if (createError.code === '23505' || createError.message?.includes('duplicate')) {
                                const { data: retryProfile } = await supabase
                                    .from("users")
                                    .select("*")
                                    .eq("id", user.id)
                                    .single()
                                
                                if (retryProfile) {
                                    return retryProfile as UserProfile
                                }
                            }
                            
                            return null
                        }
                        
                        console.log("Profil otomatik oluşturuldu:", newProfile)
                        return newProfile as UserProfile
                    }
                }
                
                return null
            }
            return data as UserProfile
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error("Unexpected error fetching profile:", {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                })
            }
            return null
        }
    }

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Initial session check
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                // Handle invalid refresh token error
                if (sessionError) {
                    console.error("Session error:", sessionError)
                    if (sessionError.message?.includes("Refresh Token") || sessionError.message?.includes("refresh_token")) {
                        console.log("Invalid refresh token, clearing session...")
                        await supabase.auth.signOut()
                        setSession(null)
                        setUser(null)
                        setProfile(null)
                        setLoading(false)
                        return
                    }
                }

                setSession(session)
                setUser(session?.user ?? null)
                setLoading(false)
                void syncProfile(session?.user ?? null)
            } catch (error: any) {
                console.error("Auth initialization error:", error)
                // Clear session on any auth error
                if (error.message?.includes("Refresh Token") || error.message?.includes("refresh_token")) {
                    await supabase.auth.signOut()
                    setSession(null)
                    setUser(null)
                    setProfile(null)
                }
                setLoading(false)
            }
        }

        initializeAuth()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session)
                setUser(session?.user ?? null)
                setLoading(false)
                void syncProfile(session?.user ?? null)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        
        // Email confirmation hatasını handle et
        if (error && (error.message.includes("Email not confirmed") || error.message.includes("mail not confirmed") || error.message.includes("email_not_confirmed"))) {
            // Email confirmation hatası varsa, kullanıcıya daha iyi bir mesaj göster
            return { 
                data, 
                error: new Error("E-posta adresiniz henüz doğrulanmamış. Lütfen e-posta kutunuzu kontrol edin.") 
            }
        }
        
        return { data, error }
    }

    const signUp = async (email: string, password: string, fullName: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        })

        if (!error && data.user) {
            // Create user profile - önce kontrol et
            const { data: existingProfile } = await supabase
                .from("users")
                .select("*")
                .eq("id", data.user.id)
                .single()
            
            if (!existingProfile) {
                const { error: profileError } = await supabase.from("users").insert({
                    id: data.user.id,
                    email: email,
                    full_name: fullName,
                    role: "dealer",
                })
                
                if (profileError) {
                    console.error("Profile creation error:", profileError)
                }
            }
        }

        return { error }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setProfile(null)
    }

    const value = {
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin: getRoleFromUser(user, profile) === "admin",
        isDealer: getRoleFromUser(user, profile) === "dealer",
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
