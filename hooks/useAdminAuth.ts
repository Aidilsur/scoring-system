'use client'

import { useTransition, useCallback } from 'react'
import {
    signInWithGoogleAction,
    signOutAction,
} from '@/app/admin/login/actions'

export interface UseAdminAuthReturn {
    isLoggingIn: boolean
    isLoggingOut: boolean
    signInWithGoogle: (nextPath?: string) => void
    signOut: () => void
}

/**
 * Custom hook untuk manajemen authentication admin (Google OAuth & Logout).
 * Memisahkan state & execution logic dari komponen UI sesuai §2.1.
 */
export function useAdminAuth(): UseAdminAuthReturn {
    const [isLoggingIn, startLoginTransition] = useTransition()
    const [isLoggingOut, startLogoutTransition] = useTransition()

    const signInWithGoogle = useCallback((nextPath: string = '/admin') => {
        startLoginTransition(async () => {
            await signInWithGoogleAction(nextPath)
        })
    }, [])

    const signOut = useCallback(() => {
        startLogoutTransition(async () => {
            await signOutAction()
        })
    }, [])

    return {
        isLoggingIn,
        isLoggingOut,
        signInWithGoogle,
        signOut,
    }
}
