import { createClient } from '@/lib/supabase/client'
import { Item } from '@/lib/types'

const supabase = createClient()

export async function createItem(
    name: string,
    icon: string,
    folderId: string | null,
    position: number = 0
) {
    const { data, error } = await supabase
        .from('items')
        .insert({
            name,
            icon,
            description: '',
            folder_id: folderId,
            content: { type: 'doc', content: [] },
            position
        })
        .select()
        .single<Item>()

    if (error) throw error
    return data
}

export async function updateItem(
    id: string,
    updates: Partial<Omit<Item, 'id' | 'created_at' | 'user_id'>>
) {
    const { data, error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id)
        .select()
        .single<Item>()

    if (error) throw error
    return data
}

export async function updateItemContent(
    id: string,
    content: any,
    name?: string
) {
    const updates: any = { content }
    if (name) updates.name = name

    const { data, error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id)
        .select()
        .single<Item>()

    if (error) throw error
    return data
}

export async function deleteItem(id: string) {
    const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id)

    if (error) throw error
}

export async function moveItem(id: string, folderId: string | null) {
    const { data, error } = await supabase
        .from('items')
        .update({ folder_id: folderId })
        .eq('id', id)
        .select()
        .single<Item>()

    if (error) throw error
    return data
}

export async function archiveItem(id: string) {
    const { data, error } = await supabase
        .from('items')
        .update({ is_archived: true })
        .eq('id', id)
        .select()
        .single<Item>()

    if (error) throw error
    return data
}

export async function getItems(folderId?: string | null, includeArchived: boolean = false) {
    let query = supabase
        .from('items')
        .select('*')
        .is('deleted_at', null)
        .order('position')

    if (!includeArchived) {
        query = query.eq('is_archived', false)
    }

    if (folderId !== undefined) {
        query = folderId === null
            ? query.is('folder_id', null)
            : query.eq('folder_id', folderId)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Item[]
}

export async function getFavoriteItems() {
    const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('is_favorite', true)
        .eq('is_archived', false)

    if (error) throw error
    return data as Item[]
}

export async function getArchivedItems() {
    const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('is_archived', true)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data as Item[]
}

export async function reorderItems(updates: { id: string; position: number; folder_id: string | null }[]) {
    const promises = updates.map(({ id, position, folder_id }) =>
        supabase
            .from('items')
            .update({ position, folder_id })
            .eq('id', id)
    )

    const results = await Promise.all(promises)

    const error = results.find(r => r.error)?.error
    if (error) throw error
}
