"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useWorkspace } from "@/hooks/use-workspace"
import { Loader2, Trash2 } from "lucide-react"
import { useState } from "react"

interface DeleteFolderDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    folderId: string
    folderName: string
}

export default function DeleteFolderDialog({
    open,
    onOpenChange,
    folderId,
    folderName,
}: DeleteFolderDialogProps) {
    const [isLoading, setLoading] = useState(false)
    const deleteFolder = useWorkspace(state => state.deleteFolder)

    const handleDelete = async () => {
        setLoading(true)

        try {
            await deleteFolder(folderId)
            onOpenChange(false)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete folder?</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete <strong>{folderName}</strong>? This will also delete all documents inside this folder. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        disabled={isLoading}
                        variant="destructive"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 />
                                Delete folder
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
