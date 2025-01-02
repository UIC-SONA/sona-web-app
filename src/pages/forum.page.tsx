import BreadcrumbSubLayout from "@/layout/breadcrumb-sub-layout.tsx";
import CrudTable from "@/components/crud/crud-table.tsx";
import {
  Forum,
  ForumDto,
  pagePosts,
  deletePost,
  findPost
} from "@/services/post-service.ts";
import {ColumnDef} from "@tanstack/react-table";
import {
  ClickToShowUUID,
  Truncate
} from "@/components/utils-componentes.tsx";
import {useAuth} from "@/context/auth-context.tsx";


const columns: ColumnDef<Forum>[] = [
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
      return new Date(row.original.createdAt).toLocaleString();
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
];

export default function ForumPage() {
  const {authenticated} = useAuth();
  if (!authenticated) return null;

  return (
    <BreadcrumbSubLayout items={["Foro"]}>
      <CrudTable<Forum, ForumDto, string>
        title={"Foro"}
        columns={columns}
        operations={{
          find: findPost,
          page: pagePosts,
          delete: deletePost,
        }}
        //form={form}
      />
    </BreadcrumbSubLayout>
  );
}