import * as React from "react"
import {
  Blocks,
  BookOpen,
  Calendar,
  LoaderCircle,
  Settings2, ThumbsUp,
  UserIcon,
} from "lucide-react"

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
import {
  useEffect,
  useState
} from "react";
import {
  profile,
  User
} from "@/services/user-service.ts";
import {Link} from "react-router";
import {
  NavItem,
  NavMain
} from "@/components/layout/nav-main.tsx";
import {NavUser} from "@/components/layout/nav-user.tsx";


const navItems: NavItem[] = [
  {
    title: "Usuarios",
    url: "/users",
    icon: UserIcon,
    isActive: true,
  },
  {
    title: "Tips",
    url: "/tips",
    icon: BookOpen,
  },
  {
    title: "Foros",
    url: "/forum",
    icon: ThumbsUp,
  },
  {
    title: "Contenido didáctico",
    url: "/didactic-content",
    icon: Blocks,
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
    title: "Configuración",
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
    profile().then(setUser).catch(() => setUser(null));
  }, [setUser]);


  return (
    <Sidebar collapsible="icon" {...props}>
      <SonaSideBarHeader/>
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
        <Link to="/">
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
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarHeader>
}
