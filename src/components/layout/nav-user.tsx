import {
  ChevronsUpDown,
  LogOut,
  MessageSquare,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  User,
  userService
} from "@/services/user-service.ts";
import {useAlertDialog} from "@/context/alert-dialog-context.tsx";
import {useAuth} from "@/context/auth-context.tsx";
import {Link} from "react-router";


export interface NavUserProps {
  user: User
}

export function NavUser({user}: Readonly<NavUserProps>) {
  const {isMobile} = useSidebar()
  const {logoutUser} = useAuth();
  const {pushAlertDialog} = useAlertDialog();
  
  
  const logoutHandler = async () => {
    pushAlertDialog({
      type: "question",
      title: "¿Seguro que deseas cerrar sesión?",
      description: "Si cierras sesión, tendrás que volver a iniciar sesión para acceder a tu cuenta.",
      onConfirm: logoutUser
    })
  }
  
  return <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <ProfileInfo user={user}/>
            <ChevronsUpDown className="ml-auto size-4"/>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={4}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <ProfileInfo user={user}/>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator/>
          <DropdownMenuGroup>
            <Link to="/chat">
              <DropdownMenuItem>
                <MessageSquare/>
                Mensajes
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator/>
          <DropdownMenuItem onClick={logoutHandler}>
            <LogOut/>
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>;
}


function ProfileInfo({user}: Readonly<NavUserProps>) {
  return <>
    <Avatar className="h-8 w-8 rounded-lg">
      <AvatarImage src={user.hasProfilePicture ? userService.profilePicturePath(user.id) : undefined}/>
      <AvatarFallback className="rounded-lg">
        {user.firstName[0]}
      </AvatarFallback>
    </Avatar>
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-semibold">{user.firstName}</span>
      <span className="truncate text-xs">{user.email}</span>
    </div>
  </>
}