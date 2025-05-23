import {Countable, Creatable, CrudOperations, Deletable, Entity, Existable, Exportable, ExportScheme, Findable, Page, Pageable, PageQuery, ReadOperations, Updatable, WriteOperations} from "@/lib/crud.ts";
import {Axios, AxiosHeaders, RawAxiosRequestHeaders} from "axios";


type Headers = RawAxiosRequestHeaders | AxiosHeaders;

export type Transformer<Source, Target> = (src: Source) => Target;
export type FiltersTransformer<E> = (extensions: Partial<E>) => URLSearchParams;

export type ReadHeadersConfig = {
  pageable?: Headers;
  findable?: Headers;
  countable?: Headers;
  existable?: Headers;
};

export type WriteHeadersConfig = {
  creatable?: Headers;
  updatable?: Headers;
  deleteable?: Headers;
};

export type CrudHeadersConfig = ReadHeadersConfig & WriteHeadersConfig;


export type ReadableConfig<T> = {
  modelTransformer?: Transformer<any, T>;
}

export type WriteableConfig<T, D> = ReadableConfig<T> & {
  dtoTranformer?: Transformer<D, any>;
};

export type ConfigWithHeader<T extends ReadHeadersConfig | WriteHeadersConfig | Headers = Headers> = {
  headers?: T;
}


export function pageQueryToParams<F = {}>(query: PageQuery<F>, filtersTransformer?: FiltersTransformer<F>): URLSearchParams {
  
  const {page, size, search, sorts, filters} = query;
  
  const params = new URLSearchParams();
  
  if (page) {
    params.append("page", page.toString());
  }
  
  if (size) {
    params.append("size", size.toString());
  }
  
  if (search) {
    params.append("search", search);
  }
  
  if (sorts) {
    for (const sort of sorts) {
      params.append("sort", sort.property + "," + sort.direction);
    }
  }
  
  if (!filters) {
    return params;
  }
  
  const filtersParams = filtersTransformer ? filtersTransformer(filters) : defaultFiltersTransformer<F>(filters);
  
  for (const key of filtersParams.keys()) {
    const values = filtersParams.getAll(key);
    for (const value of values) {
      params.append(key, value);
    }
  }
  
  return params;
}

function defaultFiltersTransformer<F = {}>(filters: Partial<F>): URLSearchParams {
  const params = new URLSearchParams();
  if (!filters) return params;
  
  for (const key of Object.keys(filters)) {
    const value = (filters as any)[key];
    if (value === undefined || value === null) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item.toString());
      }
    } else {
      params.append(key, value.toString());
    }
  }
  
  return params;
  
}

export interface RestPageableConfig<T, Filters> extends ReadableConfig<T> {
  filtersTransformer?: FiltersTransformer<Filters>;
}

export function restPageable<T, Filters = {}>(axios: Axios, resource: string, config?: RestPageableConfig<T, Filters> & ConfigWithHeader): Pageable<T, Filters> {
  const page = async (query: PageQuery<Filters>) => {
    const response = await axios.get<Page<any>>(
      resource,
      {
        params: pageQueryToParams(query, config?.filtersTransformer),
        headers: config?.headers,
      },
    );
    
    const data = response.data;
    return config?.modelTransformer ? {...data, content: data.content.map(config.modelTransformer)} : data as Page<T>;
  }
  
  return {page};
}

export function restExportable(axios: Axios, resource: string, filtersTransformer?: FiltersTransformer<any>, headers?: Headers): Exportable {
  const exportFn = async (query: PageQuery, scheme: ExportScheme) => {
    const params = pageQueryToParams(query, filtersTransformer);
    
    for (const field of scheme.fields) {
      params.append("fields", field);
    }
    
    for (const title of scheme.titles) {
      params.append("titles", title);
    }
    
    const response = await axios.get(
      `${resource}/export`,
      {
        params: params,
        headers,
        responseType: 'blob',
      }
    );
    
    return new Blob([response.data], {type: 'application/octet-stream'});
  }
  
  return {export: exportFn};
}

