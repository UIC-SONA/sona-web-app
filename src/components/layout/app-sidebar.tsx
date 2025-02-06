import * as React from "react"
import {
  Blocks,
  BookOpen,
  Calendar,
  LoaderCircle,
  ThumbsUp,
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
import {Link} from "react-router";
import {
  NavItem,
  NavMain
} from "@/components/layout/nav-main.tsx";
import {NavUser} from "@/components/layout/nav-user.tsx";
import {useAuth} from "@/context/auth-context.tsx";
import {
  Authority,
  User,
  userService
} from "@/services/user-service.ts";


export function AppSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
  
  const {user} = useAuth();
  
  
  const navItems = resolvedNavItems(user);
  
  return (
    <Sidebar collapsible="icon" {...props}>
      <SonaSideBarHeader/>
      <SidebarContent>
        <NavMain items={navItems}/>
      </SidebarContent>
      <Separator/>
      <SidebarFooter>
        {user ? <NavUser user={user}/> : <LoaderCircle className="w-8 h-8 animate-spin"/>}
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
              <span className="truncate text-xs">Bienvenido a <b>SONA</b></span>
            </div>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarHeader>
}

function resolvedNavItems(user?: User): NavItem[] {
  if (!user) {
    return [];
  }
  
  const items: NavItem[] = [];
  
  if (userService.hasUser(user, Authority.ADMIN, Authority.ADMINISTRATIVE)) {
    items.push({
        title: "Usuarios",
        url: "/users",
        icon: UserIcon,
      }, {
        title: "Tips",
        url: "/tips",
        icon: BookOpen,
      }, {
        title: "Posts",
        url: "/posts",
        icon: ThumbsUp,
      }, {
        title: "Contenido didáctico",
        url: "/didactic-content",
        icon: Blocks,
      },
      {
        title: "Profesionales",
        url: "#",
        icon: UserIcon,
        items: [
          {
            title: "Gestion",
            url: "/professionals",
          },
          {
            title: "Horarios de atención",
            url: "/professional-schedules",
          },
        ],
      },
    );
  }
  
  if (userService.hasUser(user, Authority.LEGAL_PROFESSIONAL, Authority.MEDICAL_PROFESSIONAL, Authority.ADMIN, Authority.ADMINISTRATIVE)) {
    items.push({
        title: "Ver Agenda",
        url: "#",
        icon: Calendar,
        items: [
          {
            title: "Gestion",
            url: "/appointments",
          },
          {
            title: "Calendario",
            url: "/appointments-calendar",
          }
        ],
      },
    );
  }
  
  return items;
}
