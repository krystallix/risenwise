"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Plus } from 'lucide-react'
import { EmojiPickerComponent } from "@/components/emoji-picker"
import { useWorkspace } from "@/hooks/use-workspace"

interface CreateFileDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    folderId?: string | null
}

export default function CreateFileDialog({ open, onOpenChange, folderId = null }: CreateFileDialogProps) {
    const [fileName, setFileName] = useState("")
    const [selectedEmoji, setSelectedEmoji] = useState<string>("📄")
    const createItem = useWorkspace(state => state.createItem)

    const handleCreate = async () => {
        if (!fileName.trim()) return

        createItem(fileName, selectedEmoji, folderId)

        setFileName("")
        setSelectedEmoji("📄")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New File</DialogTitle>
                    <DialogDescription>
                        Enter file name and choose an emoji
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pb-4">
                    <div className="space-y-2">
                        <Label htmlFor="file-name">File Name</Label>
                        <Input
                            id="file-name"
                            placeholder="My Document"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreate()
                            }}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Emoji</Label>
                        <EmojiPickerComponent value={selectedEmoji} onChange={setSelectedEmoji} />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!fileName.trim()}>
                        <Plus className="size-4" />
                        Create File
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
