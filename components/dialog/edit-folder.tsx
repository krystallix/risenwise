"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Save } from 'lucide-react'
import { IconPicker } from "@/components/icon-picker"
import { useWorkspace } from "@/hooks/use-workspace"

interface EditFolderDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    folderId: string
    folderName: string
    folderIcon: string
}

export default function EditFolderDialog({
    open,
    onOpenChange,
    folderId,
    folderName,
    folderIcon
}: EditFolderDialogProps) {
    const [name, setName] = useState(folderName)
    const [icon, setIcon] = useState(folderIcon)
    const updateFolder = useWorkspace(state => state.updateFolder)

    // Update local state when props change
    useEffect(() => {
        setName(folderName)
        setIcon(folderIcon)
    }, [folderName, folderIcon, open])

    const handleSave = () => {
        if (!name.trim()) return

        updateFolder(folderId, { name, icon })
        onOpenChange(false)
    }

    const hasChanges = name !== folderName || icon !== folderIcon

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Folder</DialogTitle>
                    <DialogDescription>
                        Update folder name and icon
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pb-4">
                    <div className="space-y-2">
                        <Label htmlFor="folder-name">Folder Name</Label>
                        <Input
                            id="folder-name"
                            placeholder="My Folder"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave()
                            }}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Icon</Label>
                        <IconPicker value={icon} onChange={setIcon} />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!name.trim() || !hasChanges}
                    >
                        <Save className="size-4" />
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
