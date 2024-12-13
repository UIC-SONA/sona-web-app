import CrudManager from "@/components/crud-manager.tsx";
import {Authority, operationUsers, User} from "@/services/user-service.ts";
import {ColumnDef} from "@tanstack/react-table";

export default function UsersPage() {
  const columns: ColumnDef<User>[] = [
    {
      header: "Id",
      accessorKey: "id",
      enableSorting: true,
    },
    {
      header: "Nombre de Usuario",
      accessorKey: "representation.username",
      enableSorting: false,
    },
    {
      header: "Nombre",
      accessorKey: "representation.firstName",
      enableSorting: false,
    },
    {
      header: "Apellido",
      accessorKey: "representation.lastName",
      enableSorting: false,
    },
    {
      header: "Correo",
      accessorKey: "representation.email",
      enableSorting: false,
    },
    {
      header: "Roles",
      accessorKey: "authorities",
      cell: ({row}) => {
        return <RenderRoles authorities={row.original.authorities}/>
      },
    },
  ]

  return (
    <CrudManager columns={columns} operations={operationUsers}/>
  );
}

function RenderRoles({authorities}: { authorities: Authority[] }) {
  return authorities.map((authority) => {
    return (
      <span key={authority} className="inline-block text-xs font-semibold py-1 px-2 rounded-full border mx-1">
        {getRole(authority)}
      </span>
    )
  })
}

function getRole(authority: Authority) {
  switch (authority) {
    case Authority.ADMIN:
      return "Administrador";
    case Authority.ADMINISTRATIVE:
      return "Administrativo";
    case Authority.PROFESSIONAL:
      return "Profesional";
    case Authority.MEDICAL_PROFESSIONAL:
      return "Profesional Médico";
    case Authority.LEGAL_PROFESSIONAL:
      return "Profesional Legal";
    case Authority.USER:
      return "Usuario";
  }
}