import {
  CrudOperations,
  defaultPageQuery,
  emptyPage,
  Entity,
  isDeletable,
  isUpdatable,
  Page,
  PageQuery
} from "@/lib/crud.ts";
import {
  useCallback,
  useEffect,
  useState
} from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  Table,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table as TableComponent,
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
  EllipsisVerticalIcon,
  EyeIcon,
  Loader2,
  PlusIcon,
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
import {useAlertDialog} from "@/hooks/use-alert-dialog.ts";
import {DialogType} from "@/context/dialog-context.tsx";
import {extractError} from "@/lib/errors.ts";
import {useIsFirstRender} from "@/hooks/use-is-first-rendered.ts";


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
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <CrudTable columns={columns} operations={operations}/>
    </div>
  )
}

interface DataTableProps<TData extends Entity<ID>, Dto, ID, TValue> {
  columns: ColumnDef<TData, TValue>[]
  operations: CrudOperations<TData, Dto, ID>,
}

const perPage = [5, 10, 25, 50, 100];

export function CrudTable<TData extends Entity<ID>, Dto, ID, TValue>({columns, operations}: Readonly<DataTableProps<TData, Dto, ID, TValue>>) {


  const isFirstRender = useIsFirstRender();

  const [pageQuery, setPageQuery] = useState<PageQuery>(defaultPageQuery(perPage[0]));

  const [search, setSearch] = useState(pageQuery.search);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [page, setPage] = useState<Page<TData>>(emptyPage);
  const [loadingNextPagination, setLoadingNextPagination] = useState(false);
  const [loadingBackPagination, setLoadingBackPagination] = useState(false);

  const table = useReactTable({
    data: page.content || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const {pushAlertDialog} = useAlertDialog();

  const loadData = useCallback((pageQuery: PageQuery) => {
    operations.page(pageQuery).then((page) => {
      setPage(page);
      setLoadings(false);
    }).catch((error) => {
      const err = extractError(error);
      pushAlertDialog({
        type: DialogType.ERROR,
        title: err.title,
        description: err.description,
      });
    });
  }, [operations, pushAlertDialog]);

  useEffect(() => {
    loadData(pageQuery);
  }, [loadData, pageQuery]);


  useEffect(() => {
    if (isFirstRender) return;
    const handler = setTimeout(() => {
      setLoadingSearch(true);
      setPageQuery((prev) => ({...prev, search: search, page: 0}));
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [isFirstRender, search]);

  const nextPage = () => {
    setLoadingNextPagination(true);
    setPageQuery((prev) => ({...prev, page: prev.page + 1}));
  };

  const previousPage = () => {
    setLoadingBackPagination(true);
    setPageQuery((prev) => ({...prev, page: prev.page - 1}));
  };

  const setLoadings = (loading: boolean) => {
    setLoadingNextPagination(loading);
    setLoadingBackPagination(loading);
    setLoadingSearch(loading);
  }

  const deleteHandler = async (data: TData) => {
    pushAlertDialog({
      type: DialogType.QUESTION,
      title: "¿Seguro que deseal eliminar este registro?",
      description: "Esta acción no se puede deshacer.",
      onConfirm: async () => {
        try {
          await operations.delete(data.id);
          setPageQuery((prev) => ({...prev}));
        } catch (error) {
          const err = extractError(error);
          pushAlertDialog({
            type: DialogType.ERROR,
            title: err.title,
            description: err.description,
          });
        }
      }
    });
  };

  const loading = loadingNextPagination || loadingBackPagination || loadingSearch;

  return (
    <div>
      <div className="flex items-center px-2 py-1.5 mb-4">
        <IntelliSearch
          onSearch={setSearch}
          loading={loadingSearch}
        />
        <DropdownPerPage
          pageNumber={pageQuery.size}
          onPageNumberChange={(value) => setPageQuery((prev) => ({...prev, size: value}))}
        />
        <DropdownVisibleColumns table={table}/>
        <CreateButton/>
      </div>
      <div className="border">
        <TableComponent>
          <CrudTableHeader table={table} operations={operations}/>
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
                      <DropdownMenuItem onClick={() => deleteHandler(row.original)}>
                        <TrashIcon/>
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableRow>
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {isFirstRender ? "Cargando..." : "No hay registros"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </TableComponent>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={previousPage}
          disabled={page.page.number === 0 || loading}
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
          disabled={page.page.number === page.page.totalPages - 1 || loading}
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


interface CrudTableHeaderProps<TData extends Entity<ID>, Dto, ID> {
  table: Table<TData>,
  operations: CrudOperations<TData, Dto, ID>,
}


function CrudTableHeader<TData extends Entity<ID>, Dto, ID>({table, operations}: Readonly<CrudTableHeaderProps<TData, Dto, ID>>) {
  return <TableHeader className="bg-primary bg-opacity-50">
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
}


interface IntelliSearchProps {
  onSearch: (value: string) => void,
  loading: boolean,
}

function IntelliSearch({onSearch, loading}: Readonly<IntelliSearchProps>) {
  return (
    <div className="w-full">
      <div className="relative">
        <Input
          placeholder="Buscar"
          onChange={(e) => onSearch(e.target.value)}
          className="pl-10"
        />
        <SearchIcon className="absolute top-1/2 left-3 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
        <div className="absolute top-1/2 right-3 transform -translate-y-1/2 h-5 w-5 text-muted-foreground">
          {loading && <Loader2 className="animate-spin"/>}
        </div>
      </div>
    </div>
  )
}

interface DropdownPerPageProps {
  pageNumber: number,
  onPageNumberChange: (value: number) => void,
}

function DropdownPerPage({pageNumber, onPageNumberChange}: Readonly<DropdownPerPageProps>) {
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" className="ml-4">
        Por página {pageNumber}
        <ChevronsUpDownIcon/>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {perPage.map((size) => (
        <DropdownMenuItem
          key={size}
          onClick={() => onPageNumberChange(size)}
        >
          {size}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
}

export function DropdownVisibleColumns<TData>({table}: Readonly<{ table: Table<TData> }>) {
  return <DropdownMenu>
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
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(value)}
            >
              {typeof column.columnDef.header === "string" ? column.columnDef.header : ""}
            </DropdownMenuCheckboxItem>
          )
        })}
    </DropdownMenuContent>
  </DropdownMenu>
}

export function CreateButton() {
  return <Button className="ml-4">
    <PlusIcon/>
  </Button>
}

