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
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete folder?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete <strong>{folderName}</strong>? This will also delete all documents inside this folder. This action cannot be undone.
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
                        className="bg-red-500 text-white hover:bg-red-600"
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
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
