'use client'

import { useEffect, useState, useCallback } from 'react'
import {
    getTrash,
    restoreItem,
    restoreFolder,
    permanentDeleteItem,
    permanentDeleteFolder,
    TrashItem
} from '@/lib/supabase/trash'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DynamicIcon } from '@/components/sidebar/dynamic-icon'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react'
import { useWorkspace } from '@/hooks/use-workspace'

type ConfirmDialog =
    | { type: 'batch'; count: number }
    | { type: 'empty'; count: number }
    | { type: 'single'; entry: TrashItem }
    | { type: 'restore'; entry: TrashItem }
    | { type: 'batch-restore'; count: number }
    | null

export default function TrashPage() {
    const [entries, setEntries] = useState<TrashItem[]>([])
    const [loading, setLoading] = useState(true)
    const [actionId, setActionId] = useState<string | null>(null)
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>(null)

    const fetchFolders = useWorkspace(state => state.fetchFolders)
    const fetchItems = useWorkspace(state => state.fetchItems)
    const lastDeletedAt = useWorkspace(state => state.lastDeletedAt)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getTrash()
            setEntries(data)
            setSelected(new Set())
        } finally {
            setLoading(false)
        }
    }, [])

    // Initial load
    useEffect(() => { load() }, [load])

    // Auto reload saat ada delete dari sidebar
    useEffect(() => {
        if (lastDeletedAt) load()
    }, [lastDeletedAt])

    // ── Select ───────────────────────────────────────────────
    function toggleSelect(id: string) {
        setSelected(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    function toggleAll(val: boolean) {
        setSelected(val ? new Set(entries.map(e => e.id)) : new Set())
    }

    // ── Restore ──────────────────────────────────────────────
    function openRestoreDialog(entry: TrashItem) {
        if (entry.type === 'folder' && (entry.children_count ?? 0) > 0) {
            setConfirmDialog({ type: 'restore', entry })
            return
        }
        execRestore(entry)
    }

    async function execRestore(entry: TrashItem) {
        setActionId(entry.id)
        setConfirmDialog(null)
        try {
            if (entry.type === 'item') await restoreItem(entry.id)
            else await restoreFolder(entry.id)
            await Promise.all([fetchFolders(), fetchItems(), load()])
        } finally {
            setActionId(null)
        }
    }

    function openBatchRestoreDialog() {
        const targets = entries.filter(e => selected.has(e.id))
        const hasFolder = targets.some(e => e.type === 'folder' && (e.children_count ?? 0) > 0)
        if (hasFolder) {
            setConfirmDialog({ type: 'batch-restore', count: targets.length })
            return
        }
        execBatchRestore(targets)
    }

    async function execBatchRestore(targets?: TrashItem[]) {
        const list = targets ?? entries.filter(e => selected.has(e.id))
        setConfirmDialog(null)
        setLoading(true)
        try {
            await Promise.all(
                list.map(e => e.type === 'item' ? restoreItem(e.id) : restoreFolder(e.id))
            )
            await Promise.all([fetchFolders(), fetchItems(), load()])
        } finally {
            setLoading(false)
        }
    }

    // ── Delete ───────────────────────────────────────────────
    async function handlePermanentDelete(entry: TrashItem) {
        setActionId(entry.id)
        setConfirmDialog(null)
        try {
            if (entry.type === 'item') await permanentDeleteItem(entry.id)
            else await permanentDeleteFolder(entry.id)
            await load()
        } finally {
            setActionId(null)
        }
    }

    async function handleBatchDelete() {
        setConfirmDialog(null)
        setLoading(true)
        try {
            const targets = entries.filter(e => selected.has(e.id))
            await Promise.all(
                targets.map(e =>
                    e.type === 'item' ? permanentDeleteItem(e.id) : permanentDeleteFolder(e.id)
                )
            )
            await load()
        } finally {
            setLoading(false)
        }
    }

    async function handleEmptyTrash() {
        setConfirmDialog(null)
        setLoading(true)
        try {
            await Promise.all(
                entries.map(e =>
                    e.type === 'item' ? permanentDeleteItem(e.id) : permanentDeleteFolder(e.id)
                )
            )
            setEntries([])
        } finally {
            setLoading(false)
        }
    }

    // ── Derived ──────────────────────────────────────────────
    const allSelected = entries.length > 0 && selected.size === entries.length
    const someSelected = selected.size > 0

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-lg font-semibold">Trash</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {entries.length} item{entries.length !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {someSelected ? (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={loading}
                                onClick={openBatchRestoreDialog}
                            >
                                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                Restore {selected.size} selected
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={loading}
                                onClick={() => setConfirmDialog({ type: 'batch', count: selected.size })}
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                Delete {selected.size} selected
                            </Button>
                        </>
                    ) : entries.length > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={loading}
                            onClick={() => setConfirmDialog({ type: 'empty', count: entries.length })}
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Empty trash
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                    Loading...
                </div>
            ) : entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
                    <Trash2 className="w-10 h-10 opacity-20" />
                    <p className="text-sm">Trash is empty.</p>
                    <p className="text-xs">Items in trash will be deleted permanently after 30 days.</p>
                </div>
            ) : (
                <div className="rounded-lg bg-background overflow-hidden">
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-muted/30">
                        <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                        <span className="text-xs text-muted-foreground">
                            {someSelected
                                ? `${selected.size} of ${entries.length} selected`
                                : 'Select all'
                            }
                        </span>
                    </div>

                    <Separator />

                    <ul>
                        {entries.map((entry, i) => (
                            <TrashRow
                                key={entry.id}
                                entry={entry}
                                busy={actionId === entry.id}
                                checked={selected.has(entry.id)}
                                onToggle={toggleSelect}
                                onRestore={openRestoreDialog}
                                onDelete={entry => setConfirmDialog({ type: 'single', entry })}
                                isLast={i === entries.length - 1}
                            />
                        ))}
                    </ul>
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmActionDialog
                dialog={confirmDialog}
                onClose={() => setConfirmDialog(null)}
                onConfirm={() => {
                    if (!confirmDialog) return
                    if (confirmDialog.type === 'batch') handleBatchDelete()
                    else if (confirmDialog.type === 'empty') handleEmptyTrash()
                    else if (confirmDialog.type === 'single') handlePermanentDelete(confirmDialog.entry)
                    else if (confirmDialog.type === 'restore') execRestore(confirmDialog.entry)
                    else if (confirmDialog.type === 'batch-restore') execBatchRestore()
                }}
            />
        </div>
    )
}

