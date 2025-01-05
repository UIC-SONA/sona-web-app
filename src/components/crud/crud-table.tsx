import {
  CrudOperations,
  defaultPageQuery,
  emptyPage,
  Entity,
  Page,
  PageQuery,
} from "@/lib/crud.ts";
import {
  ComponentType,
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
  EyeIcon, LoaderCircle,
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
import {
  useAlertDialog
} from "@/context/alert-dialog-context.tsx";
import {
  extractError,
} from "@/lib/errors.ts";
import {useIsFirstRender} from "@/hooks/use-is-first-rendered.ts";
import {
  CreateForm,
  DeleteForm,
  FormComponentProps,
  FormConfig,
  UpdateForm
} from "@/components/crud/crud-forms.tsx";
import {CrudSchema, Schema} from "@/components/crud/crud-common.ts";
import {DefaultValues} from "react-hook-form";

const perPage = [5, 10, 25, 50, 100];

export interface FilterComponentProps<E> {
  filters: FilterState<keyof E, E>,
}

interface FilterState<K extends keyof E, E> {
  values: Partial<E>;

  set(key: K, value?: E[K]): void;

  get(key: K): E[K] | undefined;

  clear(): void;

  loading: boolean;
}

export interface FormFactory<TData extends Entity<ID>, Dto, ID> {
  update?: {
    schema: CrudSchema<Dto>,
    defaultValues: (data: TData) => DefaultValues<Schema<Dto>>,
  }
  create?: {
    schema: CrudSchema<Dto>,
    defaultValues: DefaultValues<Schema<Dto>>,
  }
  FormComponent: ComponentType<FormComponentProps<TData, Dto>>,
}

export interface TableFactory<TData extends Entity<ID>, ID, E = {}> {
  columns: ColumnDef<TData>[];
  FilterComponent?: ComponentType<FilterComponentProps<E>>;
}

export type CrudTableProps<TData extends Entity<ID>, Dto, ID, E = {}> = {
  title: string;
  operations: Partial<CrudOperations<TData, Dto, ID, E>>;
  table: TableFactory<TData, ID, E>;
  form?: FormFactory<TData, Dto, ID>;
}

export default function CrudTable<
  TData extends Entity<ID>,
  Dto,
  ID,
  E = {}
>({title, table, operations, form}: Readonly<CrudTableProps<TData, Dto, ID, E>>) {
  return <CrudOperationsTable<TData, Dto, ID, E>
    title={title}
    table={table}
    form={form}
    {...operations}
  />
}

interface CrudOperationsTableProp<
  TData extends Entity<ID>,
  Dto,
  ID,
  E = {}
> extends Partial<CrudOperations<TData, Dto, ID, E>> {
  title: string;
  table: TableFactory<TData, ID, E>;
  form?: FormFactory<TData, Dto, ID>;
}

function CrudOperationsTable<TData extends Entity<ID>, Dto, ID, E = {}>(
  {
    title,
    table: {columns, FilterComponent},
    form,
    page,
    delete: deleteFn,
    create,
    update
  }: Readonly<CrudOperationsTableProp<TData, Dto, ID, E>>) {

  const {pushAlertDialog} = useAlertDialog();
  const isFirstRender = useIsFirstRender();

  const [pageQuery, setPageQuery] = useState<PageQuery<E>>(defaultPageQuery(perPage[0]));
  const [search, setSearch] = useState(pageQuery.search);
  const [filters, setFilters] = useState<Partial<E>>({});

  const [pageData, setPageData] = useState<Page<TData>>(emptyPage);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingNextPagination, setLoadingNextPagination] = useState(false);
  const [loadingBackPagination, setLoadingBackPagination] = useState(false);
  const [loadingPageSize, setLoadingPageSize] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);

  const loading =
    loadingNextPagination
    || loadingBackPagination
    || loadingSearch
    || loadingPageSize;

  const table = useReactTable<TData>({
    data: pageData.content || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const loadData = useCallback(async (pageQuery: PageQuery<E>) => {
    if (!page) return;
    try {
      const results = await page(pageQuery);
      setPageData(results);
    } catch (error) {
      const err = extractError(error);
      pushAlertDialog({
        type: "error",
        title: err.title,
        description: err.description,
      });
    } finally {
      setLoadings(false);
    }
  }, [page]);

  useEffect(() => {
    loadData(pageQuery).then();
  }, [loadData, pageQuery]);


  useEffect(() => {
    if (isFirstRender) return;
    setLoadingFilters(true);
    setPageQuery((prev) => ({...prev, filters, page: 0}));
  }, [filters]);


  useEffect(() => {
    if (isFirstRender) return;
    const handler = setTimeout(() => {
      setLoadingSearch(true);
      setPageQuery((prev) => ({...prev, search, page: 0}));
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);


  const useFormInTable = deleteFn != undefined || (update != undefined && form?.update != undefined);

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
    setLoadingFilters(loading);
  }

  const setPageSize = (size: number) => {
    setLoadingPageSize(true);
    setPageQuery((prev) => ({...prev, size}));
  }


  const filterState: FilterState<keyof E, E> = {
    values: filters,
    loading: loadingFilters,
    set: (key, value) => setFilters((prev) => ({...prev, [key]: value})),
    get: (key) => filters[key],
    clear: () => Object.keys(filters).length && setFilters({}),
  };

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
          {form?.create && create && <CreateAction
              form={{
                defaultValues: form.create.defaultValues,
                schema: form.create.schema,
                FormComponent: form.FormComponent,
              }}
              create={create}
              reload={() => setPageQuery((prev) => ({...prev}))}
          />}
        </div>
      </div>
      {FilterComponent && <FilterComponent filters={filterState}/>}
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
                      delete={deleteFn}
                      update={update}
                  />}
                </TableRow>
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + (useFormInTable ? 1 : 0)} className="h-24 text-center">
                  {isFirstRender ? (
                    <div className="flex items-center justify-center space-x-2 flex-col">
                      <LoaderCircle className="animate-spin"/>
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
                    ? <LoaderCircle className="animate-spin"/>
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
                    ? <LoaderCircle className="animate-spin"/>
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
          {loading && <LoaderCircle className="animate-spin"/>}
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
            {loading ? <LoaderCircle className="animate-spin"/> : <ChevronsUpDownIcon/>}
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
  form?: FormFactory<TData, Dto, ID>,
  reload: () => void,
  delete?: (id: ID) => Promise<void>,
  update?: (id: ID, data: Dto) => Promise<TData>,
}

function EntityActions<TData extends Entity<ID>, Dto, ID>(
  {
    entity,
    form,
    reload,
    delete: deleteFn,
    update
  }: Readonly<EntityActionsProps<TData, Dto, ID>>) {

  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
      {form?.update && update && (
        <UpdateForm
          open={isUpdateOpen}
          setOpen={setIsUpdateOpen}
          onSuccess={reload}
          entity={entity}
          update={update}
          form={{
            defaultValues: form.update.defaultValues(entity),
            schema: form.update.schema,
            FormComponent: form.FormComponent,
          }}
        />
      )}
      {deleteFn && (
        <DeleteForm
          open={isDeleteOpen}
          setOpen={setIsDeleteOpen}
          onSuccess={reload}
          entity={entity}
          delete={deleteFn}
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
          {form?.update && update && (
            <DropdownMenuItem onSelect={handleUpdateClick}>
              <EditIcon/>
              Actualizar
            </DropdownMenuItem>
          )}
          {deleteFn && (
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
  form: FormConfig<TData, Dto, ID>,
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
        open={isOpen}
        setOpen={setIsOpen}
        onSuccess={reload}
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


