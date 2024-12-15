import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar.tsx";
import {AppSidebar} from "@/components/app-sidebar.tsx";
import {Outlet} from "react-router";

export default function MainLayout() {

  return <SidebarProvider>
    <AppSidebar/>
    <SidebarInset>
      <Outlet/>
    </SidebarInset>
  </SidebarProvider>
}