// ── ConfirmActionDialog ──────────────────────────────────────

function ConfirmActionDialog({
    dialog,
    onClose,
    onConfirm,
}: {
    dialog: ConfirmDialog
    onClose: () => void
    onConfirm: () => void
}) {
    const isRestore = dialog?.type === 'restore' || dialog?.type === 'batch-restore'

    const title = !dialog ? '' :
        dialog.type === 'batch' ? `Delete ${dialog.count} items permanently?` :
            dialog.type === 'empty' ? 'Empty trash?' :
                dialog.type === 'single' ? `Delete "${dialog.entry.name}" permanently?` :
                    dialog.type === 'restore' ? `Restore "${dialog.entry.name}"?` :
                        dialog.type === 'batch-restore' ? `Restore ${dialog.count} items?` : ''

    const description = !dialog ? '' :
        dialog.type === 'empty' ?
            `All ${dialog.count} items will be deleted and cannot be restored.` :
            dialog.type === 'restore' && (dialog.entry.children_count ?? 0) > 0 ?
                `Restoring this folder will also restore all ${dialog.entry.children_count} item${dialog.entry.children_count! > 1 ? 's' : ''} inside it.` :
                dialog.type === 'batch-restore' ?
                    'Some selected folders contain items. Restoring them will also restore all items inside.' :
                    isRestore ?
                        'This item will be moved back to your workspace.' :
                        'This action cannot be undone.'

    return (
        <Dialog open={!!dialog} onOpenChange={open => !open && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    {isRestore ? (
                        <Button onClick={onConfirm}>
                            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                            Restore
                        </Button>
                    ) : (
                        <Button variant="destructive" onClick={onConfirm}>
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Delete permanently
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ── TrashRow ─────────────────────────────────────────────────

function TrashRow({
    entry,
    busy,
    checked,
    onToggle,
    onRestore,
    onDelete,
    isLast,
}: {
    entry: TrashItem
    busy: boolean
    checked: boolean
    onToggle: (id: string) => void
    onRestore: (e: TrashItem) => void
    onDelete: (e: TrashItem) => void
    isLast: boolean
}) {
    const [hovered, setHovered] = useState(false)

    const deletedAt = new Date(entry.deleted_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })

    const isFolder = entry.type === 'folder'

    const details: string[] = [isFolder ? 'Folder' : 'Item']
    if (isFolder && (entry.children_count ?? 0) > 0) {
        details.push(`${entry.children_count} item${entry.children_count! > 1 ? 's' : ''} inside`)
    }
    details.push(deletedAt)

    return (
        <li
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`flex items-center gap-2.5 px-3 py-2 transition-colors
                ${checked ? 'bg-primary/5' : 'hover:bg-muted/40'}
                ${!isLast ? 'border-b border-border/50' : ''}
            `}
        >
            <Checkbox
                checked={checked}
                onCheckedChange={() => onToggle(entry.id)}
                disabled={busy}
            />

            <DynamicIcon
                name={entry.icon || (isFolder ? 'Folder' : 'File')}
                className="w-4 h-4 shrink-0 text-muted-foreground"
            />

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-tight">
                    {entry.name}
                </p>
                <p className="text-xs text-muted-foreground">
                    {details.join(' · ')}
                </p>
            </div>

            <div className={`transition-opacity ${hovered || busy ? 'opacity-100' : 'opacity-0'}`}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={busy}>
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                            onClick={() => onRestore(entry)}
                            className="gap-2 cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restore
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onDelete(entry)}
                            className="gap-2 cursor-pointer
                                text-destructive hover:text-destructive focus:text-destructive
                                hover:bg-destructive/10 focus:bg-destructive/10
                                [&_svg]:text-destructive"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete permanently
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </li>
    )
}
