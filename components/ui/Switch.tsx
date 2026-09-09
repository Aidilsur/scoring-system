import React, { forwardRef } from 'react'

export interface SwitchProps {
    id?: string
    name?: string
    checked: boolean
    onChange: (checked: boolean) => void
    label?: string
    description?: string
    error?: string
    disabled?: boolean
    className?: string
    containerClassName?: string
}

/**
 * Switch / Toggle Component
 * Komponen atomic reusable untuk boolean toggle switch.
 * Memenuhi spesifikasi docs/component-architecture.md §A.
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
    (
        {
            id,
            name,
            checked,
            onChange,
            label,
            description,
            error,
            disabled = false,
            className = '',
            containerClassName = '',
        },
        ref
    ) => {
        const switchId = id || name

        const handleToggle = () => {
            if (!disabled) {
                onChange(!checked)
            }
        }

        return (
            <div className={`space-y-1.5 ${containerClassName}`}>
                <div className="flex items-start justify-between gap-4">
                    {(label || description) && (
                        <div className="flex flex-col cursor-pointer" onClick={handleToggle}>
                            {label && (
                                <label
                                    htmlFor={switchId}
                                    className={`text-xs font-bold uppercase tracking-wider select-none cursor-pointer ${
                                        disabled
                                            ? 'text-zinc-600'
                                            : 'text-zinc-200'
                                    }`}
                                >
                                    {label}
                                </label>
                            )}
                            {description && (
                                <p className="text-[11px] text-zinc-400 select-none">
                                    {description}
                                </p>
                            )}
                        </div>
                    )}

                    <button
                        ref={ref}
                        id={switchId}
                        name={name}
                        type="button"
                        role="switch"
                        aria-checked={checked}
                        disabled={disabled}
                        onClick={handleToggle}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-lime-400/40 disabled:opacity-50 disabled:cursor-not-allowed ${
                            checked
                                ? 'bg-lime-400'
                                : 'bg-zinc-800 border-zinc-700'
                        } ${className}`}
                    >
                        <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out ${
                                checked ? 'translate-x-5 bg-zinc-950' : 'translate-x-0 bg-zinc-400'
                            }`}
                        />
                    </button>
                </div>

                {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
            </div>
        )
    }
)

Switch.displayName = 'Switch'
