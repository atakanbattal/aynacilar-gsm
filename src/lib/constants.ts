/**
 * Centralized constants for the application
 */

// Request status enum values matching database
export const REQUEST_STATUS = {
    PENDING: "pending",
    APPROVED: "approved",
    PREPARING: "preparing",
    SHIPPING: "shipping",
    DELIVERED: "delivered",
    REJECTED: "rejected",
    CANCELLED: "cancelled",
} as const

export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS]

// Human-readable labels for request status
export const STATUS_LABELS: Record<string, string> = {
    pending: "Beklemede",
    approved: "Onaylandı",
    preparing: "Hazırlanıyor",
    shipping: "Sevkiyatta",
    delivered: "Teslim Edildi",
    rejected: "Reddedildi",
    cancelled: "İptal Edildi",
}

// CSS classes for status badges
export const STATUS_STYLES: Record<string, string> = {
    pending: "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-700/30 dark:text-yellow-400",
    approved: "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700/30 dark:text-green-400",
    preparing: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-700/30 dark:text-purple-400",
    shipping: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700/30 dark:text-blue-400",
    delivered: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700/30 dark:text-emerald-400",
    rejected: "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-700/30 dark:text-red-400",
    cancelled: "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900/20 dark:border-slate-700/30 dark:text-slate-400",
}

// Badge variants for status
export const STATUS_VARIANTS: Record<string, "warning" | "success" | "info" | "danger" | "default"> = {
    pending: "warning",
    approved: "success",
    preparing: "info",
    shipping: "info",
    delivered: "success",
    rejected: "danger",
    cancelled: "default",
}

// Status options for filters/dropdowns
export const STATUS_OPTIONS = [
    { value: "pending", label: "Beklemede" },
    { value: "approved", label: "Onaylandı" },
    { value: "preparing", label: "Hazırlanıyor" },
    { value: "shipping", label: "Sevkiyatta" },
    { value: "delivered", label: "Teslim Edildi" },
    { value: "rejected", label: "Reddedildi" },
    { value: "cancelled", label: "İptal Edildi" },
]

// Statuses that count as "active" for revenue calculations
export const ACTIVE_REQUEST_STATUSES = ["approved", "preparing", "shipping", "delivered"]

// Product status options
export const PRODUCT_STATUS = {
    ACTIVE: "active",
    INACTIVE: "inactive",
    OUT_OF_STOCK: "out_of_stock",
} as const

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
    active: "Aktif",
    inactive: "Pasif",
    out_of_stock: "Stokta Yok",
}

// Dealer status
export const DEALER_STATUS = {
    ACTIVE: "active",
    INACTIVE: "inactive",
    SUSPENDED: "suspended",
} as const

// Low stock threshold
export const LOW_STOCK_THRESHOLD = 10

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
