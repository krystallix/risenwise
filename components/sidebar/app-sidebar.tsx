"use client"

import * as React from "react"
import { NavMain } from "@/components/sidebar/nav-main"
import { NavSecondary } from "@/components/sidebar/nav-secondary"
import { NavWorkspaces } from "@/components/sidebar/nav-workspaces"
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Terminal, AudioLines, Inbox, Calendar, Trash2, Blocks, Settings2, MessageCircleQuestion, Search, Sparkles, Home } from "lucide-react"

const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: <Terminal />,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: <AudioLines />,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: <Terminal />,
      plan: "Free",
    },
  ],
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
      url: "#",
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
        <TeamSwitcher teams={data.teams} />
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
