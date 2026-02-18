"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { WorkspaceItem } from "./workspace-item"
import { Folder } from "@/lib/types"

interface SortableFolderItemProps {
    workspace: Folder
}

export function SortableFolderItem({ workspace }: SortableFolderItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: workspace.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <WorkspaceItem workspace={workspace} />
        </div>
    )
}
