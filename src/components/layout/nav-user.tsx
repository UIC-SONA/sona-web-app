"use client"

import {BadgeCheck, Bell, ChevronsUpDown, LogOut,} from "lucide-react"

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
import {profilePicture, User, UserRepresentation} from "@/services/user-service.ts";
import {useEffect, useState} from "react";
import {useAuth} from "@/hooks/use-auth.ts";
import {useAlertDialog} from "@/hooks/use-alert-dialog.ts";
import {DialogType} from "@/context/dialog-context.tsx";


export interface NavUserProps {
  user: User
}

export function NavUser({user}: Readonly<NavUserProps>) {
  const {isMobile} = useSidebar()
  const {logoutUser} = useAuth();
  const {pushAlertDialog} = useAlertDialog();
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const representation = user.representation;

  useEffect(() => {
    profilePicture()
      .then(setProfileImage)
      .catch(() => setProfileImage(null))
  }, [user.id])

  const logoutHandler = async () => {
    pushAlertDialog({
      type: DialogType.QUESTION,
      title: "¿Seguro que deseas cerrar sesión?",
      description: "Si cierras sesión, tendrás que volver a iniciar sesión para acceder a tu cuenta.",
      onConfirm: async () => {
        await logoutUser()
      }
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
            <ProfileInfo profilePicture={profileImage} representation={representation}/>
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
              <ProfileInfo profilePicture={profileImage} representation={representation}/>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator/>
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <BadgeCheck/>
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bell/>
              Notificaciones
            </DropdownMenuItem>
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

interface ProfileInfoProps {
  profilePicture: string | null
  representation: UserRepresentation
}

function ProfileInfo({profilePicture, representation}: Readonly<ProfileInfoProps>) {
  return <>
    <Avatar className="h-8 w-8 rounded-lg">
      <AvatarImage src={profilePicture ?? ''} alt={representation.firstName}/>
      <AvatarFallback className="rounded-lg">CN</AvatarFallback>
    </Avatar>
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-semibold">{representation.firstName}</span>
      <span className="truncate text-xs">{representation.email}</span>
    </div>
  </>
}