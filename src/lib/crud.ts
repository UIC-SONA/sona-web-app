import {Filter} from "@/components/crud/crud-table-filters.ts";

export interface PageInfo {
  size: number;
  number: number;
  totalPages: number;
  totalElements: number;
}

export interface WithUUID {
  id: string;
}

export interface Entity<ID> {
  id: ID;
}

export interface Page<T> {
  content: T[];
  page: PageInfo;
}

export function emptyPage<T>(): Page<T> {
  return {
    content: [],
    page: {
      size: 0,
      number: 0,
      totalPages: 0,
      totalElements: 0,
    },
  };
}

export type Direction = "asc" | "desc";

export type PageQuery<F = {}> = {
  search?: string;
  page?: number;
  size?: number;
  sorts?: Sort[];
  filters?: Filter<F>;
};

export type Sort = {
  property: string;
  direction: Direction;
};

export type ExportScheme = {
  titles: string[];
  fields: string[];
}

export function defaultPageQuery(size: number = 10): PageQuery {
  return {
    search: "",
    page: 0,
    size,
    sorts: [],
  };
}

export type Pageable<T, Filter = {}> = {
  page: (query: PageQuery<Filter>) => Promise<Page<T>>;
};

export type Exportable<Filter = {}> = {
  export: (query: PageQuery<Filter>, scheme: ExportScheme) => Promise<Blob>;
}

export type Findable<T extends Entity<ID>, ID> = {
  find: (id: ID) => Promise<T>;
  findMany: (ids: ID[]) => Promise<T[]>;
};

export type Countable = {
  count: () => Promise<number>;
};

export type Existable<ID> = {
  exist: (id: ID) => Promise<boolean>;
};

export type Creatable<T, D> = {
  create: (dto: D) => Promise<T>;
};

export type Updatable<T extends Entity<ID>, D, ID> = {
  update: (id: ID, dto: D) => Promise<T>;
};

export type Deletable<ID> = {
  delete: (id: ID) => Promise<void>;
};

export type ReadOperations<T extends Entity<ID>, ID, Filter = {}> = Findable<T, ID> & Pageable<T, Filter> & Countable & Existable<ID> & Exportable<Filter>;

export type WriteOperations<T extends Entity<ID>, D, ID> = Creatable<T, D> & Updatable<T, D, ID> & Deletable<ID>;

export type CrudOperations<T extends Entity<ID>, D, ID, Filter = {}> = ReadOperations<T, ID, Filter> & WriteOperations<T, D, ID>;


export function isPageable<Filter>(operations: unknown): operations is Pageable<Filter> {
  return (operations as Pageable<Filter>).page !== undefined;
}

export function isExportable<Filter>(operations: unknown): operations is Exportable<Filter> {
  return (operations as Exportable<Filter>).export !== undefined;
}

export function isFindable<T extends Entity<ID>, ID>(operations: unknown): operations is Findable<T, ID> {
  return (operations as Findable<T, ID>).find !== undefined;
}

export function isCountable(operations: unknown): operations is Countable {
  return (operations as Countable).count !== undefined;
}

export function isExistable<ID>(operations: unknown): operations is Existable<ID> {
  return (operations as Existable<ID>).exist !== undefined;
}

export function isCreatable<T, D>(operations: unknown): operations is Creatable<T, D> {
  return (operations as Creatable<T, D>).create !== undefined;
}

export function isUpdatable<T extends Entity<ID>, D, ID>(operations: unknown): operations is Updatable<T, D, ID> {
  return (operations as Updatable<T, D, ID>).update !== undefined;
}

export function isDeletable<ID>(operations: unknown): operations is Deletable<ID> {
  return (operations as Deletable<ID>).delete !== undefined;
}

export function isReadOperations<T extends Entity<ID>, ID, Filter = {}>(operations: unknown): operations is ReadOperations<T, ID, Filter> {
  return isFindable(operations) && isPageable(operations) && isCountable(operations) && isExistable(operations);
}

export function isWriteOperations<T extends Entity<ID>, D, ID>(operations: unknown): operations is WriteOperations<T, D, ID> {
  return isCreatable(operations) && isUpdatable(operations) && isDeletable(operations);
}

export function isCrudOperations<T extends Entity<ID>, D, ID, Filter>(operations: unknown): operations is CrudOperations<T, D, ID, Filter> {
  return isReadOperations(operations) && isWriteOperations(operations);
}