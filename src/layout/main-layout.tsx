import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar.tsx";
import {Outlet} from "react-router";
import {AppSidebar} from "@/components/layout/app-sidebar.tsx";

export default function MainLayout() {

  return <SidebarProvider>
    <AppSidebar/>
    <SidebarInset className="overflow-hidden">
      <Outlet/>
    </SidebarInset>
  </SidebarProvider>
}

