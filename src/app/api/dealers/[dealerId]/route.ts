import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
)

function getErrorPayload(error: any) {
    if (!error) return null

    return {
        message: error.message || 'Bilinmeyen hata',
        code: error.code || null,
        details: error.details || null,
        hint: error.hint || null,
        status: error.status || null,
    }
}

function errorResponse(message: string, status: number, error?: any) {
    if (error) {
        console.error(message, getErrorPayload(error))
    }

    return NextResponse.json(
        {
            error: error?.message ? `${message}: ${error.message}` : message,
            details: getErrorPayload(error),
        },
        { status }
    )
}

export async function DELETE(
    _request: NextRequest,
    context: { params: Promise<{ dealerId: string }> }
) {
    try {
        const { dealerId } = await context.params

        if (!dealerId) {
            return NextResponse.json(
                { error: 'Silinecek bayi kimliği bulunamadı' },
                { status: 400 }
            )
        }

        const { data: dealer, error: dealerError } = await supabaseAdmin
            .from('dealers')
            .select('id, user_id, company_name')
            .eq('id', dealerId)
            .maybeSingle()

        if (dealerError) {
            return errorResponse('Bayi bilgisi alınamadı', 500, dealerError)
        }

        if (!dealer) {
            return NextResponse.json(
                { error: 'Bayi bulunamadı' },
                { status: 404 }
            )
        }

        const { data: requests, error: requestsError } = await supabaseAdmin
            .from('requests')
            .select('id')
            .eq('dealer_id', dealerId)

        if (requestsError) {
            return errorResponse('Bayiye ait talepler alınamadı', 500, requestsError)
        }

        const requestIds = (requests || []).map((request) => request.id)

        if (requestIds.length > 0) {
            const { error: requestItemsError } = await supabaseAdmin
                .from('request_items')
                .delete()
                .in('request_id', requestIds)

            if (requestItemsError) {
                return errorResponse('Talep kalemleri silinemedi', 500, requestItemsError)
            }
        }

        const { error: favoritesError } = await supabaseAdmin
            .from('favorites')
            .delete()
            .eq('dealer_id', dealerId)

        if (favoritesError) {
            return errorResponse('Bayiye ait favoriler silinemedi', 500, favoritesError)
        }

        const { error: deleteRequestsError } = await supabaseAdmin
            .from('requests')
            .delete()
            .eq('dealer_id', dealerId)

        if (deleteRequestsError) {
            return errorResponse('Bayiye ait talepler silinemedi', 500, deleteRequestsError)
        }

        const { error: deleteDealerError } = await supabaseAdmin
            .from('dealers')
            .delete()
            .eq('id', dealerId)

        if (deleteDealerError) {
            return errorResponse('Bayi kaydı silinemedi', 500, deleteDealerError)
        }

        const { data: authUserLookup, error: authLookupError } = await supabaseAdmin.auth.admin.getUserById(dealer.user_id)

        if (authLookupError) {
            return errorResponse('Kullanıcı hesabı kontrol edilemedi', 500, authLookupError)
        }

        if (authUserLookup?.user) {
            const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(dealer.user_id)

            if (authDeleteError) {
                return errorResponse('Bayi silindi ancak giriş hesabı silinemedi', 500, authDeleteError)
            }
        }

        const { error: profileDeleteError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', dealer.user_id)

        if (profileDeleteError) {
            return errorResponse('Bayi silindi ancak kullanıcı profili silinemedi', 500, profileDeleteError)
        }

        return NextResponse.json({
            success: true,
            message: 'Bayi ve ilişkili test verileri silindi',
            deleted: {
                dealerId: dealer.id,
                userId: dealer.user_id,
                requestCount: requestIds.length,
            },
        })
    } catch (error: any) {
        console.error('Unexpected dealer delete error:', getErrorPayload(error))
        return NextResponse.json(
            { error: 'Beklenmeyen bir hata oluştu: ' + (error?.message || 'Bilinmeyen hata') },
            { status: 500 }
        )
    }
}
