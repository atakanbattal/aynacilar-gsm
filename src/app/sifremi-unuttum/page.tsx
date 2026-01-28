import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg dark:bg-slate-800">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Şifremi Unuttum</h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
                    </p>
                </div>

                <form className="space-y-6">
                    <div>
                        <Input
                            type="email"
                            placeholder="E-posta Adresi"
                            required
                            icon={<Mail className="h-5 w-5" />}
                        />
                    </div>

                    <Button className="w-full" size="lg">
                        Şifre Sıfırlama Bağlantısı Gönder
                    </Button>
                </form>

                <div className="text-center">
                    <Link
                        href="/giris"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Giriş Ekranına Dön
                    </Link>
                </div>
            </div>
        </div>
    )
}
