import {useContext} from "react";
import {DialogContext} from "@/context/dialog-context.tsx";

export const useAlertDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};