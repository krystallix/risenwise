"use client"

import { create } from 'zustand'
import { Folder, Item, PendingOperation } from '@/lib/types'
import * as folderQueries from '@/lib/supabase/folders'
import * as itemQueries from '@/lib/supabase/items'
import { toast } from "sonner"

interface WorkspaceStore {
    folders: Folder[]
    items: Item[]
    pendingOperations: Map<string, PendingOperation>

    createFolder: (name: string, icon: string, parentId?: string | null) => Promise<void>
    updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>
    deleteFolder: (id: string) => Promise<void>

    createItem: (name: string, icon: string, folderId: string | null) => Promise<void>
    updateItem: (id: string, updates: Partial<Item>) => Promise<void>
    deleteItem: (id: string) => Promise<void>
    moveItem: (id: string, folderId: string | null) => Promise<void>
    archiveItem: (id: string) => Promise<void>

    fetchFolders: () => Promise<void>
    fetchItems: (folderId?: string | null) => Promise<void>

    setPending: (id: string, operation: PendingOperation) => void
    removePending: (id: string) => void
}

export const useWorkspace = create<WorkspaceStore>((set, get) => ({
    folders: [],
    items: [],
    pendingOperations: new Map(),

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

    createFolder: async (name, icon, parentId = null) => {
        const tempId = `temp-folder-${Date.now()}`
        const optimisticFolder: Folder = {
            id: tempId,
            name,
            icon,
            parent_id: parentId,
            position: get().folders.length,
            is_favorite: false,
            created_at: new Date().toISOString(),
            user_id: ''
        }

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

            set(state => ({
                folders: state.folders.map(f =>
                    f.id === tempId ? data : f
                )
            }))

            get().removePending(tempId)
            toast.success("Folder created successfully")

        } catch (error) {
            console.error('Failed to create folder:', error)

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

        set(state => ({
            folders: state.folders.map(f =>
                f.id === id ? { ...f, ...updates } : f
            )
        }))
        get().setPending(id, { id, type: 'update', status: 'pending' })

        try {
            await folderQueries.updateFolder(id, updates)

            get().removePending(id)
            toast.success("Folder updated successfully")

        } catch (error) {
            console.error('Failed to update folder:', error)

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

        set(state => ({
            folders: state.folders.filter(f => f.id !== id)
        }))
        get().setPending(id, { id, type: 'delete', status: 'pending' })

        try {
            await folderQueries.deleteFolder(id)

            get().removePending(id)
            toast.success("Folder deleted successfully")

        } catch (error) {
            console.error('Failed to delete folder:', error)

            set(state => ({
                folders: [...state.folders, originalFolder]
            }))

            get().removePending(id)
            toast.error("Failed to delete folder")
        }
    },

    createItem: async (name, icon, folderId) => {
        const tempId = `temp-item-${Date.now()}`
        const optimisticItem: Item = {
            id: tempId,
            name,
            icon,
            folder_id: folderId,
            content: { type: 'doc', content: [] },
            position: get().items.length,
            is_favorite: false,
            is_archived: false,
            created_at: new Date().toISOString(),
            user_id: ''
        }

        set(state => ({
            items: [...state.items, optimisticItem]
        }))
        get().setPending(tempId, { id: tempId, type: 'create', status: 'pending' })

        try {
            const data = await itemQueries.createItem(
                name,
                icon,
                folderId,
                optimisticItem.position
            )

            set(state => ({
                items: state.items.map(i =>
                    i.id === tempId ? data : i
                )
            }))

            get().removePending(tempId)
            toast.success("Document created successfully")

        } catch (error) {
            console.error('Failed to create item:', error)

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

        set(state => ({
            items: state.items.filter(i => i.id !== id)
        }))
        get().setPending(id, { id, type: 'delete', status: 'pending' })

        try {
            await itemQueries.deleteItem(id)

            get().removePending(id)
            toast.success("Document deleted successfully")

        } catch (error) {
            console.error('Failed to delete item:', error)

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

            set(state => ({
                items: state.items.map(i =>
                    i.id === id ? originalItem : i
                )
            }))

            get().removePending(id)
            toast.error("Failed to archive document")
        }
    },

    fetchFolders: async () => {
        try {
            const data = await folderQueries.getFolders()
            set({ folders: data })
        } catch (error) {
            console.error('Failed to fetch folders:', error)
            toast.error("Failed to load folders")
        }
    },

    fetchItems: async (folderId) => {
        try {
            const data = await itemQueries.getItems(folderId)
            set({ items: data })
        } catch (error) {
            console.error('Failed to fetch items:', error)
            toast.error("Failed to load documents")
        }
    }
}))
