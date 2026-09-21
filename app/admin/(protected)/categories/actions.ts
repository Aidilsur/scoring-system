'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
    categorySchema,
    toggleCategoryActiveSchema,
    CategoryInput,
} from '@/lib/validations/category'
import { Category } from '@/types/domain'

interface CategoryActionResponse {
    success: boolean
    message: string
    data?: Category
    errors?: Record<string, string>
}

/**
 * Server Action: Membuat kategori turnamen baru
 * Sesuai spesifikasi docs/business-rules.md §4.1 & docs/pages-features.md §6.2
 */
export async function createCategoryAction(
    input: CategoryInput
): Promise<CategoryActionResponse> {
    try {
        const supabase = await createClient()

        // 1. Verifikasi autentikasi admin
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                message: 'Akses ditolak. Silakan login sebagai admin terlebih dahulu.',
            }
        }

        // 2. Validasi input menggunakan Zod
        const validation = categorySchema.safeParse(input)
        if (!validation.success) {
            const fieldErrors: Record<string, string> = {}
            for (const issue of validation.error.issues) {
                const fieldName = issue.path[0]?.toString() || 'general'
                fieldErrors[fieldName] = issue.message
            }
            return {
                success: false,
                message:
                    validation.error.issues[0]?.message ||
                    'Data kategori turnamen tidak valid.',
                errors: fieldErrors,
            }
        }

        const validData = validation.data

        // 3. Simpan ke database Supabase
        const { data: newCategory, error: insertError } = await supabase
            .from('categories')
            .insert({
                name: validData.name,
                partner_type: validData.partner_type,
                level: validData.level,
                is_active: validData.is_active ?? true,
            })
            .select('id, name, partner_type, level, is_active, created_at')
            .single()

        if (insertError) {
            console.error('Error inserting category:', insertError)
            return {
                success: false,
                message: `Gagal menambahkan kategori: ${insertError.message}`,
            }
        }

        // 4. Revalidate cache halaman-halaman yang bergantung pada categories
        revalidatePath('/admin/categories')
        revalidatePath('/register')
        revalidatePath('/admin/teams')
        revalidatePath('/admin/draw')

        return {
            success: true,
            message: `Kategori "${validData.name}" berhasil ditambahkan.`,
            data: newCategory as Category,
        }
    } catch (err: unknown) {
        console.error('Unexpected error in createCategoryAction:', err)
        const errMsg =
            err instanceof Error ? err.message : 'Terjadi kesalahan sistem yang tidak terduga.'
        return {
            success: false,
            message: errMsg,
        }
    }
}

/**
 * Server Action: Mengubah status aktif / nonaktif kategori turnamen
 * Digunakan untuk menutup / membuka pendaftaran kategori tertentu
 */
export async function toggleCategoryActiveAction(
    categoryId: string,
    isActive: boolean
): Promise<CategoryActionResponse> {
    try {
        const supabase = await createClient()

        // 1. Verifikasi autentikasi admin
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                message: 'Akses ditolak. Silakan login sebagai admin terlebih dahulu.',
            }
        }

        // 2. Validasi input
        const validation = toggleCategoryActiveSchema.safeParse({
            categoryId,
            isActive,
        })
        if (!validation.success) {
            return {
                success: false,
                message: validation.error.issues[0]?.message || 'Data tidak valid.',
            }
        }

        // 3. Update status di tabel categories
        const { data: updatedCategory, error: updateError } = await supabase
            .from('categories')
            .update({ is_active: isActive })
            .eq('id', categoryId)
            .select('id, name, partner_type, level, is_active, created_at')
            .single()

        if (updateError) {
            console.error('Error updating category status:', updateError)
            return {
                success: false,
                message: `Gagal memperbarui status kategori: ${updateError.message}`,
            }
        }

        // 4. Revalidate cache
        revalidatePath('/admin/categories')
        revalidatePath('/register')
        revalidatePath('/admin/teams')
        revalidatePath('/admin/draw')

        const statusLabel = isActive ? 'diaktifkan' : 'dinonaktifkan'
        return {
            success: true,
            message: `Kategori "${updatedCategory.name}" berhasil ${statusLabel}.`,
            data: updatedCategory as Category,
        }
    } catch (err: unknown) {
        console.error('Unexpected error in toggleCategoryActiveAction:', err)
        const errMsg =
            err instanceof Error ? err.message : 'Terjadi kesalahan sistem yang tidak terduga.'
        return {
            success: false,
            message: errMsg,
        }
    }
}

/**
 * Server Action: Menghapus kategori turnamen permanen
 * Business rule:
 * - Kategori hanya bisa dihapus jika is_active = false
 * - Tangkap FK constraint violation (ON DELETE RESTRICT dari tabel teams)
 */
export async function deleteCategoryAction(
    categoryId: string
): Promise<CategoryActionResponse> {
    try {
        const supabase = await createClient()

        // 1. Verifikasi autentikasi admin
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                message: 'Akses ditolak. Silakan login sebagai admin terlebih dahulu.',
            }
        }

        if (!categoryId) {
            return {
                success: false,
                message: 'ID kategori tidak valid.',
            }
        }

        // 2. Cek kategori & status aktif
        const { data: category, error: fetchError } = await supabase
            .from('categories')
            .select('id, name, is_active')
            .eq('id', categoryId)
            .single()

        if (fetchError || !category) {
            return {
                success: false,
                message: 'Kategori tidak ditemukan.',
            }
        }

        if (category.is_active) {
            return {
                success: false,
                message: 'Nonaktifkan kategori terlebih dahulu sebelum menghapus.',
            }
        }

        // 3. Cek apakah ada tim terdaftar (pre-check friendly message)
        const { count: teamCount, error: countError } = await supabase
            .from('teams')
            .select('id', { count: 'exact', head: true })
            .eq('category_id', categoryId)

        if (!countError && teamCount && teamCount > 0) {
            return {
                success: false,
                message: 'Kategori ini masih memiliki tim terdaftar, tidak dapat dihapus.',
            }
        }

        // 4. Eksekusi penghapusan di database
        const { error: deleteError } = await supabase
            .from('categories')
            .delete()
            .eq('id', categoryId)

        if (deleteError) {
            console.error('Error deleting category:', deleteError)
            if (
                deleteError.code === '23503' ||
                deleteError.message.includes('foreign key') ||
                deleteError.message.includes('violates foreign key')
            ) {
                return {
                    success: false,
                    message:
                        'Kategori ini masih memiliki tim terdaftar, tidak dapat dihapus.',
                }
            }
            return {
                success: false,
                message: `Gagal menghapus kategori: ${deleteError.message}`,
            }
        }

        // 5. Revalidate cache halaman yang bergantung pada categories
        revalidatePath('/admin/categories')
        revalidatePath('/register')
        revalidatePath('/admin/teams')
        revalidatePath('/admin/draw')
        revalidatePath('/admin/schedule')
        revalidatePath('/admin/bracket')

        return {
            success: true,
            message: `Kategori "${category.name}" berhasil dihapus.`,
        }
    } catch (err: unknown) {
        console.error('Unexpected error in deleteCategoryAction:', err)
        const errMsg =
            err instanceof Error ? err.message : 'Terjadi kesalahan sistem yang tidak terduga.'
        return {
            success: false,
            message: errMsg,
        }
    }
}

