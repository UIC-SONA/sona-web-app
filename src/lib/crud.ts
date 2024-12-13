export interface PageInfo {
  size: number;
  number: number;
  totalPages: number;
  totalElements: number;
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

export type Findable<T, ID> = {
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

export type Updatable<T, D, ID> = {
  update: (id: ID, entity: D) => Promise<T>;
};

export type Deletable<ID> = {
  delete: (id: ID) => Promise<void>;
};

export type ReadOperations<T, ID> = Findable<T, ID> & Listable<T> & Pageable<T> & Countable & Existable<ID>;

export type WriteOperations<T, D, ID> = Creatable<T, D> & Updatable<T, D, ID> & Deletable<ID>;

export type CrudOperations<T, D, ID> = ReadOperations<T, ID> & WriteOperations<T, D, ID>;

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