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
import {format} from "date-fns";


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
          return <Truncate text={row.original.content} length={100}/>
        }
      },
      {
        header: "Publicado",
        accessorKey: "createdAt",
        cell: ({row}) => {
          return <div className="flex items-center justify-center">
            {format(row.original.createdAt, "dd/MM/yyyy HH:mm")}
          </div>;
        }
      },
      {
        header: "Likes",
        accessorKey: "likedBy",
        enableSorting: true,
        cell: ({row}) => {
          return <div className="flex items-center justify-center">
            {row.original.likedBy.length}
          </div>
        },
      },
      {
        header: "Comentarios",
        accessorKey: "comments",
        enableSorting: true,
        cell: ({row}) => {
          return <div className="flex items-center justify-center">
            {row.original.comments.length}
          </div>
        },
      },
      {
        header: "Denuncias",
        accessorKey: "reportedBy",
        enableSorting: true,
        cell: ({row}) => {
          return <div className="flex items-center justify-center">
            {row.original.reportedBy.length}
          </div>
        },
      },
    ]
  }

  return (
    <BreadcrumbSubLayout items={["Publicaciones"]}>
      <CrudTable<Post, PostDto, string>
        title={"Publicaciones"}
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