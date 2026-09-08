import React, { forwardRef, InputHTMLAttributes } from 'react'
import { UploadCloud, X } from 'lucide-react'
import { formatFileSize } from '@/utils/format'

export interface FileInputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
    label?: string
    error?: string
    helperText?: string
    required?: boolean
    selectedFile?: File | null
    filePreview?: string | null
    onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    onRemoveFile?: () => void
    containerClassName?: string
}

export const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
    (
        {
            label,
            error,
            helperText,
            required,
            id,
            name,
            disabled,
            selectedFile,
            filePreview,
            onFileChange,
            onRemoveFile,
            accept,
            containerClassName = '',
            ...props
        },
        ref
    ) => {
        const inputId = id || name

        return (
            <div className={`space-y-2 ${containerClassName}`}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                    >
                        {label} {required && <span className="text-rose-500">*</span>}
                    </label>
                )}

                {helperText && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                        {helperText}
                    </p>
                )}

                {/* Elemen input file harus selalu ter-mount di DOM agar browser FormData selalu menyertakan file saat form submit */}
                <input
                    ref={ref}
                    type="file"
                    id={inputId}
                    name={name}
                    accept={accept}
                    onChange={onFileChange}
                    disabled={disabled}
                    className="hidden"
                    {...props}
                />

                {!selectedFile ? (
                    <label
                        htmlFor={inputId}
                        className={`block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 ${
                            disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''
                        } ${
                            error
                                ? 'border-rose-400 bg-rose-50/20'
                                : 'border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500'
                        }`}
                    >
                        <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full flex items-center justify-center mx-auto mb-3">
                            <UploadCloud className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            Klik untuk memilih file bukti transfer
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                            Pilih foto screenshot struk atau file PDF
                        </p>
                    </label>
                ) : (
                    <div className="border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 bg-zinc-50/60 dark:bg-zinc-800/50 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            {filePreview ? (
                                <img
                                    src={filePreview}
                                    alt="Preview File"
                                    className="w-14 h-14 object-cover rounded-xl border border-zinc-200 dark:border-zinc-700 shrink-0"
                                />
                            ) : (
                                <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/50 text-rose-600 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs">
                                    PDF
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                    {selectedFile.name}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {formatFileSize(selectedFile.size)}
                                </p>
                            </div>
                        </div>

                        {onRemoveFile && (
                            <button
                                type="button"
                                onClick={onRemoveFile}
                                disabled={disabled}
                                className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition shrink-0 cursor-pointer disabled:opacity-50"
                                title="Hapus file"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {error && <p className="text-xs text-rose-500 font-medium mt-1.5">{error}</p>}
            </div>
        )
    }
)

FileInput.displayName = 'FileInput'
