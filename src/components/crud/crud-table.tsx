import {
  CrudOperations,
  Entity,
  ExportScheme,
  PageQuery,
  Sort,
} from "@/lib/crud.ts";
import {
  ComponentType,
  ReactNode,
  useEffect,
  useState
} from "react";
import {
  ColumnDef,
  ColumnSort,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortDirection,
  SortingState,
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDownIcon,
  ChevronUp,
  EditIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  LoaderCircle,
  LucideIcon,
  PlusIcon,
  SaveIcon,
  SearchIcon,
  TrashIcon,
} from "lucide-react";
import {Input,} from "@/components/ui/input.tsx";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {useAlertDialog} from "@/context/alert-dialog-context.tsx";
import {introspect,} from "@/lib/errors.ts";
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
import useLoadingTable, {LoadingTableState} from "@/components/crud/crud-hooks.ts";
import {
  FilterComponentProps,
  FilterState
} from "@/components/crud/crud-table-filters.ts";

const perPage = [5, 10, 25, 50, 100];

const sortingStateToParams = (sortingState: SortingState): Sort[] => {
  if (!sortingState.length) return [];
  return sortingState.map<Sort>(({id, desc}: ColumnSort) => ({
    property: id,
    direction: desc ? 'desc' : 'asc',
  }));
};


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
  entityActions?: (data: TData, reload: () => void) => EntityAction[];
}

export type CrudTableProps<TData extends Entity<ID>, Dto, ID, E = {}> = {
  title: ReactNode;
  operations: Partial<CrudOperations<TData, Dto, ID, E>>;
  table: TableFactory<TData, ID, E>;
  form?: FormFactory<TData, Dto, ID>;
  exportScheme?: ExportScheme;
}

export default function CrudTable<TData extends Entity<ID>, Dto, ID, Filters = {}>({title, table, operations, form, exportScheme}: Readonly<CrudTableProps<TData, Dto, ID, Filters>>) {
  return <CrudOperationsTable<TData, Dto, ID, Filters>
    title={title}
    table={table}
    form={form}
    exportScheme={exportScheme}
    {...operations}
  />
}

interface CrudOperationsTableProp<TData extends Entity<ID>, Dto, ID, Filters = {}> extends Partial<CrudOperations<TData, Dto, ID, Filters>> {
  title: ReactNode;
  table: TableFactory<TData, ID, Filters>;
  form?: FormFactory<TData, Dto, ID>;
  exportScheme?: ExportScheme;
}

function CrudOperationsTable<
  TData extends Entity<ID>,
  Dto,
  ID,
  Filters = {}
