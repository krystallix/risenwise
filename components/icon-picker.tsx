"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList } from "@/components/ui/command"
import { useState, useMemo } from "react"
import { icons, Check, LucideIcon } from 'lucide-react'

interface IconPickerProps {
    value: string
    onChange: (icon: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
    const [open, setOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    const iconList = useMemo(() => {
        return Object.entries(icons)
            .filter(([name]) => {
                const searchLower = searchTerm.toLowerCase()
                return name.toLowerCase().includes(searchLower)
            })
            .slice(0, 49)
    }, [searchTerm])

    const SelectedIconComponent = (icons as any)[value] as LucideIcon

    return (
        <Popover open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                    {SelectedIconComponent && <SelectedIconComponent className="size-4 mr-2" />}
                    <span>{value}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-80 p-0"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search icon..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                    />
                    <CommandList className="max-h-[150px] overflow-y-auto">
                        {iconList.length > 0 ? (
                            <CommandGroup>
                                <div className="grid grid-cols-7 gap-1 p-2">
                                    {iconList.map(([iconName, Icon]) => {
                                        const IconComponent = Icon as LucideIcon
                                        return (
                                            <button
                                                key={iconName}
                                                onClick={() => {
                                                    onChange(iconName)
                                                    setOpen(false)
                                                    setSearchTerm("")
                                                }}
                                                className={`
                                                    flex items-center justify-center p-2 rounded-md
                                                    hover:bg-accent transition-colors relative
                                                    ${value === iconName ? 'bg-accent ring-2 ring-primary' : ''}
                                                `}
                                                title={iconName}
                                            >
                                                <IconComponent className="size-4" />
                                                {value === iconName && (
                                                    <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                                                        <Check className="size-2 text-primary-foreground" />
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </CommandGroup>
                        ) : (
                            <CommandEmpty>No icon found</CommandEmpty>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
