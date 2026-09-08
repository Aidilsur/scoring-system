/**
 * Pure functions untuk formatting data umum (non-domain specific atau domain display)
 */

/**
 * Format ukuran file dalam bytes ke unit yang mudah dibaca (KB / MB)
 */
export function formatFileSize(bytes: number): string {
    if (bytes <= 0) return '0 B'
    const megabytes = bytes / (1024 * 1024)
    if (megabytes >= 1) {
        return `${megabytes.toFixed(2)} MB`
    }
    const kilobytes = bytes / 1024
    return `${kilobytes.toFixed(1)} KB`
}

/**
 * Format string nomor telepon Indonesia
 */
export function formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '')
    if (cleaned.startsWith('62')) {
        return `+62 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 9)} ${cleaned.slice(9)}`.trim()
    }
    if (cleaned.startsWith('0')) {
        return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`.trim()
    }
    return phoneNumber
}

/**
 * Format label kombinasi tipe partner dan tingkat level turnamen
 */
export function formatCategoryBadge(partnerType: string, level: string): string {
    const partnerLabel = partnerType === 'fix' ? 'Fix Partner' : 'Mix Partner'
    const levelLabel =
        level === 'beginner'
            ? 'Beginner'
            : level === 'lower_bronze'
            ? 'Lower Bronze'
            : level === 'bronze'
            ? 'Bronze'
            : level

    return `${partnerLabel} • ${levelLabel}`
}
