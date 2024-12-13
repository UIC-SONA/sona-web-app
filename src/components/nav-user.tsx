"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown, Loader2,
  LogOut,
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
  profilePicture,
  User,
  UserRepresentation
} from "@/services/user-service.ts";
import {useEffect, useState} from "react";
import {useAuth} from "@/hooks/use-auth.ts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";


export interface NavUserProps {
  user: User
}

export function NavUser({user}: Readonly<NavUserProps>) {
  const {isMobile} = useSidebar()
  const {logoutUser} = useAuth()
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const representation = user.representation;

  useEffect(() => {
    profilePicture()
      .then(setProfileImage)
      .catch(() => setProfileImage(null))
  }, [user.id])

  const logoutHandler = async () => {
    try {
      setLogoutLoading(true)
      await logoutUser()
    } catch (e) {
      console.error(e)
    } finally {
      setLogoutLoading(false)
    }
  }

  return (
    <>
      <AlertDialog open={logoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Seguro que deseas cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Si cierras sesión, tendrás que volver a iniciar sesión para acceder a tu cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLogoutDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={logoutHandler}>
              {logoutLoading && <Loader2 className="animate-spin"/>}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <SidebarMenu>
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
              <DropdownMenuItem onClick={() => setLogoutDialogOpen(true)}>
                <LogOut/>
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

    </>
  );
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