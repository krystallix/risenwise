"use client"

import { create } from 'zustand'
import { Folder, Item, PendingOperation } from '@/lib/types'
import * as folderQueries from '@/lib/supabase/folders'
import * as itemQueries from '@/lib/supabase/items'
import { toast } from "sonner"
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
interface WorkspaceStore {
    folders: Folder[]
    items: Item[]
    pendingOperations: Map<string, PendingOperation>
    lastDeletedAt: number | null
    // Folder operations
    createFolder: (name: string, icon: string, parentId?: string | null) => Promise<void>
    updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>
    deleteFolder: (id: string) => Promise<void>
    reorderFolders: (folders: Folder[]) => Promise<void>

    // Item operations
    createItem: (name: string, emoji: string, folderId: string | null) => Promise<void>
    updateItem: (id: string, updates: Partial<Item>) => Promise<void>
    deleteItem: (id: string) => Promise<void>
    moveItem: (id: string, folderId: string | null) => Promise<void>
    archiveItem: (id: string) => Promise<void>
    reorderItems: (items: Item[]) => Promise<void>
    moveItemToFolder: (itemId: string, targetFolderId: string | null) => Promise<void>

    // Fetch operations
    fetchFolders: () => Promise<void>
    fetchItems: (folderId?: string | null) => Promise<void>

    // Utility
    setPending: (id: string, operation: PendingOperation) => void
    removePending: (id: string) => void
}

export function useItems() {
    const items = useWorkspace(state => state.items)

    const getItemNameById = (id: string) => {
        const item = items.find(i => i.id === id)
        return item?.name || id.slice(0, 8) + "..."
    }

    return { items, getItemNameById }
}

