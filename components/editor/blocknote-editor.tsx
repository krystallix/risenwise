"use client"

import { useEffect, useMemo, useState } from "react"
import { BlockNoteEditor } from "@blocknote/core"
import { BlockNoteView } from "@blocknote/mantine"
import {
    SuggestionMenuController,
    getDefaultReactSlashMenuItems,
    DefaultReactSuggestionItem
} from "@blocknote/react"
import "@blocknote/mantine/style.css"
import { useTheme } from "next-themes"
import { Database } from "lucide-react"
import { customSchema } from "./advanced-table"

interface BlockNoteEditorProps {
    initialContent?: any
    onChange?: (content: any) => void
    editable?: boolean
}

export function BlockNoteEditorComponent({
    initialContent,
    onChange,
    editable = true
}: BlockNoteEditorProps) {
    const { theme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const editor = useMemo(() => {
        if (!mounted) return null

        const content = (initialContent && initialContent.length > 0)
            ? initialContent
            : undefined

        return BlockNoteEditor.create({
            schema: customSchema,
            initialContent: content,
        })
    }, [mounted])

    const customSlashMenuItems = useMemo(() => {
        if (!editor) return []

        const defaultItems = getDefaultReactSlashMenuItems(editor)

        const databaseTableItem: DefaultReactSuggestionItem = {
            title: "Database Table",
            onItemClick: () => {
                editor.insertBlocks(
                    [
                        {
                            type: "databaseTable",
                            props: {
                                columns: JSON.stringify([
                                    {
                                        id: `col_${Date.now()}`,
                                        name: "Column 1",
                                        type: "text",
                                    },
                                ]),
                                rows: JSON.stringify([
                                    {
                                        id: `row_${Date.now()}`,
                                        cells: {},
                                    },
                                ]),
                            },
                        } as any,
                    ],
                    editor.getTextCursorPosition().block,
                    "after"
                )
            },
            aliases: ["table", "database", "db", "data"],
            group: "Database",
            icon: <Database size={18} />,
            subtext: "Insert a customizable database table",
        }

        return [...defaultItems, databaseTableItem]
    }, [editor])

    if (!editor || !mounted) {
        return (
            <div className="w-full h-96 bg-muted/50 rounded-lg animate-pulse" />
        )
    }

    return (
        <div className="w-full">
            <BlockNoteView
                className="custom-editor"
                editor={editor}
                editable={editable}
                theme={theme === "dark" ? "dark" : "light"}
                slashMenu={false}
                onChange={() => {
                    if (onChange) {
                        onChange(editor.document)
                    }
                }}
            >
                <SuggestionMenuController
                    triggerCharacter={"/"}
                    getItems={async (query) =>
                        customSlashMenuItems.filter((item) =>
                            item.title.toLowerCase().includes(query.toLowerCase()) ||
                            item.aliases?.some((alias) =>
                                alias.toLowerCase().includes(query.toLowerCase())
                            )
                        )
                    }
                />
            </BlockNoteView>
        </div>
    )
}

