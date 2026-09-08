'use client'

import React from 'react'
import { Button, ButtonProps } from '@/components/ui'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export interface LogoutButtonProps extends Omit<ButtonProps, 'onClick' | 'isLoading' | 'loadingText'> {
    className?: string
}

/**
 * LogoutButton (Presentational UI Component)
 * Menggunakan useAdminAuth hook untuk trigger signOutAction sesuai aturan §2.1.
 */
export function LogoutButton({
    variant = 'outline',
    size = 'sm',
    className = '',
    children,
    ...props
}: LogoutButtonProps) {
    const { signOut, isLoggingOut } = useAdminAuth()

    return (
        <Button
            variant={variant}
            size={size}
            onClick={signOut}
            isLoading={isLoggingOut}
            loadingText="Keluar..."
            className={`gap-2 ${className}`}
            {...props}
        >
            {children || (
                <>
                    <svg className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                </>
            )}
        </Button>
    )
}