>({
    title,
    table: {
      columns,
      FilterComponent,
      entityActions
    },
    form,
    page,
    exportScheme,
    delete: deleteFn,
    export: exportFn,
    create,
    update
  }: Readonly<CrudOperationsTableProp<TData, Dto, ID, Filters>>
) {
  
  const isFirstRender = useIsFirstRender();
  const {pushAlertDialog} = useAlertDialog();
  
  const [data, setData] = useState<TData[]>([]);
  const [pagination, setPagination] = useState<PaginationState & { totalPages: number; totalElements: number; }>({pageIndex: 0, pageSize: 20, totalPages: 0, totalElements: 0});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Partial<Filters>>({});
  
  const {isLoading, loadingTable, setLoadingTable, cancelLoading, columnSorting, setColumnSorting} = useLoadingTable();
  
  const getPageQuery: () => PageQuery<Filters> = () => {
    return {
      search,
      page: pagination.pageIndex,
      size: pagination.pageSize,
      sorts: sortingStateToParams(sorting),
      filters,
    };
  }
  
  const fetchData = async () => {
    if (!page) return;
    try {
      const query = getPageQuery();
      const results = await page(query);
      
      setData(results.content);
      setPagination({
        pageSize: results.page.size,
        pageIndex: results.page.number,
        totalPages: results.page.totalPages,
        totalElements: results.page.totalElements,
      });
    } catch (error) {
      pushAlertDialog({type: "error", ...introspect(error)});
    } finally {
      cancelLoading();
    }
  };
  
  const hasExport = exportScheme != undefined && exportFn != undefined;
  
  const exportData = async () => {
    if (!hasExport) return;
    
    try {
      
      const query = getPageQuery();
      const blob = await exportFn(query, exportScheme);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "export.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      const {title, description} = introspect(error);
      pushAlertDialog({type: "error", title, description});
    }
  }
  const loadData = () => {
    fetchData().then();
  }
  
  useEffect(() => {
    setLoadingTable(LoadingTableState.LoadingData);
    loadData();
  }, []);
  
  
  useEffect(() => {
    if (isFirstRender) return;
    loadData();
  }, [pagination.pageIndex, pagination.pageSize, sorting, filters]);
  
  useEffect(() => {
    if (isFirstRender) return;
    const handler = setTimeout(() => {
      setLoadingTable(LoadingTableState.LoadingSearch)
      loadData();
    }, 500);
    
    return () => clearTimeout(handler);
  }, [search]);
  
  const useFormInTable =
    deleteFn != undefined
    || (update != undefined && form?.update != undefined)
    || (entityActions != undefined);
  
  const onPaginationChange = (updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
    setPagination((pagination) => ({
      ...pagination,
      ...(typeof updater === "function" ? updater(pagination) : updater),
    }));
  }
  
  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    manualSorting: true,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    pageCount: pagination.totalPages,
  });
  
  const nextPage = () => {
    setLoadingTable(LoadingTableState.LoadingNextPagination);
    table.nextPage();
  };
  
  const previousPage = () => {
    setLoadingTable(LoadingTableState.LoadingBackPagination);
    table.previousPage();
  };
  
  const setPageSize = (size: number) => {
    setLoadingTable(LoadingTableState.LoadingPageSize);
    table.setPageSize(size);
  }
  
  const reload = () => {
    setLoadingTable(LoadingTableState.LoadingData);
    if (table.getState().pagination.pageIndex === 0) {
      loadData();
    } else {
      table.resetPageIndex();
    }
  }
  
  const clearFilters = () => {
    if (Object.keys(filters).length === 0) return;
    setLoadingTable(LoadingTableState.LoadingFilters);
    setFilters({});
  }
  
  const setFilter = (key: keyof Filters, value?: Filters[keyof Filters]) => {
    setLoadingTable(LoadingTableState.LoadingFilters);
    setFilters((prev) => ({...prev, [key]: value}));
  }
  
  const getFilter = (key: keyof Filters): Filters[keyof Filters] | undefined => {
    return filters[key];
  }
  
  const loadingData = loadingTable === LoadingTableState.LoadingData;
  const loadingNextPagination = loadingTable === LoadingTableState.LoadingNextPagination;
  const loadingBackPagination = loadingTable === LoadingTableState.LoadingBackPagination;
  const loadingFilters = loadingTable === LoadingTableState.LoadingFilters;
  
  const filterState: FilterState<keyof Filters, Filters> = {
    values: filters,
    loading: loadingFilters,
    set: setFilter,
    get: getFilter,
    clear: clearFilters,
  };
  
  return (
    <div className="w-full">
      {typeof title === "string" ? < h1 className="text-2xl font-bold mb-4">{title}</h1> : title}
      <div className="grid gap-4 mb-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 items-center">
        <IntelliSearch
          value={search}
          onSearch={setSearch}
          loading={loadingTable === LoadingTableState.LoadingSearch}
          className="col-span-1 sm:col-span-2 lg:col-span-4"
        />
        <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-center justify-end space-x-2">
          <DropdownPerPage
            pageSize={table.getState().pagination.pageSize}
            onPageSizeChange={setPageSize}
            loading={loadingTable === LoadingTableState.LoadingPageSize}
          />
          <DropdownVisibleColumns
            table={table}
          />
          {hasExport && <Button
            variant="outline"
            onClick={exportData}
            disabled={isLoading}
          >
            <SaveIcon/>
          </Button>}
          {form?.create && create && <CreateAction
            form={{
              defaultValues: form.create.defaultValues,
              schema: form.create.schema,
              FormComponent: form.FormComponent,
            }}
            create={create}
            reload={reload}
          />}
        </div>
      </div>
      {
        FilterComponent && <FilterComponent filters={filterState}/>
      }
      <div className="border rounded-lg overflow-hidden">
        <TableComponent>
          <TableHeader className="bg-primary bg-opacity-50">
            {table.getHeaderGroups().map((headerGroup) => {
              const headClassName = "font-bold text-primary-foreground";
              return (
                <TableRow key={headerGroup.id} className="hover:bg-primary">
                  {headerGroup.headers.map((header) => {
                    const column = header.column;
                    const columnDef = column.columnDef;
                    const headerToRender = columnDef.header;
                    
                    if (typeof headerToRender === "string" && column.getCanSort()) {
                      return (
                        <TableHead key={header.id} className={headClassName}>
                          {flexRender(
                            <Button
                              variant="ghost"
                              className="font-bold"
                              onClick={() => {
                                setColumnSorting(column.id);
                                column.toggleSorting();
                              }}
                              disabled={isLoading}
                            >
                              {headerToRender}
                              <SortIcon isSorted={column.getIsSorted()} sorting={columnSorting === column.id}/>
                            </Button>, header.getContext())}
                        </TableHead>
                      )
                    }
                    
                    return (
                      <TableHead key={header.id} className={headClassName}>
                        {header.isPlaceholder ? null : flexRender(columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                  {useFormInTable && <TableHead/>}
                </TableRow>
              );
            })}
          </TableHeader>
          <TableBody>
            <CrudTableBody<TData, ID>
              loading={loadingData}
              table={table}
              columns={columns}
              {...{
                aditionalCell: !useFormInTable ? undefined : entity => <EntityActions
                  entity={entity}
                  form={form}
                  reload={reload}
                  delete={deleteFn}
                  update={update}
                  entityActions={entityActions}
                />
              }}
            />
          </TableBody>
        </TableComponent>
      </div>
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-muted-foreground">
          Total de registros: <b>{pagination.totalElements}</b>
        </span>
        {table.getPageCount() > 0 &&
          <div className="space-x-2">
                <span className="text-sm text-muted-foreground">
                    Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                </span>
            <Button
              variant="outline"
              size="sm"
              onClick={previousPage}
              disabled={!table.getCanPreviousPage() || isLoading}
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
              disabled={!table.getCanNextPage() || isLoading}
            >
              {loadingNextPagination
                ? <LoaderCircle className="animate-spin"/>
                : <ChevronRight/>
              }
            </Button>
          </div>}
      </div>
    </div>);
}

interface CrudTableBodyProps<TData extends Entity<ID>, ID> {
  loading: boolean;
  table: Table<TData>,
  columns: ColumnDef<TData>[],
  aditionalCell?: (entity: TData) => ReactNode,
}


function CrudTableBody<TData extends Entity<ID>, ID>(
  {
    loading,
    table,
    columns,
    aditionalCell
  }: Readonly<CrudTableBodyProps<TData, ID>>
) {
  if (loading) return (
    <TableRow>
      <TableCell colSpan={columns.length + (aditionalCell ? 1 : 0)} className="h-24 text-center">
        <div className="flex items-center justify-center space-x-2 flex-col">
          <LoaderCircle className="animate-spin"/>
          Cargando...
        </div>
      </TableCell>
    </TableRow>
  );
  
  const rows = table.getRowModel().rows;
  
  if (rows.length === 0) return (
    <TableRow>
      <TableCell colSpan={columns.length + (aditionalCell ? 1 : 0)} className="h-24 text-center">
        No hay datos
      </TableCell>
    </TableRow>
  );
  
  return <>
    {table.getRowModel().rows.map((row) => {
      return <TableRow
        key={row.id}
        data-state={row.getIsSelected() && "selected"}
      >
        
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
        
        {aditionalCell && <TableCell className="sticky right-0 bg-background">
          <div className="absolute left-0 top-0 h-full w-px border-l"></div>
          <div className="flex items-center justify-center h-full">
            {aditionalCell(row.original)}
          </div>
        </TableCell>}
      
      </TableRow>
    })}
  </>
}

function SortIcon({isSorted, sorting}: Readonly<{ isSorted: false | SortDirection, sorting: boolean }>) {
  if (sorting) return <LoaderCircle className="animate-spin"/>;
  if (isSorted === false) return <ChevronsUpDownIcon/>;
  return isSorted === "asc" ? <ChevronUp/> : <ChevronDown/>;
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

interface EntityAction {
  label: string,
  icon: LucideIcon,
  onClick: () => void
}

interface EntityActionsProps<TData extends Entity<ID>, Dto, ID> {
  entity: TData,
  form?: FormFactory<TData, Dto, ID>,
  reload: () => void,
  delete?: (id: ID) => Promise<void>,
  update?: (id: ID, dto: Dto) => Promise<TData>,
  entityActions?: (data: TData, reload: () => void) => EntityAction[],
}

function EntityActions<TData extends Entity<ID>, Dto, ID>(
  {
    entity,
    form,
    reload,
    delete: deleteFn,
    update,
    entityActions
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
  
  const actions = entityActions?.(entity, reload) ?? [];
  
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
          <EllipsisVerticalIcon className="hover:cursor-pointer"/>
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
          {actions.map((action) => (
            <DropdownMenuItem key={action.label} onSelect={action.onClick}>
              <action.icon/>
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

interface CreateActionProps<TData extends Entity<ID>, Dto, ID> {
  form: FormConfig<TData, Dto>,
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


