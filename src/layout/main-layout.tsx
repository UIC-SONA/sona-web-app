import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar.tsx";
import {AppSidebar} from "@/components/app-sidebar.tsx";
import {Outlet} from "react-router";
import {ThemeToggle} from "@/components/theme-toggle.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {
  QueryClient,
  QueryClientProvider
} from "@tanstack/react-query";

const queryClient = new QueryClient()

export default function MainLayout() {

  return <QueryClientProvider client={queryClient}>
    <SidebarProvider>
      <AppSidebar/>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1"/>
            <Separator orientation="vertical" className="mr-2 h-4"/>
          </div>
        </header>
        <main className="p-4 flex-1 overflow-y-auto">
          <div className="absolute top-4 right-4">
            <ThemeToggle/>
          </div>
          <Outlet/>
        </main>
      </SidebarInset>
    </SidebarProvider>
  </QueryClientProvider>


}

