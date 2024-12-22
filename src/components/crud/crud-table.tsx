import {
  CrudOperations,
  defaultPageQuery,
  emptyPage,
  Entity,
  Page,
  PageQuery,
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
import {
  extractError,
} from "@/lib/errors.ts";
import {useIsFirstRender} from "@/hooks/use-is-first-rendered.ts";
import {CreateForm, DeleteForm, FormDef, UpdateForm} from "@/components/crud/crud-forms.tsx";

const perPage = [5, 10, 25, 50, 100];


export type CrudTableProps<TData extends Entity<ID>, Dto, ID> = {
  title: string;
  operations: Partial<CrudOperations<TData, Dto, ID>>;
  columns: ColumnDef<TData>[];
  form?: FormDef<TData, Dto, ID>;
}

export default function CrudTable<TData extends Entity<ID>, Dto, ID>({title, columns, operations, form}: Readonly<CrudTableProps<TData, Dto, ID>>) {
  return <CrudOperationsTable
    title={title}
    columns={columns}
    form={form}
    {...operations}
  />
}

interface CrudOperationsTableProp<TData extends Entity<ID>, Dto, ID> extends Partial<CrudOperations<TData, Dto, ID>> {
  title: string;
  columns: ColumnDef<TData>[];
  form?: FormDef<TData, Dto, ID>;
}

function CrudOperationsTable<TData extends Entity<ID>, Dto, ID>(
  {
    title,
    columns,
    form,
    page,
    delete: delete0,
    create,
    update
  }: Readonly<CrudOperationsTableProp<TData, Dto, ID>>) {

  if (form && !(create || update)) {
    throw new Error("form configuration is only allowed when operations is Creatable or Updatable");
  }

  const [pageQuery, setPageQuery] = useState<PageQuery>(defaultPageQuery(perPage[0]));
  const [search, setSearch] = useState(pageQuery.search);
  const [pageData, setPageData] = useState<Page<TData>>(emptyPage);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingNextPagination, setLoadingNextPagination] = useState(false);
  const [loadingBackPagination, setLoadingBackPagination] = useState(false);
  const [loadingPageSize, setLoadingPageSize] = useState(false);


  const {pushAlertDialog} = useAlertDialog();
  const isFirstRender = useIsFirstRender();
  const table = useReactTable<TData>({
    data: pageData.content || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const loadData = useCallback((pageQuery: PageQuery) => {
    page?.(pageQuery).then((page) => {
      setPageData(page);
      setLoadings(false);
    }).catch((error) => {
      const err = extractError(error);
      pushAlertDialog({
        type: DialogType.ERROR,
        title: err.title,
        description: err.description,
      });
    });
  }, [page, pushAlertDialog]);

  useEffect(() => {
    loadData(pageQuery);
  }, [loadData, pageQuery]);


  useEffect(() => {
    if (isFirstRender) return;
    const handler = setTimeout(() => {
      setLoadingSearch(true);
      setPageQuery((prev) => ({...prev, search, page: 0}));
    }, 500);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
    setLoadingPageSize(loading);
  }

  const setPageSize = (size: number) => {
    setLoadingPageSize(true);
    setPageQuery((prev) => ({...prev, size}));
  }

  const loading = loadingNextPagination || loadingBackPagination || loadingSearch || loadingPageSize;
  const useFormInTable = (update != undefined || delete0 != undefined);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <div className="grid gap-4 mb-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 items-center">
        <IntelliSearch
          value={search}
          onSearch={setSearch}
          loading={loadingSearch}
          className="col-span-1 sm:col-span-2 lg:col-span-4"
        />
        <div className="col-span-1 sm:col-span-2 lg:col-span-2 flex items-center justify-end space-x-2">
          <DropdownPerPage
            pageSize={pageQuery.size}
            onPageSizeChange={setPageSize}
            loading={loadingPageSize}
          />
          <DropdownVisibleColumns
            table={table}
          />
          {form && create && <CreateAction
              form={form}
              create={create}
              reload={() => setPageQuery((prev) => ({...prev}))}
          />}
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <TableComponent>
          <CrudTableHeader
            table={table}
            aditionalHead={useFormInTable}
          />
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

                  {useFormInTable && <EntityActions
                      entity={row.original}
                      form={form}
                      reload={() => setPageQuery((prev) => ({...prev}))}
                      delete={delete0}
                      update={update}
                  />}
                </TableRow>
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {isFirstRender ? (
                    <div className="flex items-center justify-center space-x-2 flex-col">
                      <Loader2 className="animate-spin"/>
                      Cargando...
                    </div>
                  ) : (
                    "No hay registros"
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </TableComponent>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        {pageData.page.totalPages > 0 &&
            <>
                <span className="text-sm text-muted-foreground">
                    Página {pageData.page.number + 1} de {pageData.page.totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={previousPage}
                    disabled={pageData.page.number === 0 || loading}
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
                    disabled={pageData.page.number === pageData.page.totalPages - 1 || loading}
                >
                  {loadingNextPagination
                    ? <Loader2 className="animate-spin"/>
                    : <ChevronRight/>
                  }
                </Button>
            </>}
      </div>
    </div>);
}

interface CrudTableHeaderProps<TData extends Entity<ID>, ID> {
  table: Table<TData>,
  aditionalHead: boolean,
}

function CrudTableHeader<TData extends Entity<ID>, ID>({table, aditionalHead}: Readonly<CrudTableHeaderProps<TData, ID>>) {
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
        {aditionalHead && <TableHead/>}
      </TableRow>
    ))}
  </TableHeader>
}


interface IntelliSearchProps {
  value?: string,
  onSearch: (value: string) => void,
  loading: boolean,
  className?: string,
}

function IntelliSearch({value, onSearch, loading, className}: Readonly<IntelliSearchProps>) {
  return (
    <div className={className}>
      <div className="relative">
        <Input
          value={value}
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
  pageSize: number,
  onPageSizeChange: (value: number) => void,
  loading: boolean,
  className?: string,
}

function DropdownPerPage({pageSize, onPageSizeChange, loading, className}: Readonly<DropdownPerPageProps>) {
  return <div className={className}>
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={loading}>
        <div className="flex items-center">
          <Button variant="outline" className="ml-4">
            Por página {pageSize}
            {loading ? <Loader2 className="animate-spin"/> : <ChevronsUpDownIcon/>}
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {perPage.map((size) => (
          <DropdownMenuItem
            key={size}
            onClick={() => size !== pageSize && onPageSizeChange(size)}
          >
            {size}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
}


interface DropdownVisibleColumnsProps<TData> {
  table: Table<TData>
  className?: string
}

function DropdownVisibleColumns<TData>({table, className}: Readonly<DropdownVisibleColumnsProps<TData>>) {
  return <div className={className}>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
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
  </div>
}

interface EntityActionsProps<TData extends Entity<ID>, Dto, ID> {
  entity: TData,
  form?: FormDef<TData, Dto, ID>,
  reload: () => void,
  delete?: (id: ID) => Promise<void>,
  update?: (id: ID, data: Dto) => Promise<TData>,
}

function EntityActions<TData extends Entity<ID>, Dto, ID>(
  {
    entity,
    form,
    reload,
    delete: delete_,
    update
  }: Readonly<EntityActionsProps<TData, Dto, ID>>) {

  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const canUpdate = update != undefined && form != undefined;

  const handleUpdateClick = () => {
    setDropdownOpen(false);
    setIsUpdateOpen(true)
  };

  const handleDeleteClick = () => {
    setDropdownOpen(false);
    setIsDeleteOpen(true)
  };

  return (
    <>
      {canUpdate && (
        <UpdateForm
          isOpen={isUpdateOpen}
          setIsOpen={setIsUpdateOpen}
          reload={reload}
          entity={entity}
          update={update}
          form={form}
        />
      )}
      {delete_ && (
        <DeleteForm
          isOpen={isDeleteOpen}
          setIsOpen={setIsDeleteOpen}
          reload={reload}
          entity={entity}
          delete={delete_}
        />
      )}
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <TableCell className="text-right">
            <EllipsisVerticalIcon/>
          </TableCell>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator/>
          {canUpdate && (
            <DropdownMenuItem onSelect={handleUpdateClick}>
              <EditIcon/>
              Actualizar
            </DropdownMenuItem>
          )}
          {delete_ && (
            <DropdownMenuItem onSelect={handleDeleteClick}>
              <TrashIcon/>
              Eliminar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

interface CreateActionProps<TData extends Entity<ID>, Dto, ID> {
  form: FormDef<TData, Dto, ID>,
  create: (data: Dto) => Promise<TData>,
  reload: () => void,
}

function CreateAction<TData extends Entity<ID>, Dto, ID>(
  {
    form,
    create,
    reload,
  }: Readonly<CreateActionProps<TData, Dto, ID>>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <CreateForm
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        reload={reload}
        create={create}
        form={form}
      />
      <Button onClick={() => setIsOpen(true)}>
        <PlusIcon/>
        Crear
      </Button>
    </>
  );
}
