"use client"

import * as React from "react"
import { NavMain } from "@/components/sidebar/nav-main"
import { NavSecondary } from "@/components/sidebar/nav-secondary"
import { NavWorkspaces } from "@/components/sidebar/nav-workspaces"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Inbox, Calendar, Trash2, Blocks, Settings2, MessageCircleQuestion, Search, Sparkles, Home } from "lucide-react"

const data = {
  navMain: [
    {
      title: "Search",
      url: "#",
      icon: <Search />,
    },
    {
      title: "Ask AI",
      url: "#",
      icon: <Sparkles />,
    },
    {
      title: "Home",
      url: "#",
      icon: <Home />,
    },
    {
      title: "Inbox",
      url: "#",
      icon: <Inbox />,
      badge: "10",
    },
  ],
  navSecondary: [
    {
      title: "Calendar",
      url: "#",
      icon: <Calendar />,
    },
    {
      title: "Settings",
      url: "#",
      icon: <Settings2 />,
    },
    {
      title: "Templates",
      url: "#",
      icon: <Blocks />,
    },
    {
      title: "Trash",
      url: "/dashboard/trash",
      icon: <Trash2 />,
    },
    {
      title: "Help",
      url: "#",
      icon: <MessageCircleQuestion />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <NavUser />
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavWorkspaces />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
