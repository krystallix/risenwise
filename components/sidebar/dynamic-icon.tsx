"use client"

import * as Icons from "lucide-react"
import type { LucideIcon, LucideProps } from "lucide-react"

type IconName = keyof typeof Icons

interface DynamicIconProps extends Omit<LucideProps, 'name'> {
    name: string | LucideIcon
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
    if (typeof name === 'string') {
        const isEmoji = /\p{Emoji}/u.test(name)

        if (isEmoji) {
            return <span className="flex items-center justify-center w-4 h-4">{name}</span>
        }

        const LucideIcon = Icons[name as IconName] as LucideIcon

        if (!LucideIcon) {
            console.warn(`Icon "${name}" tidak ditemukan di lucide-react, menggunakan icon File sebagai fallback`)
            return <Icons.File {...props} />
        }

        return <LucideIcon {...props} />
    }

    const IconComponent = name
    return <IconComponent {...props} />
}
