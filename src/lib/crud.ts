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

export enum Direction {
  ASC = "ASC",
  DESC = "DESC",
}

export enum FilterOperator {
  EQ = "eq",
  NE = "ne",
  GT = "gt",
  GE = "ge",
  LT = "lt",
  LE = "le",
  IN = "in",
  NIN = "nin",
  LIKE = "like",
  IS_NULL = "isNull",
  NOT_NULL = "notNull",
}

export interface Filter {
  property: string;
  operator: FilterOperator;
  value: string;
}

export interface PageQuery extends PageQueryWithoutFilter {
  filter?: Filter[];
}

export interface PageQueryWithoutFilter {
  search?: string;
  page: number;
  size: number;
  properties?: string[];
  direction?: Direction;
}

export function defaultPageQuery(size: number = 10): PageQuery {
  return {
    search: "",
    page: 0,
    size,
  };
}

export type Pageable<T> = {
  page: (query: PageQuery) => Promise<Page<T>>;
};

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

export type ReadOperations<T extends Entity<ID>, ID> = Findable<T, ID> & Pageable<T> & Countable & Existable<ID>;

export type WriteOperations<T extends Entity<ID>, D, ID> = Creatable<T, D> & Updatable<T, D, ID> & Deletable<ID>;

export type CrudOperations<T extends Entity<ID>, D, ID> = ReadOperations<T, ID> & WriteOperations<T, D, ID>;


export function isPageable<T>(operations: unknown): operations is Pageable<T> {
  return (operations as Pageable<T>).page !== undefined;
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

export function isReadOperations<T extends Entity<ID>, ID>(operations: unknown): operations is ReadOperations<T, ID> {
  return isFindable(operations) && isPageable(operations) && isCountable(operations) && isExistable(operations);
}

export function isWriteOperations<T extends Entity<ID>, D, ID>(operations: unknown): operations is WriteOperations<T, D, ID> {
  return isCreatable(operations) && isUpdatable(operations) && isDeletable(operations);
}

export function isCrudOperations<T extends Entity<ID>, D, ID>(operations: unknown): operations is CrudOperations<T, D, ID> {
  return isReadOperations(operations) && isWriteOperations(operations);
}


export function pageQueryToQueryParams(query: PageQuery): URLSearchParams {
  const params = new URLSearchParams();
  params.append("page", query.page.toString());
  params.append("size", query.size.toString());
  if (query.search) {
    params.append("search", query.search);
  }
  if (query.properties) {
    for (const property of query.properties) {
      params.append("properties", property);
    }
  }
  if (query.direction) {
    params.append("direction", query.direction);
  }

  if (query.filter) {
    for (const filter of query.filter) {
      params.append("filter", `${scaped(filter.property)}:${filter.operator}:${scaped(filter.value)}`);
    }
  }


  return params;
}

function scaped(value: string): string {
  return value
    .replace(",", "\\,")
    .replace(":", "\\:");
}