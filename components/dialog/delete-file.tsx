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

interface DeleteFileDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    fileId: string
    fileName: string
}

export default function DeleteFileDialog({
    open,
    onOpenChange,
    fileId,
    fileName,
}: DeleteFileDialogProps) {
    const [isLoading, setLoading] = useState(false)
    const deleteItem = useWorkspace(state => state.deleteItem)

    const handleDelete = async () => {
        setLoading(true)

        try {
            await deleteItem(fileId)
            onOpenChange(false)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete document?</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete <strong>{fileName}</strong>? This action cannot be undone.
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
                                Delete Document
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
