import { toast as sonnerToast } from 'sonner'

/**
 * Centralized Toast Helper
 * Mematuhi docs/component-architecture.md §J & docs/design-theme.md
 */
export const toast = {
    success: (message: string, description?: string) => {
        return sonnerToast.success(message, {
            description,
            duration: 4000,
        })
    },
    error: (message: string, description?: string) => {
        return sonnerToast.error(message, {
            description,
            duration: 6000,
        })
    },
    warning: (message: string, description?: string) => {
        return sonnerToast.warning(message, {
            description,
            duration: 5000,
        })
    },
    info: (message: string, description?: string) => {
        return sonnerToast.info(message, {
            description,
            duration: 4000,
        })
    },
}

export const showToast = toast
export default toast
