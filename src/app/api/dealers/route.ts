import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic to prevent static optimization during build
export const dynamic = 'force-dynamic'

// Admin client with service role key for user management
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, password, fullName, phone, companyName, city, address } = body

        // Validate required fields
        if (!email || !password || !fullName || !companyName) {
            return NextResponse.json(
                { error: 'E-posta, şifre, yetkili adı ve şirket adı zorunludur' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Şifre en az 6 karakter olmalıdır' },
                { status: 400 }
            )
        }

        // Create user in auth.users
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto confirm email
            user_metadata: {
                full_name: fullName
            }
        })

        if (authError) {
            console.error('Auth error:', authError)
            if (authError.message.includes('already registered')) {
                return NextResponse.json(
                    { error: 'Bu e-posta adresi zaten kayıtlı' },
                    { status: 400 }
                )
            }
            return NextResponse.json(
                { error: 'Kullanıcı oluşturulamadı: ' + authError.message },
                { status: 500 }
            )
        }

        const userId = authData.user.id

        // Create or update user profile in public.users (use upsert in case trigger already created it)
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: userId,
                email: email,
                full_name: fullName,
                phone: phone || null,
                role: 'dealer'
            }, { onConflict: 'id' })

        if (profileError) {
            console.error('Profile error:', profileError)
            // Rollback: delete the auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(userId)
            return NextResponse.json(
                { error: 'Kullanıcı profili oluşturulamadı: ' + profileError.message },
                { status: 500 }
            )
        }

        // Create dealer record
        const { data: dealerData, error: dealerError } = await supabaseAdmin
            .from('dealers')
            .insert({
                user_id: userId,
                company_name: companyName,
                city: city || 'İstanbul',
                address: address || '',
                status: 'active',  // Must match check constraint: active, inactive, pending
                current_balance: 0
            })
            .select()
            .single()

        if (dealerError) {
            console.error('Dealer error:', dealerError)
            // Rollback: delete the auth user and profile
            await supabaseAdmin.from('users').delete().eq('id', userId)
            await supabaseAdmin.auth.admin.deleteUser(userId)
            return NextResponse.json(
                { error: 'Bayi kaydı oluşturulamadı: ' + dealerError.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            dealer: dealerData,
            message: 'Bayi hesabı başarıyla oluşturuldu'
        })

    } catch (error: any) {
        console.error('Unexpected error:', error)
        return NextResponse.json(
            { error: 'Beklenmeyen bir hata oluştu: ' + error.message },
            { status: 500 }
        )
    }
}
