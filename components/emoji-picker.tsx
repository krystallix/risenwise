"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState } from "react"
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react'

interface EmojiPickerComponentProps {
    value: string
    onChange: (emoji: string) => void
}

export function EmojiPickerComponent({ value, onChange }: EmojiPickerComponentProps) {
    const [open, setOpen] = useState(false)

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        onChange(emojiData.emoji)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                    {value}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-full p-0 border-0"
                align="start"
                side="right"
                sideOffset={5}
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div className="overflow-hidden rounded-lg">
                    <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        theme={Theme.AUTO}
                        searchPlaceHolder="Search emoji..."
                        width={350}
                        height={400}
                        previewConfig={{
                            showPreview: false
                        }}
                        skinTonesDisabled
                    />
                </div>
            </PopoverContent>
        </Popover>
    )
}
