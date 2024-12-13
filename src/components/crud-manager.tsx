import {
  CrudOperations,
  Deletable,
  Entity,
  isDeletable,
  isUpdatable,
  Page, PageQuery,
  Updatable
} from "@/lib/crud.ts";
import {
  Dispatch, SetStateAction,
  useEffect,
  useState
} from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {Button} from "@/components/ui/button.tsx";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDownIcon,
  EditIcon,
  EllipsisVerticalIcon, EyeIcon,
  Loader2, PlusIcon,
  SearchIcon,
  TrashIcon,
} from "lucide-react";
import {
  Input,
} from "@/components/ui/input.tsx";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";


export interface CrudManagerProps<TData extends Entity<ID>, Dto, ID> {
  title: string;
  operations: CrudOperations<TData, Dto, ID>;
  columns: ColumnDef<TData>[];
}

export default function CrudManager<TData extends Entity<ID>, Dto, ID>(
  {
    title,
    operations,
    columns
  }: Readonly<CrudManagerProps<TData, Dto, ID>>) {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-4 p-5 bg-primary bg-opacity-50 rounded-[1rem] text-primary-foreground border">
        {title}
      </h1>
      <CrudTable columns={columns} operations={operations}/>
    </div>
  )
}

interface DataTableProps<TData extends Entity<ID>, Dto, ID, TValue> {
  columns: ColumnDef<TData, TValue>[]
  operations: CrudOperations<TData, Dto, ID>,
}

const perPage = [5, 10, 25, 50, 100];

export function CrudTable<TData extends Entity<ID>, Dto, ID, TValue>(
  {
    columns,
    operations
  }: Readonly<DataTableProps<TData, Dto, ID, TValue>>
) {

  const [pageQuery, setPageQuery] = useState<PageQuery>({page: 0, size: perPage[0], search: ""});
  const [debouncedSearch, setDebouncedSearch] = useState(pageQuery.search);
  const [data, setData] = useState<Page<TData>>({
    content: [],
    page: {totalElements: 0, size: 0, totalPages: 0, number: 0},
  });
  const [loadingNextPagination, setLoadingNextPagination] = useState(false);
  const [loadingBackPagination, setLoadingBackPagination] = useState(false);

  const table = useReactTable({
    data: data?.content || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    operations
      .page(pageQuery)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoadingPage(false));
  }, [pageQuery, operations]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setPageQuery((prev) => ({...prev, search: debouncedSearch, page: 0}));
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [debouncedSearch]);

  const nextPage = () => {
    setLoadingNextPagination(true);
    setPageQuery((prev) => ({...prev, page: prev.page + 1}));
  };

  const previousPage = () => {
    setLoadingBackPagination(true);
    setPageQuery((prev) => ({...prev, page: prev.page - 1}));
  };

  const setLoadingPage = (loading: boolean) => {
    setLoadingNextPagination(loading);
    setLoadingBackPagination(loading);
  };

  const loadingPagination = loadingNextPagination || loadingBackPagination;

  return (
    <div>
      <div className="flex items-center px-2 py-1.5 mb-4">
        <div className="w-full">
          <div className="relative">
            <Input
              placeholder="Buscar"
              onChange={(e) => setDebouncedSearch(e.target.value)}
              className="pl-10"
            />
            <SearchIcon className="absolute top-1/2 left-3 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
          </div>
        </div>
        <DropdownPerPage
          queryPage={pageQuery}
          setPageQuery={setPageQuery}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-4">
              <EyeIcon/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(value)}
                  >
                    {typeof column.columnDef.header === "string"
                      ? column.columnDef.header
                      : ""
                    }
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        <CreateButton/>
      </div>
      <div className="border">
        <Table>
          <TableHeader className="bg-primary bg-opacity-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(({column, id, getContext, isPlaceholder}) => {
                  const columnDef = column.columnDef;
                  return (
                    <TableHead key={id} className="font-bold text-primary-foreground ">
                      {isPlaceholder ? null : flexRender(columnDef.header, getContext())}
                    </TableHead>
                  )
                })}
                {(isUpdatable(operations) || isDeletable(operations)) && <TableHead/>}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                return <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                  <CrudUpdateDeleteActions
                    operations={operations}
                    data={row.original}
                    reload={() => {
                      setPageQuery((prev) => ({...prev}));
                    }}
                  />
                </TableRow>
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={previousPage}
          disabled={data.page.number === 0 || loadingPagination}
        >
          {loadingBackPagination
            ? <Loader2 className="animate-spin"/>
            : <ChevronLeft/>
          }
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={data.page.number === data.page.totalPages - 1 || loadingPagination}
        >
          {loadingNextPagination
            ? <Loader2 className="animate-spin"/>
            : <ChevronRight/>
          }
        </Button>
      </div>
    </div>
  )
}

interface CrudActionsProps<TData extends Entity<ID>, Dto, ID> {
  data: TData,
  operations: Deletable<ID> & Updatable<TData, Dto, ID>,
  reload: () => void
}

export function CrudUpdateDeleteActions<TData extends Entity<ID>, Dto, ID>(
  {
    operations,
    data,
    reload
  }: Readonly<CrudActionsProps<TData, Dto, ID>>
) {

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);


  return <>
    <ConfirmDeleteAlertDialog
      operations={operations}
      data={data}
      open={deleteDialogOpen}
      setOpen={setDeleteDialogOpen}
      reload={reload}
    />
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <TableCell className="text-right">
          <EllipsisVerticalIcon/>
        </TableCell>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator/>
        <DropdownMenuItem>
          <EditIcon/>
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setDeleteDialogOpen(true)}
        >
          <TrashIcon/>
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </>
}


interface COnfirmDeleteAlertDialogProps<TData extends Entity<ID>, ID> {
  data: TData,
  operations: Deletable<ID>,
  open: boolean,
  setOpen: (open: boolean) => void,
  reload: () => void
}

export function ConfirmDeleteAlertDialog<TData extends Entity<ID>, ID>(
  {
    operations,
    data,
    open,
    setOpen,
    reload
  }: Readonly<COnfirmDeleteAlertDialogProps<TData, ID>>
) {

  const [deleteLoading, setDeleteLoading] = useState(false);
  const deleteHandler = async () => {
    setDeleteLoading(true);
    try {
      await operations.delete(data.id);
      setOpen(false);
      reload();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteLoading(false);
    }
  }

  return <AlertDialog open={open}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>¿Seguro que deseal eliminar este registro?</AlertDialogTitle>
        <AlertDialogDescription>
          Esta acción no se puede deshacer.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={() => setOpen(false)}>
          Cancelar
        </AlertDialogCancel>
        <AlertDialogAction onClick={deleteHandler}>
          {deleteLoading && <Loader2 className="animate-spin"/>}
          Confirmar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
}


interface DropdownPerPageProps {
  queryPage: PageQuery,
  setPageQuery: Dispatch<SetStateAction<PageQuery>>,
}

export function DropdownPerPage(
  {
    queryPage,
    setPageQuery
  }: Readonly<DropdownPerPageProps>
) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-4">
          Por página {queryPage.size}
          <ChevronsUpDownIcon/>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {perPage.map((size) => (
          <DropdownMenuItem
            key={size}
            onClick={() => setPageQuery((prev) => ({...prev, size}))}
          >
            {size}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function CreateButton() {
  return (
    <Button className="ml-4">
      <PlusIcon/>
    </Button>
  )
}