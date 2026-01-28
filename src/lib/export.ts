import * as XLSX from "xlsx"

interface ExportData {
    [key: string]: string | number | boolean | null | undefined
}

/**
 * Export data to Excel file
 */
export function exportToExcel(data: ExportData[], filename: string) {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
        wch: Math.max(
            key.length,
            ...data.map((row) => String(row[key] || "").length)
        ),
    }))
    worksheet["!cols"] = colWidths

    XLSX.writeFile(workbook, `${filename}.xlsx`)
}

/**
 * Export requests to Excel
 */
export function exportRequestsToExcel(requests: any[], filename = "talepler") {
    const data = requests.map((r) => ({
        "Talep No": r.request_number,
        "Bayi": r.dealers?.company_name || "Bilinmiyor",
        "Tutar": r.total_amount,
        "Durum": r.status,
        "Tarih": new Date(r.created_at).toLocaleDateString("tr-TR"),
        "Notlar": r.notes || "",
    }))

    exportToExcel(data, filename)
}

/**
 * Export products to Excel
 */
export function exportProductsToExcel(products: any[], filename = "urunler") {
    const data = products.map((p) => ({
        "SKU": p.sku,
        "Ürün Adı": p.name,
        "Kategori": p.category,
        "Marka": p.brand,
        "Fiyat": p.price,
        "Stok": p.stock,
        "Durum": p.status,
    }))

    exportToExcel(data, filename)
}

/**
 * Export dealers to Excel
 */
export function exportDealersToExcel(dealers: any[], filename = "bayiler") {
    const data = dealers.map((d) => ({
        "Şirket Adı": d.company_name,
        "Yetkili": d.contact_name,
        "E-posta": d.email,
        "Telefon": d.phone,
        "Şehir": d.city,
        "Durum": d.status,
        "Toplam Ciro": d.current_balance,
        "Sipariş Sayısı": d.total_orders,
    }))

    exportToExcel(data, filename)
}
