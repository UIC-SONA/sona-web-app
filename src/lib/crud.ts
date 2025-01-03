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

export type Direction = "ASC" | "DESC";

export type PageQuery<E = {}> = {
  search?: string;
  page: number;
  size: number;
  properties?: string[];
  direction?: Direction;
} & E;

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


export function pageQueryToParams(query: PageQuery): URLSearchParams {
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

  addExtensions(query, params);
  return params;
}

function addExtensions(query: PageQuery, params: URLSearchParams) {
  const extensions = Object.keys(query).filter(key => !["page", "size", "search", "properties", "direction"].includes(key));

  for (const key of extensions) {
    const value = (query as any)[key];
    if (value) {

      if (Array.isArray(value)) {
        for (const item of value) {
          params.append(key, item.toString());
        }
      } else {
        params.append(key, value.toString());
      }
    }
  }

}