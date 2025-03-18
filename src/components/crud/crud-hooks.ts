import {Dispatch, SetStateAction, useState} from "react";

export enum LoadingTableState {
  LoadingData,
  LoadingNextPagination,
  LoadingBackPagination,
  LoadingSearch,
  LoadingPageSize,
  LoadingFilters,
}

export interface UseLoadingTable {
  isLoading: boolean;
  loadingTable: LoadingTableState | undefined;
  setLoadingTable: Dispatch<SetStateAction<LoadingTableState | undefined>>;
  columnSorting?: string;
  setColumnSorting: Dispatch<SetStateAction<string | undefined>>;
  cancelLoading: () => void;
}

export default function useLoadingTable(initialState?: LoadingTableState): UseLoadingTable {
  
  const [loadingTable, setLoadingTable] = useState<LoadingTableState | undefined>(initialState);
  const [columnSorting, setColumnSorting] = useState<string | undefined>();
  
  const isLoading = loadingTable !== undefined || columnSorting !== undefined;
  
  const cancelLoading = () => {
    setLoadingTable(undefined);
    setColumnSorting(undefined);
  }
  
  return {
    isLoading,
    loadingTable,
    setLoadingTable,
    columnSorting,
    setColumnSorting,
    cancelLoading
  }
}