export const useWorkspace = create<WorkspaceStore>((set, get) => ({
    folders: [],
    items: [],
    pendingOperations: new Map(),
    lastDeletedAt: null,
    setPending: (id, operation) => {
        set(state => {
            const newMap = new Map(state.pendingOperations)
            newMap.set(id, operation)
            return { pendingOperations: newMap }
        })
    },

    removePending: (id) => {
        set(state => {
            const newMap = new Map(state.pendingOperations)
            newMap.delete(id)
            return { pendingOperations: newMap }
        })
    },

    // ==================== FOLDER OPERATIONS ====================

    createFolder: async (name, icon, parentId = null) => {
        const tempId = `temp-folder-${Date.now()}`
        const optimisticFolder: Folder = {
            id: tempId,
            name,
            icon,
            is_active: true,
            parent_id: parentId,
            position: get().folders.length,
            is_favorite: false,
            created_at: new Date().toISOString(),
            user_id: ''
        }

        // Optimistic update
        set(state => ({
            folders: [...state.folders, optimisticFolder]
        }))
        get().setPending(tempId, { id: tempId, type: 'create', status: 'pending' })

        try {
            const data = await folderQueries.createFolder(
                name,
                icon,
                parentId,
                optimisticFolder.position
            )

            // Replace temp dengan real data
            set(state => ({
                folders: state.folders.map(f =>
                    f.id === tempId ? data : f
                )
            }))

            get().removePending(tempId)
            toast.success("Folder created successfully")

        } catch (error) {
            console.error('Failed to create folder:', error)

            // Rollback
            set(state => ({
                folders: state.folders.filter(f => f.id !== tempId)
            }))

            get().removePending(tempId)
            toast.error("Failed to create folder")
        }
    },

    updateFolder: async (id, updates) => {
        const originalFolder = get().folders.find(f => f.id === id)
        if (!originalFolder) return

        // Optimistic update
        set(state => ({
            folders: state.folders.map(f =>
                f.id === id ? { ...f, ...updates } : f
            )
        }))
        get().setPending(id, { id, type: 'update', status: 'pending' })

        try {
            await folderQueries.updateFolder(id, updates)

            get().removePending(id)
            // toast.success("Folder updated successfully")

        } catch (error) {
            console.error('Failed to update folder:', error)

            // Rollback
            set(state => ({
                folders: state.folders.map(f =>
                    f.id === id ? originalFolder : f
                )
            }))

            get().removePending(id)
            toast.error("Failed to update folder")
        }
    },

    deleteFolder: async (id) => {
        const originalFolder = get().folders.find(f => f.id === id)
        if (!originalFolder) return

        // Optimistic delete
        set(state => ({
            folders: state.folders.filter(f => f.id !== id)
        }))
        get().setPending(id, { id, type: 'delete', status: 'pending' })

        try {
            await folderQueries.deleteFolder(id)

            get().removePending(id)
            set({ lastDeletedAt: Date.now() })
            toast.success("Folder moved to trash")

        } catch (error) {
            console.error('Failed to delete folder:', error)

            // Rollback
            set(state => ({
                folders: [...state.folders, originalFolder]
            }))

            get().removePending(id)
            toast.error("Failed to delete folder")
        }
    },

    reorderFolders: async (reorderedFolders) => {
        const originalFolders = get().folders

        // Optimistic update
        set({ folders: reorderedFolders })

        try {
            const updates = reorderedFolders.map((folder, index) => ({
                id: folder.id,
                position: index
            }))

            await folderQueries.reorderFolders(updates)

        } catch (error) {
            console.error('Failed to reorder folders:', error)

            // Rollback
            set({ folders: originalFolders })
            toast.error("Failed to reorder folders")
        }
    },

    // ==================== ITEM OPERATIONS ====================

    createItem: async (name, emoji, folderId) => {
        const tempId = `temp-item-${Date.now()}`
        const optimisticItem: Item = {
            id: tempId,
            name,
            icon: emoji,
            description: '',
            folder_id: folderId,
            content: { type: 'doc', content: [] },
            position: get().items.filter(i => i.folder_id === folderId).length,
            is_favorite: false,
            is_archived: false,
            created_at: new Date().toISOString(),
            user_id: ''
        }

        // Optimistic update
        set(state => ({
            items: [...state.items, optimisticItem]
        }))
        get().setPending(tempId, { id: tempId, type: 'create', status: 'pending' })

        try {
            const data = await itemQueries.createItem(
                name,
                emoji,
                folderId,
                optimisticItem.position
            )

            // Replace temp dengan real data
            set(state => ({
                items: state.items.map(i =>
                    i.id === tempId ? data : i
                )
            }))

            get().removePending(tempId)
            toast.success("Document created successfully")

        } catch (error) {
            console.error('Failed to create item:', error)

            // Rollback
            set(state => ({
                items: state.items.filter(i => i.id !== tempId)
            }))

            get().removePending(tempId)
            toast.error("Failed to create document")
        }
    },

    updateItem: async (id, updates) => {
        const originalItem = get().items.find(i => i.id === id)
        if (!originalItem) return

        // Optimistic update
        set(state => ({
            items: state.items.map(i =>
                i.id === id ? { ...i, ...updates } : i
            )
        }))
        get().setPending(id, { id, type: 'update', status: 'pending' })

        try {
            await itemQueries.updateItem(id, updates)
            get().removePending(id)

        } catch (error) {
            console.error('Failed to update item:', error)

            // Rollback
            set(state => ({
                items: state.items.map(i =>
                    i.id === id ? originalItem : i
                )
            }))

            get().removePending(id)
            toast.error("Failed to update document")
        }
    },

    deleteItem: async (id) => {
        const originalItem = get().items.find(i => i.id === id)
        if (!originalItem) return

        // Optimistic delete
        set(state => ({
            items: state.items.filter(i => i.id !== id)
        }))
        get().setPending(id, { id, type: 'delete', status: 'pending' })

        try {
            await itemQueries.deleteItem(id)

            get().removePending(id)
            set({ lastDeletedAt: Date.now() })
            toast.success("Document moved to trash")

        } catch (error) {
            console.error('Failed to delete item:', error)

            // Rollback
            set(state => ({
                items: [...state.items, originalItem]
            }))

            get().removePending(id)
            toast.error("Failed to delete document")
        }
    },

    moveItem: async (id, folderId) => {
        const originalItem = get().items.find(i => i.id === id)
        if (!originalItem) return

        // Optimistic move
        set(state => ({
            items: state.items.map(i =>
                i.id === id ? { ...i, folder_id: folderId } : i
            )
        }))
        get().setPending(id, { id, type: 'update', status: 'pending' })

        try {
            await itemQueries.moveItem(id, folderId)

            get().removePending(id)
            toast.success("Document moved successfully")

        } catch (error) {
            console.error('Failed to move item:', error)

            // Rollback
            set(state => ({
                items: state.items.map(i =>
                    i.id === id ? originalItem : i
                )
            }))

            get().removePending(id)
            toast.error("Failed to move document")
        }
    },

    archiveItem: async (id) => {
        const originalItem = get().items.find(i => i.id === id)
        if (!originalItem) return

        // Optimistic archive
        set(state => ({
            items: state.items.map(i =>
                i.id === id ? { ...i, is_archived: true } : i
            )
        }))
        get().setPending(id, { id, type: 'update', status: 'pending' })

        try {
            await itemQueries.archiveItem(id)

            get().removePending(id)
            toast.success("Document archived successfully")

        } catch (error) {
            console.error('Failed to archive item:', error)

            // Rollback
            set(state => ({
                items: state.items.map(i =>
                    i.id === id ? originalItem : i
                )
            }))

            get().removePending(id)
            toast.error("Failed to archive document")
        }
    },

    reorderItems: async (reorderedItems) => {
        const originalItems = get().items

        // Optimistic update
        set({ items: reorderedItems })

        try {
            const updates = reorderedItems.map((item, index) => ({
                id: item.id,
                position: index,
                folder_id: item.folder_id
            }))

            await itemQueries.reorderItems(updates)

        } catch (error) {
            console.error('Failed to reorder items:', error)

            // Rollback
            set({ items: originalItems })
            toast.error("Failed to reorder items")
        }
    },

    moveItemToFolder: async (itemId, targetFolderId) => {
        const originalItems = get().items
        const item = originalItems.find(i => i.id === itemId)
        if (!item) return

        // Optimistic update
        set(state => ({
            items: state.items.map(i =>
                i.id === itemId ? { ...i, folder_id: targetFolderId } : i
            )
        }))

        try {
            await itemQueries.moveItem(itemId, targetFolderId)
            toast.success("Document moved successfully")

        } catch (error) {
            console.error('Failed to move item:', error)

            // Rollback
            set({ items: originalItems })
            toast.error("Failed to move document")
        }
    },

    // ==================== FETCH OPERATIONS ====================

    fetchFolders: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                console.log('User not authenticated')
                return
            }

            const data = await folderQueries.getFolders()
            set({ folders: data })
        } catch (error) {
            console.error('Failed to fetch folders:', error)
            toast.error("Failed to load folders")
        }
    },

    fetchItems: async (folderId) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                console.log('User not authenticated')
                return
            }

            const data = await itemQueries.getItems(folderId)
            set({ items: data })
        } catch (error) {
            console.error('Failed to fetch items:', error)
            toast.error("Failed to load documents")
        }
    }
}))
