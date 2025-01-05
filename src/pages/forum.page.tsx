import BreadcrumbSubLayout from "@/layout/breadcrumb-sub-layout.tsx";
import CrudTable, {TableFactory} from "@/components/crud/crud-table.tsx";
import {
  Post,
  PostDto,
  postService
} from "@/services/post-service.ts";
import {
  ClickToShowUUID,
  Truncate
} from "@/components/utils-componentes.tsx";
import {useAuth} from "@/context/auth-context.tsx";


export default function ForumPage() {
  const {authenticated} = useAuth();
  if (!authenticated) return null;

  const table: TableFactory<Post, string> = {
    columns: [
      {
        header: "Id",
        accessorKey: "id",
        enableSorting: true,
        cell: ({row}) => {
          return <ClickToShowUUID id={row.original.id}/>
        }
      },
      {
        header: "Contenido",
        accessorKey: "content",
        enableSorting: true,
        cell: ({row}) => {
          return <Truncate text={row.original.content}/>
        }
      },
      {
        header: "Publicado",
        accessorKey: "createdAt",
        cell: ({row}) => {
          return row.original.createdAt.toLocaleString();
        }
      },
      {
        header: "Likes",
        accessorKey: "likedBy",
        enableSorting: true,
        cell: ({row}) => {
          return row.original.likedBy.length;
        },
      },
      {
        header: "Reportes",
        accessorKey: "reportedBy",
        enableSorting: true,
        cell: ({row}) => {
          return row.original.reportedBy.length;
        },
      },
    ]
  }

  return (
    <BreadcrumbSubLayout items={["Foro"]}>
      <CrudTable<Post, PostDto, string>
        title={"Foro"}
        operations={{
          find: postService.find,
          page: postService.page,
          delete: postService.delete,
        }}
        table={table}
      />
    </BreadcrumbSubLayout>
  );
}