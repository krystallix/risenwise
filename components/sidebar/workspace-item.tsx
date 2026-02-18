"use client"

import * as React from "react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRight, Plus, FilePlus, FolderCog, Trash2, Loader2 } from "lucide-react"
import { DynamicIcon } from "@/components/sidebar/dynamic-icon"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useWorkspace } from "@/hooks/use-workspace"
import { Folder } from "@/lib/types"
import CreateFileDialog from "../dialog/create-file"
import DeleteFolderDialog from "../dialog/delete-folder"
import DeleteFileDialog from "../dialog/delete-file"
import EditFolderDialog from "../dialog/edit-folder"
import { SortableItem } from "./sortable-item"
import { useShallow } from "zustand/react/shallow"

interface WorkspaceItemProps {
    workspace: Folder
}

export function WorkspaceItem({ workspace }: WorkspaceItemProps) {
    const [fileDialogOpen, setFileDialogOpen] = React.useState(false)
    const [editFolderDialogOpen, setEditFolderDialogOpen] = React.useState(false)
    const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = React.useState(false)
    const [deleteFileDialogOpen, setDeleteFileDialogOpen] = React.useState(false)
    const [selectedFileId, setSelectedFileId] = React.useState<string>("")
    const [selectedFileName, setSelectedFileName] = React.useState<string>("")

    const pendingOperations = useWorkspace(state => state.pendingOperations)
    const updateFolder = useWorkspace(state => state.updateFolder)
    const items = useWorkspace(
        useShallow(state => state.items.filter(i => i.folder_id === workspace.id))
    )

    const handleToggle = (open: boolean) => {
        updateFolder(workspace.id, { is_active: open })
    }

    const { setNodeRef, isOver } = useDroppable({
        id: `folder-${workspace.id}`,
        data: { type: 'folder', folderId: workspace.id }
    })

    const isPending = pendingOperations.has(workspace.id)

    const handleDeleteFile = (itemId: string, itemName: string) => {
        setSelectedFileId(itemId)
        setSelectedFileName(itemName)
        setDeleteFileDialogOpen(true)
    }

    return (
        <>
            <CreateFileDialog
                open={fileDialogOpen}
                onOpenChange={setFileDialogOpen}
                folderId={workspace.id}
            />

            <EditFolderDialog
                open={editFolderDialogOpen}
                onOpenChange={setEditFolderDialogOpen}
                folderId={workspace.id}
                folderName={workspace.name}
                folderIcon={workspace.icon}
            />

            <DeleteFolderDialog
                open={deleteFolderDialogOpen}
                onOpenChange={setDeleteFolderDialogOpen}
                folderId={workspace.id}
                folderName={workspace.name}
            />

            <DeleteFileDialog
                open={deleteFileDialogOpen}
                onOpenChange={setDeleteFileDialogOpen}
                fileId={selectedFileId}
                fileName={selectedFileName}
            />

            <Collapsible open={workspace.is_active} onOpenChange={handleToggle}>
                <SidebarMenuItem
                    ref={setNodeRef}
                    className={cn(
                        "group/item",
                    )}
                >
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                            {/* {isPending ? <Loader2 className="size-3 animate-spin mr-1" /> : />} */}
                            <DynamicIcon name={workspace.icon} />
                            <span>{workspace.name}</span>
                            <ChevronRight
                                className={cn(
                                    "transition-all duration-200 text-sidebar-foreground/60 size-4",
                                    "opacity-0 group-hover/item:opacity-100",
                                    workspace.is_active && "rotate-90"
                                )}
                            />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuAction className="opacity-0 group-hover/item:opacity-100">
                                <Plus className="size-4" />
                            </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-40" align="start" side="right">
                            <DropdownMenuLabel>Manage Folder</DropdownMenuLabel>
                            <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => {
                                    handleToggle(true)
                                    setFileDialogOpen(true)
                                }}>
                                    <FilePlus className="size-4" />
                                    New Docs
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditFolderDialogOpen(true)}>
                                    <FolderCog className="size-4" />
                                    Edit Folder
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setDeleteFolderDialogOpen(true)}
                                >
                                    <Trash2 className="size-4" />
                                    Delete Folder
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {items.length === 0 && (
                                <SidebarMenuSubItem>
                                    <div className="text-xs text-muted-foreground px-2 py-1">
                                        No documents yet
                                    </div>
                                </SidebarMenuSubItem>
                            )}
                            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                {items.map((item) => (
                                    <SortableItem
                                        key={item.id}
                                        item={item}
                                        onDelete={handleDeleteFile}
                                    />
                                ))}
                            </SortableContext>
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
            </Collapsible>
        </>
    )
}
