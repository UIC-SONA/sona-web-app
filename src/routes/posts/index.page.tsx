import BreadcrumbSubLayout from "@/layout/breadcrumb-sub-layout.tsx";
import CrudTable, {TableFactory} from "@/components/crud/crud-table.tsx";
import {
    Post,
    PostDto,
    postService
} from "@/services/post-service.ts";
import {
    ClickToShowText
} from "@/components/utils-componentes.tsx";
import {useAuth} from "@/context/auth-context.tsx";
import {format} from "date-fns";
import {useNavigate} from "react-router";
import {MessageSquareText} from "lucide-react";


export default function PostPage() {
    const {authenticated} = useAuth();
    const navigation = useNavigate();
    if (!authenticated) return null;

    const table: TableFactory<Post, string> = {
        columns: [
            {
                header: "Contenido",
                accessorKey: "content",
                enableSorting: true,
                cell: ({row}) => {
                    return <ClickToShowText
                        title="Contenido de la publicación"
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
        ],
        entityActions: (post) => {
            return [
                {
                    label: "Ver comentarios",
                    icon: MessageSquareText,
                    onClick: () => {
                        navigation(`/posts/${post.id}/comments`);
                    }
                }
            ];
        }
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