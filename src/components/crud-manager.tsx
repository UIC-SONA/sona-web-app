import {CrudOperations, Page, Pageable} from "@/lib/crud.ts";
import {useEffect, useState} from "react";
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
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";

// export type FormToDto<D> = (form: FormEvent<HTMLFormElement>) => D;
export interface CrudManagerProps<TData, Dto, ID> {
  operations: CrudOperations<TData, Dto, ID>;
  // formToDto: FormToDto<D>;
  columns: ColumnDef<TData>[];
}

export default function CrudManager<TData, Dto, ID>({operations, columns}: Readonly<CrudManagerProps<TData, Dto, ID>>) {
  return (
    <div>
      <DataTable columns={columns} pageable={operations}/>
    </div>
  )
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  pageable: Pageable<TData>
}

export function DataTable<TData, TValue>({columns, pageable}: Readonly<DataTableProps<TData, TValue>>) {

  const [pageQuery, setPageQuery] = useState({page: 0, size: 3})
  const [data, setData] = useState<Page<TData>>({content: [], page: {totalElements: 0, size: 0, totalPages: 0, number: 0}})
  const [loadingNextPagination, setLoadingNextPagination] = useState(false);
  const [loadingBackPagination, setLoadingBackPagination] = useState(false);
  const [loadingSort, setLoadingSort] = useState(false

  const table = useReactTable({
    data: data?.content || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  useEffect(() => {
    pageable.page(pageQuery)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoadingPage(false));
  }, [pageQuery, pageable])

  const nextPage = () => {
    setLoadingNextPagination(true);
    setPageQuery((prev) => ({...prev, page: prev.page + 1}))
  }

  const previousPage = () => {
    setLoadingBackPagination(true);
    setPageQuery((prev) => ({...prev, page: prev.page - 1}))
  }

  const setLoadingPage = (loaging: boolean) => {
    setLoadingNextPagination(loaging);
    setLoadingBackPagination(loaging);
  }

  const loadingPagination = loadingNextPagination || loadingBackPagination || loadingSort;

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(({column, id, getContext, isPlaceholder}) => {
                  return (
                    <TableHead key={id}>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setLoadingSort(true);
                          pageable.page({...pageQuery, properties: [column.columnDef.accessorKey]})
                            .then(setData)
                            .catch(console.error)
                            .finally(() => setLoadingSort(false));
                        }}
                      >
                        {isPlaceholder ? null : flexRender(column.columnDef.header, getContext())}
                        <ArrowUpDown className="ml-2 h-4 w-4"/>
                      </Button>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
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