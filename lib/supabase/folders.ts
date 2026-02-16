import { Folder } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export async function createFolder(
    name: string,
    icon: string,
    parentId: string | null = null,
    position: number = 0
) {
    const { data, error } = await supabase
        .from('folders')
        .insert({
            name,
            icon,
            parent_id: parentId,
            position
        })
        .select()
        .single<Folder>()

    if (error) throw error
    return data
}

export async function updateFolder(
    id: string,
    updates: Partial<Omit<Folder, 'id' | 'created_at' | 'user_id'>>
) {
    const { data, error } = await supabase
        .from('folders')
        .update(updates)
        .eq('id', id)
        .select()
        .single<Folder>()

    if (error) throw error
    return data
}

export async function deleteFolder(id: string) {
    const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id)

    if (error) throw error
}

export async function getFolders(parentId: string | null = null) {
    const query = supabase
        .from('folders')
        .select('*')
        .order('position')

    const { data, error } = parentId === null
        ? await query.is('parent_id', null)
        : await query.eq('parent_id', parentId)

    if (error) throw error
    return data as Folder[]
}

export async function getFavorites() {
    const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('is_favorite', true)

    if (error) throw error
    return data as Folder[]
}
