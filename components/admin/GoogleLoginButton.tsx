'use client'

import React from 'react'
import { Button } from '@/components/ui'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface GoogleLoginButtonProps {
    redirectTo?: string
    className?: string
}

/**
 * GoogleLoginButton (Presentational UI Component)
 * Tombol interaktif untuk trigger login Google OAuth via useAdminAuth hook.
 */
export function GoogleLoginButton({
    redirectTo = '/admin',
    className = '',
}: GoogleLoginButtonProps) {
    const { signInWithGoogle, isLoggingIn } = useAdminAuth()

    return (
        <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => signInWithGoogle(redirectTo)}
            isLoading={isLoggingIn}
            loadingText="Mengarahkan ke Google..."
            className={`w-full bg-zinc-800/90 hover:bg-zinc-700/80 text-zinc-100 border-zinc-700 shadow-md shadow-black/20 gap-3 py-4 text-sm sm:text-base font-semibold ${className}`}
        >
            <GoogleIcon />
            <span>Login with Google</span>
        </Button>
    )
}
