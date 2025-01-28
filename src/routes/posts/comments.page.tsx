import BreadcrumbSubLayout from "@/layout/breadcrumb-sub-layout.tsx";
import CrudTable, {TableFactory} from "@/components/crud/crud-table.tsx";
import {
  Comment,
  postService
} from "@/services/post-service.ts";
import {
  ClickToShowID,
  ClickToShowText
} from "@/components/utils-componentes.tsx";
import {useAuth} from "@/context/auth-context.tsx";
import {format} from "date-fns";
import {Link, useParams} from "react-router";
import {Button} from "@/components/ui/button.tsx";
import {ChevronLeft} from "lucide-react";


export default function CommentsPage() {
  const {authenticated} = useAuth();
  const {postId} = useParams();
  if (!authenticated || !postId) return null;

  const table: TableFactory<Comment, string> = {
    columns: [
      {
        header: "Id",
        accessorKey: "id",
        enableSorting: true,
        cell: ({row}) => {
          return <ClickToShowID id={row.original.id}/>
        }
      },
      {
        header: "Contenido",
        accessorKey: "content",
        enableSorting: true,
        cell: ({row}) => {
          return <ClickToShowText
            title="Contenido del comentario"
            text={row.original.content}
            length={100}
          />
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
    <BreadcrumbSubLayout items={["Publicaciones", "Comentarios"]}>
      <CrudTable<Comment, any, string>
        title={<div className="flex items-center space-x-2 mb-4">
          <BackButton/>
          <h2 className="text-2xl font-bold">Comentarios</h2>
        </div>}
        operations={{
          page: (query) => postService.pageComments(postId, query),
          delete: (id) => postService.deleteComment(postId, id),
        }}
        table={table}
      />
    </BreadcrumbSubLayout>
  );
}

function BackButton() {
  return (
    <Link to="/posts">
      <Button variant="outline" size="icon">
        <ChevronLeft/>
      </Button>
    </Link>
  );
}