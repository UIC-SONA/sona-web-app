import {SidebarTrigger} from "@/components/ui/sidebar.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {ThemeToggle} from "@/components/theme-toggle.tsx";
import {Fragment, PropsWithChildren} from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";
import {Link} from "react-router";


export interface BradcrumSubLayoutProps extends PropsWithChildren {
  items: string[];
}

export default function BreadcrumbSubLayout({children, items}: Readonly<BradcrumSubLayoutProps>) {
  return <>
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1"/>
        <Separator orientation="vertical" className="mr-2 h-4"/>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <Link to="/">
                Inicio
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block"/>
            {items.map((item, index) => {
              return <Fragment key={index + item}>
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {item}
                  </BreadcrumbPage>
                </BreadcrumbItem>
                {index < items.length - 1 && <BreadcrumbSeparator/>}
              </Fragment>
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
    <main className="p-4 flex-1 mb-[4rem]">
      <div className="absolute top-4 right-4">
        <ThemeToggle/>
      </div>
      {children}
    </main>
  </>
}