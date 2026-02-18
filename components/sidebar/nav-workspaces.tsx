"use client"

import * as React from "react"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, pointerWithin, DragOverEvent, useDroppable } from "@dnd-kit/core"
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Plus, FolderPlus, FilePlus, MoreHorizontal } from "lucide-react"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
} from "@/components/ui/sidebar"
import CreateFolderDialog from "../dialog/create-folder"
import CreateFileDialog from "../dialog/create-file"
import { useWorkspace } from "@/hooks/use-workspace"
import { SortableFolderItem } from "./sortable-folder-item"
import { SortableItem } from "./sortable-item"
import DeleteFileDialog from "../dialog/delete-file"
import { Item } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useShallow } from "zustand/react/shallow"

export function NavWorkspaces() {
  const [folderDialogOpen, setFolderDialogOpen] = React.useState(false)
  const [fileDialogOpen, setFileDialogOpen] = React.useState(false)
  const [deleteFileDialogOpen, setDeleteFileDialogOpen] = React.useState(false)
  const [selectedFileId, setSelectedFileId] = React.useState<string>("")
  const [selectedFileName, setSelectedFileName] = React.useState<string>("")
  const [activeItem, setActiveItem] = React.useState<Item | null>(null)

  const folders = useWorkspace(state => state.folders)
  const rootItems = useWorkspace(
    useShallow(state => state.items.filter(i => i.folder_id === null))
  )
  const fetchFolders = useWorkspace(state => state.fetchFolders)
  const fetchItems = useWorkspace(state => state.fetchItems)
  const reorderFolders = useWorkspace(state => state.reorderFolders)
  const reorderItems = useWorkspace(state => state.reorderItems)
  const moveItemToFolder = useWorkspace(state => state.moveItemToFolder)

  const { setNodeRef: setRootDropRef, isOver: isOverRoot } = useDroppable({
    id: 'root-folder',
    data: { type: 'folder', folderId: null }
  })

  // Additional drop zone at the bottom for easier access
  const { setNodeRef: setRootBottomDropRef, isOver: isOverRootBottom } = useDroppable({
    id: 'root-folder-bottom',
    data: { type: 'folder', folderId: null }
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  React.useEffect(() => {
    fetchFolders()
    fetchItems()
  }, [fetchFolders, fetchItems])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeData = active.data.current

    if (activeData?.type === 'item') {
      setActiveItem(activeData.item)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    if (activeData?.type !== 'item' || !activeData.item) return
    const activeItem = activeData.item


    // 0. Explicit check for Root Drop Zones
    if (over.id === 'root-folder' || over.id === 'root-folder-bottom') {
      if (activeItem.folder_id !== null) {
        moveItemToFolder(active.id as string, null)
      }
      return
    }

    // 1. If over a Folder (droppable container)
    if (overData?.type === 'folder') {
      const targetFolderId = overData.folderId
      if (activeItem.folder_id !== targetFolderId) {
        moveItemToFolder(active.id as string, targetFolderId)
      }
    }

    // 2. If over an Item (sortable item)
    if (overData?.type === 'item' && overData.item) {
      const overItem = overData.item
      const targetFolderId = overItem.folder_id

      // If items are in different folders, move active to target's folder
      if (activeItem.folder_id !== targetFolderId) {
        moveItemToFolder(active.id as string, targetFolderId)
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveItem(null)

    if (!over || active.id === over.id) return

    const activeData = active.data.current
    const overData = over.data.current

    // Reorder folders
    if (!activeData?.type && !overData?.type) {
      const oldIndex = folders.findIndex(f => f.id === active.id)
      const newIndex = folders.findIndex(f => f.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newFolders = arrayMove(folders, oldIndex, newIndex)
        reorderFolders(newFolders)
      }
    }

    // Reorder items within same folder
    if (activeData?.type === 'item' && overData?.type === 'item') {
      const activeItem = activeData.item
      const overItem = overData.item

      if (activeItem && overItem && activeItem.folder_id === overItem.folder_id) {
        const allItems = useWorkspace.getState().items
        const folderItems = allItems.filter(i => i.folder_id === activeItem.folder_id)
        const oldIndex = folderItems.findIndex(i => i.id === active.id)
        const newIndex = folderItems.findIndex(i => i.id === over.id)

        if (oldIndex !== -1 && newIndex !== -1) {
          const newFolderItems = arrayMove(folderItems, oldIndex, newIndex)
          const otherItems = allItems.filter(i => i.folder_id !== activeItem.folder_id)
          reorderItems([...otherItems, ...newFolderItems])
        }
      }
    }
  }

  const handleDeleteFile = (itemId: string, itemName: string) => {
    setSelectedFileId(itemId)
    setSelectedFileName(itemName)
    setDeleteFileDialogOpen(true)
  }

  return (
    <>
      <CreateFolderDialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen} />
      <CreateFileDialog open={fileDialogOpen} onOpenChange={setFileDialogOpen} folderId={null} />
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
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SidebarMenu>
              {/* Root Items - Items without folder */}
              {/* Root Items - Items without folder */}
              {rootItems.length > 0 && (
                <div
                  ref={setRootDropRef}
                  className={cn(
                    "min-h-[10px] transition-colors rounded-md mb-2",
                    isOverRoot && "bg-accent/50"
                  )}
                >
                  <SidebarMenuSub>
                    <SortableContext items={rootItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                      {rootItems.map((item) => (
                        <SortableItem
                          key={item.id}
                          item={item}
                          onDelete={handleDeleteFile}
                        />
                      ))}
                    </SortableContext>
                  </SidebarMenuSub>
                </div>
              )}

              {/* Folders */}
              <SortableContext items={folders.map(f => f.id)} strategy={verticalListSortingStrategy}>
                {folders.map((folder) => (
                  <SortableFolderItem key={folder.id} workspace={folder} />
                ))}
              </SortableContext>

              {/* Empty State */}
              {folders.length === 0 && rootItems.length === 0 && (
                <SidebarMenuItem>
                  <SidebarMenuButton className="text-sidebar-foreground/60 text-sm">
                    No folders or files yet
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Bottom Drop Zone for Root */}
              <div
                ref={setRootBottomDropRef}
                className={cn(
                  "min-h-[20px] transition-colors rounded-md mt-2",
                  isOverRootBottom && "bg-accent/50 min-h-[40px]"
                )}
              />
            </SidebarMenu>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeItem && (
                <div className="bg-background border rounded-md p-2 shadow-lg flex items-center">
                  <span className="text-base mr-2">{activeItem.icon}</span>
                  <span>{activeItem.name}</span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}
