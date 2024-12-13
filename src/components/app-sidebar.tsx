import * as React from "react"
import {
  BookOpen,
  Calendar,
  LoaderCircle,
  Settings2,
  UserIcon,
} from "lucide-react"

import {NavItem, NavMain} from "@/components/nav-main"
import {NavUser} from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import onlyLogo from "@/assets/only_logo.png";
import {Separator} from "@/components/ui/separator.tsx";
import {useEffect, useState} from "react";
import {profile, User} from "@/services/user-service.ts";


const navItems: NavItem[] = [
  {
    title: "Usuarios",
    url: "#",
    icon: UserIcon,
    isActive: true,
    items: [
      {
        title: "Administrar",
        url: "/users",
      },
    ],
  },
  {
    title: "Tips",
    url: "#",
    icon: BookOpen,
    items: [
      {
        title: "Administrar",
        url: "#",
      },
    ],
  },
  {
    title: "Citas",
    url: "#",
    icon: Calendar,
    items: [
      {
        title: "Medicas",
        url: "#",
      },
      {
        title: "Juridicas",
        url: "#",
      }
    ],
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings2,
    items: [
      {
        title: "General",
        url: "#",
      },
    ],
  },
];


export function AppSidebar({...props}: React.ComponentProps<typeof Sidebar>) {

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    profile().then((data) => {
        setUser(data);
      }
    )
  }, [setUser]);


  return (
    <Sidebar collapsible="icon" {...props}>
      <SonaSideBarHeader/>
      <Separator/>
      <SidebarContent>
        <NavMain items={navItems}/>
      </SidebarContent>
      <Separator/>
      <SidebarFooter>
        {user ? <NavUser user={user}/> : <LoaderCircle/>}
      </SidebarFooter>
      <SidebarRail/>
    </Sidebar>
  )
}

export function SonaSideBarHeader() {
  return <SidebarHeader>
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
            <img src={onlyLogo} alt="Logo"/>
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">
              SONA
            </span>
            <span className="truncate text-xs">Bienvenido usuario</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarHeader>
}
