"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="size-8 opacity-0">
                <Sun />
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                    {resolvedTheme === "dark" ? (
                        <Moon className="size-4" />
                    ) : (
                        <Sun className="size-4" />
                    )}
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                    <DropdownMenuRadioItem value="light">
                        <Sun className="mr-2 size-4" />
                        Light
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">
                        <Moon className="mr-2 size-4" />
                        Dark
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">
                        <Monitor className="mr-2 size-4" />
                        System
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