export function restFindable<T extends Entity<ID>, ID>(axios: Axios, resource: string, config?: ReadableConfig<T> & ConfigWithHeader): Findable<T, ID> {
  const find = async (id: ID) => {
    const response = await axios.get(
      `${resource}/${id}`,
      {
        headers: config?.headers,
      }
    );
    return config?.modelTransformer ? config.modelTransformer(response.data) : response.data as T;
  }
  
  const findMany = async (ids: ID[]) => {
    const response = await axios.get(
      `${resource}/many`,
      {
        params: new URLSearchParams({
          ids: ids.join(','),
        }),
        headers: config?.headers,
      }
    );
    return config?.modelTransformer ? response.data.map(config.modelTransformer) : response.data as T[];
  }
  
  return {find, findMany};
}

export function restCountable(axios: Axios, resource: string, headers?: Headers): Countable {
  const count = async () => {
    const response = await axios.get<number>(
      `${resource}/count`,
      {
        headers,
      }
    );
    return response.data;
  }
  
  return {count};
}

export function restExistable<ID>(axios: Axios, resource: string, headers?: Headers): Existable<ID> {
  const exist = async (id: ID) => {
    const response = await axios.get<boolean>(
      `${resource}/exist/${id}`,
      {
        headers,
      }
    );
    return response.data;
  }
  
  return {exist};
}


export function restCreatable<T, D>(axios: Axios, resource: string, config?: WriteableConfig<T, D> & ConfigWithHeader): Creatable<T, D> {
  const create = async (dto: D) => {
    const response = await axios.post(
      resource,
      config?.dtoTranformer ? config.dtoTranformer(dto) : dto,
      {
        headers: config?.headers,
      }
    );
    return config?.modelTransformer ? config.modelTransformer(response.data) : response.data as T;
  }
  
  return {create};
}

export function restUpdatable<T extends Entity<ID>, D, ID>(axios: Axios, resource: string, config?: WriteableConfig<T, D> & ConfigWithHeader): Updatable<T, D, ID> {
  
  const update = async (id: ID, entity: D) => {
    const response = await axios.put(
      `${resource}/${id}`,
      config?.dtoTranformer ? config.dtoTranformer(entity) : entity,
      {
        headers: config?.headers,
      }
    );
    return config?.modelTransformer ? config.modelTransformer(response.data) : response.data as T;
  }
  
  return {update};
}

export function restDeleteable<ID>(axios: Axios, resource: string, headers?: Headers): Deletable<ID> {
  const deleteFn = async (id: ID) => {
    await axios.delete<void>(
      `${resource}/${id}`,
      {
        headers,
      }
    );
  }
  
  return {delete: deleteFn};
}


export type RestReadConfig<Filters> = RestPageableConfig<any, Filters> & ConfigWithHeader<ReadHeadersConfig>;

export function restRead<T extends Entity<ID>, ID, Filters = {}>(axios: Axios, resource: string, config?: RestReadConfig<Filters>): ReadOperations<T, ID, Filters> {
  
  const {headers} = config ?? {};
  
  const pageable = restPageable<T, Filters>(axios, resource, {...config, headers: headers?.pageable});
  const exportable = restExportable(axios, resource, config?.filtersTransformer, headers?.pageable);
  const findable = restFindable<T, ID>(axios, resource, {...config, headers: headers?.findable});
  const countable = restCountable(axios, resource, headers?.countable);
  const existable = restExistable<ID>(axios, resource, headers?.existable);
  
  return {
    ...pageable,
    ...exportable,
    ...findable,
    ...countable,
    ...existable,
  };
}

export type RestWriteConfig<D> = WriteableConfig<any, D> & ConfigWithHeader<WriteHeadersConfig>;

export function restWrite<T extends Entity<ID>, D, ID>(axios: Axios, resource: string, config?: RestWriteConfig<D>): WriteOperations<T, D, ID> {
  const {headers} = config ?? {};
  const creatable = restCreatable<T, D>(axios, resource, {...config, headers: headers?.creatable});
  const updatable = restUpdatable<T, D, ID>(axios, resource, {...config, headers: headers?.updatable});
  const deleteable = restDeleteable<ID>(axios, resource, headers?.deleteable);
  
  return {
    ...creatable,
    ...updatable,
    ...deleteable,
  };
}

export type RestCrudConfig<D, Filters> = RestReadConfig<Filters> & RestWriteConfig<D>;

export function restCrud<T extends Entity<ID>, D, ID, Filters = {}>(axios: Axios, resource: string, config?: RestCrudConfig<D, Filters>): CrudOperations<T, D, ID, Filters> {
  const read = restRead<T, ID, Filters>(axios, resource, config);
  const write = restWrite<T, D, ID>(axios, resource, config);
  
  return {
    ...read,
    ...write,
  };
}