import CrudManager from "@/components/crud-manager.tsx";
import {Authority, operationUsers, User} from "@/services/user-service.ts";
import {ColumnDef} from "@tanstack/react-table";
import {ItemsOnRounded} from "@/components/utils-componentes.tsx";

export default function UsersPage() {
  //
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
        return <ItemsOnRounded items={row.original.authorities} mapper={getRole}/>
      },
    },
  ];

  return (
    <CrudManager
      title={"Usuarios"}
      columns={columns}
      operations={operationUsers}
    />
  );
}

function getRole(authority: Authority): string {
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