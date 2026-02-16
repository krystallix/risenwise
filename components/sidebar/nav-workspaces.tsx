"use client"

import * as React from "react"
import { Plus, FolderPlus, FilePlus, MoreHorizontal, Loader2, Trash2, StarOff, Link as LinkIcon, ArrowUpRight } from "lucide-react"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  useSidebar,
} from "@/components/ui/sidebar"
import CreateFolderDialog from "../dialog/create-folder"
import CreateFileDialog from "../dialog/create-file"
import DeleteFileDialog from "../dialog/delete-file"
import { useWorkspace } from "@/hooks/use-workspace"
import { WorkspaceItem } from "./workspace-item"
import { useShallow } from "zustand/react/shallow"
import { cn } from "@/lib/utils"

export function NavWorkspaces() {
  const { isMobile } = useSidebar()
  const [folderDialogOpen, setFolderDialogOpen] = React.useState(false)
  const [fileDialogOpen, setFileDialogOpen] = React.useState(false)

  // States needed for item management (similar to WorkspaceItem)
  const [deleteFileDialogOpen, setDeleteFileDialogOpen] = React.useState(false)
  const [selectedFileId, setSelectedFileId] = React.useState<string>("")
  const [selectedFileName, setSelectedFileName] = React.useState<string>("")

  const folders = useWorkspace(state => state.folders)
  const fetchFolders = useWorkspace(state => state.fetchFolders)
  const fetchItems = useWorkspace(state => state.fetchItems)
  const pendingOperations = useWorkspace(state => state.pendingOperations)
  const deleteItem = useWorkspace(state => state.deleteItem)

  // Get unfiled items
  const unfiledItems = useWorkspace(
    useShallow(state => state.items.filter(i => i.folder_id === null))
  )

  const handleDeleteFile = (itemId: string, itemName: string) => {
    setSelectedFileId(itemId)
    setSelectedFileName(itemName)
    setDeleteFileDialogOpen(true)
  }

  // Fetch data saat component mount
  React.useEffect(() => {
    fetchFolders()
    fetchItems()
  }, [fetchFolders, fetchItems])

  return (
    <>
      <CreateFolderDialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen} />
      <CreateFileDialog open={fileDialogOpen} onOpenChange={setFileDialogOpen} />
      <DeleteFileDialog
        open={deleteFileDialogOpen}
        onOpenChange={setDeleteFileDialogOpen}
        fileId={selectedFileId}
        fileName={selectedFileName}
      />

      <SidebarGroup>
        <div className="flex flex-row justify-between items-center">
          <SidebarGroupLabel>Organize</SidebarGroupLabel>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="mr-0.5 hover:bg-pink-200 hover:text-pink-600">
                <Plus className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" align="start" side="right">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setFolderDialogOpen(true)}>
                  <FolderPlus className="size-4" />
                  New Folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFileDialogOpen(true)}>
                  <FilePlus className="size-4" />
                  New File
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <SidebarGroupContent>
          <SidebarMenu>
            {folders.map((folder) => (
              <WorkspaceItem key={folder.id} workspace={folder} />
            ))}

            {/* Render Unfiled Items */}
            {unfiledItems.map((item) => {
              const itemPending = pendingOperations.has(item.id)
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild>
                    <a href={`/doc/${item.id}`} className={cn("pr-8", itemPending && "opacity-60")}>
                      {itemPending && <Loader2 className="size-3 animate-spin mr-1" />}
                      <span className="text-base">{item.icon}</span>
                      <span className="truncate">{item.name}</span>
                    </a>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction className="opacity-0 group-hover/menu-item:opacity-100 transition-opacity">
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
                        <LinkIcon className="size-4 text-muted-foreground" />
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
                </SidebarMenuItem>
              )
            })}

            {folders.length === 0 && unfiledItems.length === 0 && (
              <SidebarMenuItem>
                <SidebarMenuButton className="text-sidebar-foreground/60 text-xs" onClick={() => setFolderDialogOpen(true)}>
                  No folders yet.
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton className="text-sidebar-foreground/70">
                <MoreHorizontal className="size-4" />
                <span>More</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}
