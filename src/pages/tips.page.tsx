import CrudManager from "@/components/crud-manager.tsx";
import {ColumnDef} from "@tanstack/react-table";
import {operationTips, Tip, tipImage} from "@/services/tip-service.ts";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {
  ClickToShowUUID,
  ItemsOnRounded,
  OpenImageModal,
  Truncate
} from "@/components/utils-componentes.tsx";
import BreadcrumbSubLayout from "@/layout/breadcrumb-sub-layout.tsx";

export default function TipsPage() {
  const columns: ColumnDef<Tip>[] = [
    {
      header: "Id",
      accessorKey: "id",
      enableSorting: true,
      cell: ({row}) => {
        return <ClickToShowUUID id={row.original.id}/>
      }
    },
    {
      header: "Título",
      accessorKey: "title",
      enableSorting: false,
    },
    {
      header: "Resumen",
      accessorKey: "summary",
      enableSorting: false,
      cell: ({row}) => {
        return <Truncate text={row.original.summary}/>
      }
    },
    {
      header: "Descripción",
      accessorKey: "description",
      enableSorting: false,
      cell: ({row}) => {
        return <Truncate text={row.original.description}/>
      }
    },
    {
      header: "Tags",
      accessorKey: "tags",
      cell: ({row}) => {
        return <ItemsOnRounded items={row.original.tags}/>
      }
    },
    {
      header: "Imagen",
      accessorKey: "image",
      cell: ({row}) => {
        return <OpenImageModal fetcher={() => tipImage(row.original.id)} alt={row.original.title}/>
      },
    },
    {
      header: "Activo",
      accessorKey: "active",
      cell: ({row}) => {
        return <Checkbox checked={row.original.active} disabled={true}/>
      },
    },
  ];

  return (
    <BreadcrumbSubLayout items={["Tips"]}>
      <CrudManager
        title={"Tips"}
        columns={columns}
        operations={operationTips}
      />
    </BreadcrumbSubLayout>
  );
}
