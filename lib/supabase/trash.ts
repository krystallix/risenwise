import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface TrashItem {
    id: string
    name: string
    deleted_at: string
    icon?: string
    type: 'item' | 'folder'
    folder_id?: string | null
    children_count?: number  // ← tambah ini
}

export async function getTrash(): Promise<TrashItem[]> {
    const [trashItems, trashFolders] = await Promise.all([
        supabase
            .from('items')
            .select('*')
            .not('deleted_at', 'is', null)
            .order('deleted_at', { ascending: false }),
        supabase
            .from('folders')
            .select('*')
            .not('deleted_at', 'is', null)
            .order('deleted_at', { ascending: false })
    ])

    const rawFolders = trashFolders.data || []
    const rawItems = trashItems.data || []

    // Hitung berapa item yang ada di dalam folder yang di-trash
    const items: TrashItem[] = rawItems.map((i: any) => ({
        id: i.id,
        name: i.name,
        deleted_at: i.deleted_at,
        icon: i.icon,
        folder_id: i.folder_id,
        type: 'item' as const,
    }))

    const folders: TrashItem[] = rawFolders.map((f: any) => ({
        id: f.id,
        name: f.name,
        deleted_at: f.deleted_at,
        icon: f.icon,
        folder_id: null,
        type: 'folder' as const,
        // Hitung items yang folder_id-nya sama dengan folder ini
        children_count: rawItems.filter((i: any) => i.folder_id === f.id).length,
    }))

    return [...folders, ...items].sort(
        (a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime()
    )
}

// Restore item + auto restore parent folder jika masih di trash
export async function restoreItem(id: string) {
    const { error } = await supabase.rpc('restore_item', { p_item_id: id })
    if (error) throw error

    const { data: item } = await supabase
        .from('items')
        .select('folder_id')
        .eq('id', id)
        .single()

    if (item?.folder_id) {
        const { data: folder } = await supabase
            .from('folders')
            .select('id, deleted_at')
            .eq('id', item.folder_id)
            .single()

        if (folder?.deleted_at) {
            const { error: folderError } = await supabase.rpc('restore_folder', {
                p_folder_id: folder.id
            })
            if (folderError) throw folderError
        }
    }
}

// Restore folder + semua items di dalamnya
export async function restoreFolder(id: string) {
    const { error } = await supabase.rpc('restore_folder', { p_folder_id: id })
    if (error) throw error

    // restore_folder di SQL sudah handle restore items di dalamnya
    // tapi kita pastikan lewat RPC juga
    const { data: items } = await supabase
        .from('items')
        .select('id')
        .eq('folder_id', id)
        .not('deleted_at', 'is', null)

    if (items && items.length > 0) {
        await Promise.all(
            items.map((item: any) =>
                supabase.rpc('restore_item', { p_item_id: item.id })
            )
        )
    }
}

export async function permanentDeleteItem(id: string) {
    const { error } = await supabase.rpc('permanent_delete_item', { p_item_id: id })
    if (error) throw error
}

export async function permanentDeleteFolder(id: string) {
    const { error } = await supabase.rpc('permanent_delete_folder', { p_folder_id: id })
    if (error) throw error
}
