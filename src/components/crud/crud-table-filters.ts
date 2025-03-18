export type Filter<E> = Partial<E>;

export interface FilterComponentProps<E> {
  filters: FilterState<keyof E, E>,
}

export interface FilterState<K extends keyof E, E> {
  values: Filter<E>;
  
  set(key: K, value?: E[K]): void;
  
  get(key: K): E[K] | undefined;
  
  clear(): void;
  
  loading: boolean;
}