"use client"

import * as React from "react"
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
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { ChevronRight, Plus, MoreHorizontal, FilePlus, FolderCog, Trash2, Loader2, StarOff, ArrowUpRight, Link } from "lucide-react"
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
import { useShallow } from "zustand/react/shallow"

interface WorkspaceItemProps {
    workspace: Folder
}

export function WorkspaceItem({ workspace }: WorkspaceItemProps) {
    const { isMobile } = useSidebar()
    const [isOpen, setIsOpen] = React.useState(false)
    const [fileDialogOpen, setFileDialogOpen] = React.useState(false)
    const [editFolderDialogOpen, setEditFolderDialogOpen] = React.useState(false)
    const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = React.useState(false)
    const [deleteFileDialogOpen, setDeleteFileDialogOpen] = React.useState(false)
    const [selectedFileId, setSelectedFileId] = React.useState<string>("")
    const [selectedFileName, setSelectedFileName] = React.useState<string>("")

    const pendingOperations = useWorkspace(state => state.pendingOperations)
    const items = useWorkspace(
        useShallow(state => state.items.filter(i => i.folder_id === workspace.id))
    )

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

            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <SidebarMenuItem className={cn("group/item", isPending && "opacity-60")}>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                            {isPending && <Loader2 className="size-3 animate-spin mr-1" />}
                            <DynamicIcon name={workspace.icon} />
                            <span>{workspace.name}</span>
                            <ChevronRight
                                className={cn(
                                    "transition-all duration-200 text-sidebar-foreground/60 size-4",
                                    "opacity-0 group-hover/item:opacity-100",
                                    isOpen && "rotate-90"
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
                                    setIsOpen(true)
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
                            {items.map((item) => {
                                const itemPending = pendingOperations.has(item.id)
                                return (
                                    <SidebarMenuSubItem key={item.id} className={cn("group/page", itemPending && "opacity-60")}>
                                        <SidebarMenuSubButton asChild>
                                            <a href={`/doc/${item.id}`} className="pr-8">
                                                {itemPending && <Loader2 className="size-3 animate-spin mr-1" />}
                                                <span className="text-base">{item.icon}</span>
                                                <span className="truncate">{item.name}</span>
                                            </a>
                                        </SidebarMenuSubButton>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <SidebarMenuAction className="opacity-0 group-hover/page:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="size-4" />
                                                </SidebarMenuAction>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                className="w-56 rounded-lg"
                                                side={isMobile ? "bottom" : "right"}
                                                align={isMobile ? "end" : "start"}
                                            >
                                                <DropdownMenuLabel>{item.name}</DropdownMenuLabel>
                                                <DropdownMenuItem>
                                                    <StarOff className="size-4 text-muted-foreground" />
                                                    <span>Remove from Favorites</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>
                                                    <Link className="size-4 text-muted-foreground" />
                                                    <span>Copy Link</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <ArrowUpRight className="size-4 text-muted-foreground" />
                                                    <span>Open in New Tab</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    onClick={() => handleDeleteFile(item.id, item.name)}
                                                >
                                                    <Trash2 className="size-4" />
                                                    <span>Delete</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </SidebarMenuSubItem>
                                )
                            })}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
            </Collapsible>
        </>
    )
}
