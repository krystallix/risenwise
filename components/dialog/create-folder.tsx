"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Plus } from 'lucide-react'
import { IconPicker } from "@/components/icon-picker"
import { useWorkspace } from "@/hooks/use-workspace"

interface CreateFolderDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function CreateFolderDialog({ open, onOpenChange }: CreateFolderDialogProps) {
    const [folderName, setFolderName] = useState("")
    const [selectedIcon, setSelectedIcon] = useState<string>("Folder")
    const createFolder = useWorkspace(state => state.createFolder)

    const handleCreate = () => {
        if (!folderName.trim()) return

        createFolder(folderName, selectedIcon)

        setFolderName("")
        setSelectedIcon("Folder")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                    <DialogDescription>
                        Enter folder name and choose an icon
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pb-4">
                    <div className="space-y-2">
                        <Label htmlFor="folder-name">Folder Name</Label>
                        <Input
                            id="folder-name"
                            placeholder="My Folder"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreate()
                            }}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Icon</Label>
                        <IconPicker value={selectedIcon} onChange={setSelectedIcon} />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!folderName.trim()}>
                        <Plus className="size-4" />
                        Create Folder
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
