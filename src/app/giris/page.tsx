"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { Smartphone, Mail, Lock, AlertCircle, Loader2 } from "lucide-react"

export default function GirisPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)
    const router = useRouter()
    const { signIn, profile } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const { data, error } = await signIn(email, password)

            if (error) {
                if (error.message.includes("Invalid login")) {
                    setError("E-posta veya şifre hatalı.")
                    setEmailNotConfirmed(false)
                } else if (error.message.includes("Email not confirmed") || error.message.includes("mail not confirmed") || error.message.includes("email_not_confirmed")) {
                    setError("E-posta adresiniz henüz doğrulanmamış.")
                    setEmailNotConfirmed(true)
                } else {
                    setError(error.message)
                    setEmailNotConfirmed(false)
                }
                setLoading(false)
                return
            }

            setEmailNotConfirmed(false)

            // Profil kontrolü ve yönlendirme
            if (data?.session?.user) {
                // Kullanıcı profilini çek
                await new Promise(resolve => setTimeout(resolve, 500)) // Short delay to ensure session propagation

                let profile = null
                let profileError = null

                // Retry logic for profile fetch
                for (let i = 0; i < 3; i++) {
                    const result = await supabase
                        .from("users")
                        .select("*")
                        .eq("id", data.session.user.id)
                        .single()

                    if (!result.error) {
                        profile = result.data
                        profileError = null
                        break
                    }
                    profileError = result.error
                    await new Promise(resolve => setTimeout(resolve, 500)) // Wait before retry
                }

                if (profileError) {
                    console.error("Profile fetch error after retries:", profileError)
                    setError(`Profil hatası: ${profileError?.message} (Code: ${profileError?.code})`)
                    setLoading(false)
                    return
                }

                if (profile?.role === "admin") {
                    console.log("Redirecting to admin panel")
                    router.push("/yonetim")
                } else {
                    console.log("Redirecting to dealer panel")
                    router.push("/panel")
                }
                router.refresh()
            } else {
                console.error("No session found in signIn response")
                setError("Oturum açılamadı. Veri alınamadı.")
                setLoading(false)
            }
        } catch (err: any) {
            console.error("Detailed Login error:", err)
            setError(`Bir hata oluştu: ${err?.message || JSON.stringify(err)}`)
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 p-4 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="w-full max-w-md">
                {/* Logo & Title */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#135bec] text-white shadow-lg shadow-[#135bec]/30">
                        <Smartphone className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Aynacılar GSM
                    </h1>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">
                        Bayi Portalı Girişi
                    </p>
                </div>

                {/* Login Form */}
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                            Devam etmek için lütfen kimlik bilgilerinizi giriniz.
                        </p>

                        {error && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    {error}
                                </div>
                                {emailNotConfirmed && (
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-900/20">
                                        <p className="mb-2 text-sm text-blue-800 dark:text-blue-300">
                                            Doğrulama e-postası gönderilsin mi?
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="w-full text-xs"
                                            onClick={async () => {
                                                setLoading(true)
                                                setError("")
                                                try {
                                                    const { error: resendError } = await supabase.auth.resend({
                                                        type: 'signup',
                                                        email: email
                                                    })

                                                    if (resendError) {
                                                        setError("E-posta gönderilemedi: " + resendError.message)
                                                    } else {
                                                        setError("Doğrulama e-postası gönderildi. Lütfen e-posta kutunuzu kontrol edin.")
                                                        setEmailNotConfirmed(false)
                                                    }
                                                } catch (err: any) {
                                                    setError("Hata: " + err.message)
                                                }
                                                setLoading(false)
                                            }}
                                        >
                                            📧 Doğrulama E-postası Gönder
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                E-posta Adresi
                            </label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="isim@aynacilar.com"
                                required
                                icon={<Mail className="h-5 w-5" />}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Şifre
                            </label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Şifrenizi giriniz"
                                required
                                icon={<Lock className="h-5 w-5" />}
                            />
                            <div className="mt-2 text-right">
                                <Link
                                    href="/sifremi-unuttum"
                                    className="text-sm text-[#135bec] hover:underline"
                                >
                                    Şifremi Unuttum?
                                </Link>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Giriş yapılıyor...
                                </>
                            ) : (
                                "Giriş Yap →"
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-700">
                        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1">
                                🔒 <strong>Yalnızca Yetkili Erişim.</strong>
                            </span>{" "}
                            Bu portal yalnızca yetkili Aynacılar GSM bayilerine açıktır.
                            Yetkisiz erişim girişimleri takip edilmektedir.
                        </p>
                    </div>
                </div>

                {/* Demo Login Info */}
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-900 dark:bg-blue-900/20">
                    <p className="font-medium text-blue-800 dark:text-blue-300">Demo Giriş Bilgileri:</p>
                    <p className="mt-1 text-blue-700 dark:text-blue-400">
                        <strong>Admin:</strong> admin@aynacilar.com.tr / aynacilar1234.
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full text-xs"
                        onClick={async () => {
                            setLoading(true)
                            setError("")
                            try {
                                const adminEmail = "admin@aynacilar.com.tr"
                                const adminPassword = "aynacilar1234."

                                // Önce mevcut kullanıcıyı kontrol et
                                const { data: existingUser } = await supabase.auth.signInWithPassword({
                                    email: adminEmail,
                                    password: adminPassword
                                })

                                if (existingUser?.session) {
                                    // Kullanıcı zaten var ve giriş yapabildi
                                    router.push("/yonetim")
                                    router.refresh()
                                    setLoading(false)
                                    return
                                }

                                // Signup
                                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                                    email: adminEmail,
                                    password: adminPassword,
                                    options: {
                                        data: { full_name: "Admin User" },
                                        emailRedirectTo: `${window.location.origin}/giris`
                                    }
                                })

                                if (signUpError) {
                                    if (signUpError.message.includes("already registered")) {
                                        // Kullanıcı zaten kayıtlı, email confirmation sorunu olabilir
                                        // Email'i manuel olarak confirm etmeye çalış
                                        setError("Kullanıcı zaten kayıtlı. E-posta doğrulama sorunu olabilir. Lütfen Supabase dashboard'dan email confirmation ayarını kontrol edin.")
                                    } else {
                                        setError("Hesap oluşturulamadı: " + signUpError.message)
                                    }
                                    setLoading(false)
                                    return
                                }

                                if (signUpData?.user) {
                                    // Email confirmation'ı bypass etmek için kullanıcıyı manuel olarak confirm et
                                    // Not: Bu işlem Supabase dashboard'dan yapılmalı veya service role key ile yapılmalı

                                    // Create profile - önce kontrol et, sonra insert/update
                                    const { data: existingProfile } = await supabase
                                        .from("users")
                                        .select("*")
                                        .eq("id", signUpData.user.id)
                                        .single()

                                    if (!existingProfile) {
                                        const { error: profileError } = await supabase.from("users").insert({
                                            id: signUpData.user.id,
                                            email: adminEmail,
                                            full_name: "Admin User",
                                            role: "admin"
                                        })

                                        if (profileError) {
                                            console.error("Profile error:", profileError)
                                        }
                                    } else {
                                        // Profil varsa güncelle
                                        const { error: profileError } = await supabase.from("users").update({
                                            email: adminEmail,
                                            full_name: "Admin User",
                                            role: "admin"
                                        }).eq("id", signUpData.user.id)

                                        if (profileError) {
                                            console.error("Profile update error:", profileError)
                                        }
                                    }

                                    // Email confirmation hatası varsa kullanıcıya bilgi ver
                                    if (!signUpData.session) {
                                        setError("Hesap oluşturuldu ancak e-posta doğrulaması gerekiyor. Lütfen e-posta kutunuzu kontrol edin veya Supabase dashboard'dan email confirmation ayarını kapatın.")
                                        setEmailNotConfirmed(true)
                                        setLoading(false)
                                        return
                                    }

                                    // Session varsa direkt giriş yap
                                    if (signUpData.session) {
                                        router.push("/yonetim")
                                        router.refresh()
                                    }
                                }
                            } catch (err: any) {
                                setError("Hata: " + err.message)
                            }
                            setLoading(false)
                        }}
                    >
                        🔧 Admin Hesabı Oluştur
                    </Button>
                </div>
            </div>
        </div>
    )
}
