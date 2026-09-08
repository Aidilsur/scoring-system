'use client'

import React from 'react'
import { LogOut } from 'lucide-react'
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
                    <LogOut className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-400" />
                    <span>Logout</span>
                </>
            )}
        </Button>
    )
}
