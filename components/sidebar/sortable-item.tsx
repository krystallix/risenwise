"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { SidebarMenuSubButton, SidebarMenuSubItem, SidebarMenuAction } from "@/components/ui/sidebar"
import { Item } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Loader2, MoreHorizontal, StarOff, Link as LinkIcon, ArrowUpRight, Trash2, FolderInput } from "lucide-react"
import { useWorkspace } from "@/hooks/use-workspace"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSidebar } from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SortableItemProps {
    item: Item
    onDelete: (itemId: string, itemName: string) => void
}

export function SortableItem({ item, onDelete }: SortableItemProps) {
    const pathname = usePathname()
    const isActive = pathname === `/dashboard/file/${item.id}`
    const { isMobile } = useSidebar()
    const pendingOperations = useWorkspace(state => state.pendingOperations)
    const moveItemToFolder = useWorkspace(state => state.moveItemToFolder)

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id, data: { type: 'item', item } })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    const itemPending = pendingOperations.has(item.id)

    const handleMoveToRoot = () => {
        if (item.folder_id !== null) {
            moveItemToFolder(item.id, null)
        }
    }

    return (
        <SidebarMenuSubItem
            ref={setNodeRef}
            style={style}
            className={cn("group/page", itemPending && "opacity-60")}
        >
            <SidebarMenuSubButton
                asChild
                isActive={isActive}
                className={cn(isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground")}
            >
                <Link href={`/dashboard/file/${item.id}`} className="pr-8" {...attributes} {...listeners}>
                    {itemPending ? <Loader2 className="size-3 animate-spin mr-1" /> : <span className="text-base">{item.icon}</span>}
                    <span className="truncate">{item.name}</span>
                </Link>
            </SidebarMenuSubButton>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <SidebarMenuAction
                        className="opacity-0 group-hover/page:opacity-100 transition-opacity top-1/2 -translate-y-1/2"
                    >
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
                    {item.folder_id !== null && (
                        <>
                            <DropdownMenuItem onClick={handleMoveToRoot}>
                                <FolderInput className="size-4 text-muted-foreground" />
                                <span>Move to Root</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}
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
                        onClick={() => onDelete(item.id, item.name)}
                    >
                        <Trash2 className="size-4" />
                        <span>Delete</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarMenuSubItem>
    )
}
