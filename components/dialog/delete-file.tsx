"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useWorkspace } from "@/hooks/use-workspace"
import { Loader2 } from "lucide-react"
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
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete document?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete <strong>{fileName}</strong>? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        disabled={isLoading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            "Delete document"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
