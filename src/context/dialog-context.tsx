import {
  createContext,
  ReactNode,
  useState,
  useCallback,
  PropsWithChildren,
  useMemo
} from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import {Loader2} from "lucide-react";

// eslint-disable-next-line react-refresh/only-export-components
export enum DialogType {
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
  QUESTION = "question",
}

type AsyncVoidFunction = () => Promise<void>;
type CallbackFunction = () => void;
type DialogCallback = AsyncVoidFunction | CallbackFunction;

export interface DialogTypeArgs {
  [DialogType.SUCCESS]: {
    onConfirm?: DialogCallback;
  }
  [DialogType.ERROR]: {
    onConfirm?: DialogCallback;
    retry?: DialogCallback;
  }
  [DialogType.WARNING]: {
    onConfirm?: DialogCallback;
  }
  [DialogType.INFO]: {
    onConfirm?: DialogCallback;
  }
  [DialogType.QUESTION]: {
    onConfirm: DialogCallback;
    onCancel?: DialogCallback;
  }
}

export type AlertDialogConfigurer<Type extends DialogType> = {
  id?: string;
  type: Type;
  title: ReactNode;
  description: ReactNode;
} & DialogTypeArgs[Type];

function isDialogTypeConfig<Type extends DialogType>(
  config: AlertDialogConfigurer<DialogType>,
  type: Type
): config is AlertDialogConfigurer<Type> {
  return config.type === type;
}

type ActionType = 'confirm' | 'cancel' | 'retry';

interface LoadingState {
  dialogId: string;
  action: ActionType;
}

export interface DialogContextType {
  pushAlertDialog: <Type extends DialogType>(config: AlertDialogConfigurer<Type>) => string;
  popAlertDialog: (id: string) => void;
}

const executeCallback = async (callback: DialogCallback) => {
  const result = callback();
  if (result instanceof Promise) {
    await result;
  }
};

// eslint-disable-next-line react-refresh/only-export-components
export const DialogContext = createContext<DialogContextType | null>(null);

export const DialogProvider = ({children}: Readonly<PropsWithChildren>) => {
  const [dialogs, setDialogs] = useState<AlertDialogConfigurer<DialogType>[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState[]>([]);

  const pushAlertDialog = useCallback(<Type extends DialogType>(config: AlertDialogConfigurer<Type>) => {
    const dialogConfig = {
      ...config,
      id: config.id ?? Math.random().toString(36).substring(7),
    };
    setDialogs(prev => [...prev, dialogConfig as AlertDialogConfigurer<DialogType>]);
    return dialogConfig.id;
  }, []);

  const popAlertDialog = useCallback((id: string) => {
    setDialogs(prev => prev.filter(dialog => dialog.id !== id));
    setLoadingState(prev => prev.filter(state => state.dialogId !== id));
  }, []);

  const isLoading = useCallback((dialogId: string, action: ActionType) => {
    return loadingState.some(state =>
      state.dialogId === dialogId && state.action === action
    );
  }, [loadingState]);

  const isDialogLoading = useCallback((dialogId: string) => {
    return loadingState.some(state => state.dialogId === dialogId);
  }, [loadingState]);

  const handleAction = useCallback(async (dialog: AlertDialogConfigurer<DialogType>, action: ActionType) => {
    try {
      setLoadingState(prev => [...prev, {dialogId: dialog.id!, action}]);

      if (action === 'confirm' && dialog.onConfirm) {
        await executeCallback(dialog.onConfirm);
      }

      if (action === 'cancel' && isDialogTypeConfig(dialog, DialogType.QUESTION) && dialog.onCancel) {
        await executeCallback(dialog.onCancel);
      }

      if (action === 'retry' && isDialogTypeConfig(dialog, DialogType.ERROR) && dialog.retry) {
        await executeCallback(dialog.retry);
      }

      popAlertDialog(dialog.id!);
    } catch (error) {
      console.error('Error executing dialog action:', error);
      setLoadingState(prev =>
        prev.filter(state => !(state.dialogId === dialog.id! && state.action === action))
      );
    }
  }, [popAlertDialog]);

  const contextValue = useMemo(() => ({
    pushAlertDialog,
    popAlertDialog,
  }), [pushAlertDialog, popAlertDialog]);

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      {dialogs.map((dialog) => {
        const thisDialogLoading = isDialogLoading(dialog.id!);

        return <AlertDialog key={dialog.id} open={true}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
              <AlertDialogDescription>{dialog.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {isDialogTypeConfig(dialog, DialogType.QUESTION) && (
                <AlertDialogCancel
                  onClick={() => handleAction(dialog, 'cancel')}
                  disabled={thisDialogLoading}
                >
                  {isLoading(dialog.id!, 'cancel') ? (
                    <Loader2 className="animate-spin mr-2"/>
                  ) : (
                    'Cancelar'
                  )}
                </AlertDialogCancel>
              )}
              {isDialogTypeConfig(dialog, DialogType.ERROR) && dialog.retry && (
                <AlertDialogAction
                  onClick={() => handleAction(dialog, 'retry')}
                  disabled={thisDialogLoading}
                >
                  {isLoading(dialog.id!, 'retry') && (
                    <Loader2 className="animate-spin mr-2"/>
                  )}
                  Reintentar
                </AlertDialogAction>
              )}
              <AlertDialogAction
                onClick={() => handleAction(dialog, 'confirm')}
                disabled={thisDialogLoading}
              >
                {isLoading(dialog.id!, 'confirm') && (
                  <Loader2 className="animate-spin mr-2"/>
                )}
                {dialog.type === DialogType.QUESTION ? 'Aceptar' : 'Ok'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      })}
    </DialogContext.Provider>
  );
};