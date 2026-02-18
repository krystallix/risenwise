"use client"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Image from "next/image"

export function NavUser() {

  return (
    <SidebarMenu>
      <SidebarMenuItem className="pb-2">
        <a href="#">
          <div className="flex gap-2 items-end">
            <Image src="/logo.svg" alt="Logo" width={24} height={24} />
            <span className="text-base font-bold">
              risenwise
            </span>
          </div>
        </a>
      </SidebarMenuItem>
    </SidebarMenu >
  )
}
