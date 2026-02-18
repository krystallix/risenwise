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
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    className="text-2xl h-12 w-12 p-2 rounded-full bg-accent hover:bg-accent/80 cursor-pointer"
                >
                    {value}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
            </PopoverContent>
        </Popover>
    )
}
