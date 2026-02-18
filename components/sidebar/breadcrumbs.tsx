"use client"

import Link from "next/link"
import React from "react"
import { usePathname } from "next/navigation"
import { useItems } from "@/hooks/use-workspace"  // ← path sesuai file kamu
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
    BreadcrumbPage, BreadcrumbSeparator
} from "@/components/ui/breadcrumb"

const LABELS: Record<string, string> = {
    dashboard: "Dashboard",
    trash: "Trash",
    // folder: "Folder", // kalau ada folder slug
}

function toTitle(s: string) {
    return s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

export function UrlBreadcrumbs() {
    const pathname = usePathname()
    const { getItemNameById } = useItems()  // ← pakai hook kamu!

    const segments = pathname.split("/").filter(Boolean)
    if (segments.length === 0) return null

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {segments.map((seg, idx) => {
                    const href = "/" + segments.slice(0, idx + 1).join("/")
                    let label = LABELS[seg] ?? toTitle(seg)

                    // Magic: ganti UUID slug jadi nama item dari workspace!
                    if (/^[0-9a-f-]{36}$/i.test(seg)) {  // UUID v4 pattern
                        label = getItemNameById(seg)
                    }

                    const isLast = idx === segments.length - 1

                    return (
                        <React.Fragment key={idx}>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage className="line-clamp-1">{label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={href}>{label}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </React.Fragment>
                    )
                })}
            </BreadcrumbList>
        </Breadcrumb>
    )
}
