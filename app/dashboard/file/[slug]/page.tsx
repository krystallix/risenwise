"use client"

import { BlockNoteEditorComponent } from "@/components/editor/blocknote-editor"
import { useState, useEffect, use } from "react"
import { Loader2, Save } from "lucide-react"
import { PartialBlock } from "@blocknote/core"
import { toast } from "sonner"
import { useWorkspace } from "@/hooks/use-workspace"
import EmojiPicker from "emoji-picker-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface FilePageProps {
    params: Promise<{
        slug: string
    }>
}

export default function FilePage(props: FilePageProps) {
    // Unwrap params Promise
    const params = use(props.params)

    const [title, setTitle] = useState("Untitled")
    const [description, setDescription] = useState("")

    const [icon, setIcon] = useState("📄")
    const [content, setContent] = useState<PartialBlock[] | undefined>(undefined)
    const [isSaving, setIsSaving] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const updateItem = useWorkspace(state => state.updateItem)
    const items = useWorkspace(state => state.items)

    // Load item data from workspace
    useEffect(() => {
        if (items.length > 0) {
            const item = items.find(i => i.id === params.slug)
            if (item) {
                setTitle(item.name)
                setIcon(item.icon)
                setDescription(item.description || "")
                // Load BlockNote content from database
                if (item.content) {
                    setContent(item.content)
                }
            }
            setIsLoading(false)
        }
    }, [params.slug, items])

    // Debounced auto-save
    useEffect(() => {
        if (!hasUnsavedChanges) return

        const timer = setTimeout(() => {
            handleAutoSave()
        }, 2000) // 2 seconds debounce

        return () => clearTimeout(timer)
    }, [title, icon, description, content, hasUnsavedChanges])

    const handleAutoSave = async () => {
        setIsSaving(true)

        try {
            // Update item in workspace - this will automatically update sidebar
            await updateItem(params.slug, {
                name: title,
                icon: icon,
                description: description,
                content: content || [] // Save BlockNote content as JSONB
            })

            setHasUnsavedChanges(false)
            // toast.success("Saved", { duration: 1000 })
        } catch (error) {
            console.error("Save error:", error)
            toast.error("Failed to save")
        } finally {
            setIsSaving(false)
        }
    }

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value)
        setHasUnsavedChanges(true)
    }

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDescription(e.target.value)
        setHasUnsavedChanges(true)
    }

    const handleEmojiSelect = (emojiData: any) => {
        setIcon(emojiData.emoji)
        setHasUnsavedChanges(true)
        setEmojiPickerOpen(false)
    }

    const handleContentChange = (newContent: PartialBlock[]) => {
        setContent(newContent)
        setHasUnsavedChanges(true)
    }

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header with emoji picker and title input */}
            <div className="flex items-center gap-3 px-6 py-4 border-b">
                <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className="text-2xl h-12 w-12 p-2 rounded-full bg-accent hover:bg-accent/80 cursor-pointer"
                        >
                            {icon}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <EmojiPicker onEmojiClick={handleEmojiSelect} />
                    </PopoverContent>
                </Popover>
                <div className="flex flex-col">
                    <input
                        value={title}
                        onChange={handleTitleChange}
                        className="text-3xl! font-bold border-none outline-none bg-transparent w-full px-0h-auto text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                        placeholder="Untitled"
                    // style={{ fontSize: '3rem', lineHeight: '1.2' }}
                    />

                    <input
                        value={description}
                        onChange={handleDescriptionChange}
                        className="text-xs! border-none outline-none bg-transparent w-full px-0 h-auto text-muted-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                        placeholder="Add description for items"
                    // style={{ fontSize: '3rem', lineHeight: '1.2' }}
                    />
                </div>



                <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
                    {isSaving && (
                        <>
                            <Loader2 className="size-4 animate-spin" />
                        </>
                    )}
                    {!isSaving && hasUnsavedChanges && (
                        <Save className="size-4" />
                    )}
                    {!isSaving && !hasUnsavedChanges && (
                        <Save className="size-4 text-lime-600" />
                    )}
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-auto px-6 py-4">
                <BlockNoteEditorComponent
                    key={params.slug} // Force re-render when file changes
                    initialContent={content}
                    onChange={handleContentChange}
                    editable={true}
                />
            </div>
        </div>
    )
}
