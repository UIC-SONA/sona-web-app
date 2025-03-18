import {
  createContext,
  ReactNode,
  useState,
  useCallback,
  PropsWithChildren,
  useMemo, useContext
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
export type DialogType = "success" | "error" | "warning" | "info" | "question";

type AsyncVoidFunction = () => Promise<void>;
type CallbackFunction = () => void;
type DialogCallback = AsyncVoidFunction | CallbackFunction;

const ANIMATION_DURATION = 200;

export interface DialogTypeArgs {
  "success": {
    onConfirm?: DialogCallback;
  }
  "error": {
    onConfirm?: DialogCallback;
    retry?: DialogCallback;
  }
  "warning": {
    onConfirm?: DialogCallback;
  }
  "info": {
    onConfirm?: DialogCallback;
  }
  "question": {
    onConfirm: DialogCallback;
    onCancel?: DialogCallback;
  }
}

export type AlertDialogConfigurer<Type extends DialogType> = {
  id?: string;
  type: Type;
  title: ReactNode;
  description: ReactNode;
  onError?: (error: unknown) => void;
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

export interface AlertDialogContextType {
  pushAlertDialog: <Type extends DialogType>(config: AlertDialogConfigurer<Type>) => string;
  popAlertDialog: (id: string) => void;
}

function isAsyncCallback(fn: DialogCallback): fn is AsyncVoidFunction {
  return fn.constructor.name === 'AsyncFunction';
}

const executeCallback = async (callback: DialogCallback) => {
  if (isAsyncCallback(callback)) {
    await callback();
  } else {
    callback();
  }
};

const resolveCallback = (dialog: DialogState, action: ActionType): DialogCallback | undefined => {
  if (action === 'confirm' && dialog.onConfirm) {
    return dialog.onConfirm;
  }
  
  if (action === 'cancel' && isDialogTypeConfig(dialog, "question") && dialog.onCancel) {
    return dialog.onCancel;
  }
  
  if (action === 'retry' && isDialogTypeConfig(dialog, "error") && dialog.retry) {
    return dialog.retry;
  }
}

type DialogState<T extends DialogType = DialogType> = {
  id: string;
  isClosing: boolean;
} & AlertDialogConfigurer<T>;


const AlertDialogContext = createContext<AlertDialogContextType | null>(null);

export const AlertDialogProvider = ({children}: Readonly<PropsWithChildren>) => {
  const [dialogs, setDialogs] = useState<DialogState[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState[]>([]);
  
  
  const pushAlertDialog = useCallback(<Type extends DialogType>(config: AlertDialogConfigurer<Type>) => {
    const dialogConfig: DialogState = {
      ...config,
      id: config.id ?? Math.random().toString(36).substring(7),
      isClosing: false,
    };
    setDialogs(prev => [...prev, dialogConfig]);
    return dialogConfig.id;
  }, []);
  
  const popAlertDialog = useCallback((id: string) => {
    // Primero marcamos el diálogo como "cerrando"
    setDialogs(prev => prev.map(dialog =>
      dialog.id === id ? {...dialog, isClosing: true} : dialog
    ));
    
    // Después del tiempo de animación, eliminamos el diálogo
    setTimeout(() => {
      setDialogs(prev => prev.filter(dialog => dialog.id !== id));
      setLoadingState(prev => prev.filter(state => state.dialogId !== id));
    }, ANIMATION_DURATION);
  }, []);
  
  const isLoading = useCallback((dialogId: string, action: ActionType) => {
    return loadingState.some(state => state.dialogId === dialogId && state.action === action);
  }, [loadingState]);
  
  const isDialogLoading = useCallback((dialogId: string) => {
    return loadingState.some(state => state.dialogId === dialogId);
  }, [loadingState]);
  
  const handleAction = useCallback(async (dialog: DialogState, action: ActionType) => {
    
    const callback = resolveCallback(dialog, action);
    
    if (!callback) {
      popAlertDialog(dialog.id);
      return;
    }
    
    const isAsync = isAsyncCallback(callback);
    
    try {
      
      if (isAsync) {
        setLoadingState(prev => [...prev, {dialogId: dialog.id, action}]);
      }
      
      await executeCallback(callback);
      popAlertDialog(dialog.id);
    } catch (error) {
      
      console.error('Error executing dialog action:', error);
      
      dialog.onError?.(error);
      if (isAsync) {
        setLoadingState(prev => prev.filter(state => !(state.dialogId === dialog.id && state.action === action)));
      }
      
    }
  }, [popAlertDialog]);
  
  const contextValue = useMemo(() => ({
    pushAlertDialog,
    popAlertDialog,
  }), [pushAlertDialog, popAlertDialog]);
  
  return (
    <AlertDialogContext.Provider value={contextValue}>
      {children}
      {dialogs.map((dialog) => {
        const thisDialogLoading = isDialogLoading(dialog.id);
        return <AlertDialog key={dialog.id} open={!dialog.isClosing}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
              <AlertDialogDescription>{dialog.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {isDialogTypeConfig(dialog, "question") && (
                <AlertDialogCancel
                  onClick={() => handleAction(dialog, 'cancel')}
                  disabled={thisDialogLoading}
                >
                  {isLoading(dialog.id, 'cancel') && <Loader2 className="animate-spin mr-2"/>}
                  Cancelar
                </AlertDialogCancel>
              )}
              {isDialogTypeConfig(dialog, "error") && dialog.retry && (
                <AlertDialogAction
                  onClick={() => handleAction(dialog, 'retry')}
                  disabled={thisDialogLoading}
                >
                  {isLoading(dialog.id, 'retry') && <Loader2 className="animate-spin mr-2"/>}
                  Reintentar
                </AlertDialogAction>
              )}
              <AlertDialogAction
                onClick={() => handleAction(dialog, 'confirm')}
                disabled={thisDialogLoading}
              >
                {isLoading(dialog.id, 'confirm') && <Loader2 className="animate-spin mr-2"/>}
                {dialog.type === "question" ? 'Aceptar' : 'Ok'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      })}
    </AlertDialogContext.Provider>
  );
};

export const useAlertDialog = () => {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};