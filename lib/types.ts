export interface Folder {
    id: string
    name: string
    icon: string
    parent_id: string | null
    position: number
    is_favorite: boolean
    is_active: boolean
    created_at: string
    user_id: string
}

export interface Item {
    id: string
    name: string
    description: string
    icon: string
    folder_id: string | null
    content: any
    position: number
    is_favorite: boolean
    is_archived: boolean
    created_at: string
    user_id: string
}

export interface PendingOperation {
    id: string
    type: 'create' | 'update' | 'delete'
    status: 'pending' | 'success' | 'error'
}
