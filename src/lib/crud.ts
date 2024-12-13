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

export enum Direction {
  ASC = "ASC",
  DESC = "DESC",
}

export interface PageQuery {
  search?: string;
  page: number;
  size: number;
  properties?: string[];
  direction?: Direction;
}

export type Listable<T> = {
  list: (search?: string) => Promise<T[]>;
};

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
  create: (entity: D) => Promise<T>;
};

export type Updatable<T extends Entity<ID>, D, ID> = {
  update: (id: ID, entity: D) => Promise<T>;
};

export type Deletable<ID> = {
  delete: (id: ID) => Promise<void>;
};

export type ReadOperations<T extends Entity<ID>, ID> = Findable<T, ID> & Listable<T> & Pageable<T> & Countable & Existable<ID>;

export type WriteOperations<T extends Entity<ID>, D, ID> = Creatable<T, D> & Updatable<T, D, ID> & Deletable<ID>;

export type CrudOperations<T extends Entity<ID>, D, ID> = ReadOperations<T, ID> & WriteOperations<T, D, ID>;


export function isPageable<T>(operations: unknown): operations is Pageable<T> {
  return (operations as Pageable<T>).page !== undefined;
}

export function isListable<T>(operations: unknown): operations is Listable<T> {
  return (operations as Listable<T>).list !== undefined;
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
  return isFindable(operations) && isListable(operations) && isPageable(operations) && isCountable(operations) && isExistable(operations);
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
  return params;
}