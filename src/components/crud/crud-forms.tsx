import {
  DefaultValues,
  GlobalError,
  useForm,
  UseFormReturn
} from "react-hook-form";
import {z} from "zod";
import {
  ComponentType,
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useState
} from "react";
import {Entity} from "@/lib/crud.ts";
import {
  CrudSchema,
  Schema
} from "@/components/crud/crud-common.ts";
import {Button} from "@/components/ui/button.tsx";
import {
  LoaderCircle,
  SaveIcon,
  TrashIcon
} from "lucide-react";
import {
  introspect,
  extractProblemDetails,
  ValidationError
} from "@/lib/errors.ts";
import {zodResolver} from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog.tsx";
import {Form} from "@/components/ui/form.tsx";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx";
import {useToast} from "@/hooks/use-toast.ts";

export type UseFormReturnWithSchema<Dto> = UseFormReturn<Schema<Dto>>;

export type FormComponentProps<TData, Dto, Extensions = {}> = {
  form: UseFormReturnWithSchema<Dto>,
  entity?: TData;
} & Extensions;


export interface FormConfig<TData, Dto> {
  schema: CrudSchema<Dto>,
  defaultValues: DefaultValues<Schema<Dto>>,
  FormComponent: ComponentType<FormComponentProps<TData, Dto>>,
}

interface BaseFormProps {
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>,
  onSuccess?: () => void,
  onCancel?: () => void,
  onCloseErrorDialog?: () => void,
  title?: ReactNode,
  description?: ReactNode,
  toastAction?: { title: string, description: string },
}

interface BaseFormPropsMutate<TData, Dto> extends Omit<BaseFormProps, 'onSuccess'> {
  form: FormConfig<TData, Dto>,
  onSuccess?: (entity: TData) => void,
}

interface CommonFormProps<TData, Dto> extends BaseFormPropsMutate<TData, Dto> {
  onSubmitAction: (data: Dto) => Promise<TData>,
  entity?: TData,
}

export interface CreateFormProps<TData, Dto> extends BaseFormPropsMutate<TData, Dto> {
  create: (data: Dto) => Promise<TData>,
}

export interface UpdateFormProps<TData extends Entity<ID>, Dto, ID> extends BaseFormPropsMutate<TData, Dto> {
  entity: TData,
  update: (id: ID, data: Dto) => Promise<TData>,
}

export async function dispatchSubmitAction(form: UseFormReturn<any>, action: () => Promise<void>) {
  try {
    await action();
  } catch (error) {
    const problemDetails = extractProblemDetails(error);
    
    if (problemDetails) {
      if ('errors' in problemDetails) {
        const errors = problemDetails.errors as ValidationError[];
        for (const error of errors) {
          const field = error.field.replace("update.dto.", "").replace("create.dto.", "");
          const message = error.messages.join(', ')
          console.log(field, message);
          form.setError(field, {message});
        }
        return;
      }
      form.setError("root.requestError", {
        type: problemDetails.title,
        message: problemDetails.detail,
      });
    }
  }
}

function CommonForm<TData, Dto>(
  {
    open,
    setOpen,
    title,
    description,
    onSubmitAction,
    onSuccess,
    onCloseErrorDialog,
    form: {
      schema,
      defaultValues,
      FormComponent,
    },
    entity,
    toastAction,
    onCancel,
  }: Readonly<CommonFormProps<TData, Dto>>
) {
  
  
  const {toast} = useToast();
  const [loading, setLoading] = useState(false);
  
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues,
  });
  
  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form, open]);
  
  async function onSubmit(values: Schema<Dto>) {
    console.log(values);
    setLoading(true);
    try {
      await dispatchSubmitAction(form, async () => {
        const result = await onSubmitAction(values as Dto);
        onSuccess?.(result);
        setOpen(false);
        toastAction && toast(toastAction);
      });
    } finally {
      setLoading(false);
    }
  }
  
  const onOpenChange = (open: boolean) => {
    if (loading) return;
    setOpen(open);
    onCancel?.();
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent
        className="max-w-[80vw] max-h-[80vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
            <RequestErrorFormAlertDialog
              form={form}
              onClose={onCloseErrorDialog}
            />
            <DialogHeader className="mb-5">
              <DialogTitle className="text-2xl font-bold">
                {title}
              </DialogTitle>
              <DialogDescription>
                {description}
              </DialogDescription>
            </DialogHeader>
            
            <FormComponent form={form} entity={entity}/>
            
            <DialogFooter className="justify-end mt-4">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-3 sm:mt-0"
                >
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">
                {loading ? <LoaderCircle className="animate-spin"/> : <SaveIcon/>}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      
      </DialogContent>
    </Dialog>
  );
}

export function CreateForm<TData, Dto>(
  {
    create,
    title,
    description,
    toastAction,
    ...props
  }: Readonly<CreateFormProps<TData, Dto>>
) {
  return (
    <CommonForm
      title={title || "Crear"}
      description={description || "Ingresa los datos del nuevo registro"}
      onSubmitAction={create}
      toastAction={toastAction || {
        title: "Registro creado",
        description: "El registro se ha creado correctamente"
      }}
      {...props}
    />
  );
}


export function UpdateForm<TData extends Entity<ID>, Dto, ID>(
  {
    entity,
    update,
    title,
    description,
    toastAction,
    ...props
  }: Readonly<UpdateFormProps<TData, Dto, ID>>
) {
  
  return (
    <CommonForm
      title={title || "Editar"}
      description={description || "Modifica los datos del registro"}
      onSubmitAction={(data) => update(entity.id, data)}
      entity={entity}
      toastAction={toastAction || {
        title: "Registro actualizado",
        description: "El registro se ha actualizado correctamente"
      }}
      {...props}
    />
  );
}


interface DeleteFormProps<TData extends Entity<ID>, ID> extends BaseFormProps {
  entity?: TData,
  delete: (id: ID) => Promise<void>,
}

export function DeleteForm<TData extends Entity<ID>, ID>(
  {
    open,
    setOpen,
    onSuccess,
    onCloseErrorDialog,
    entity,
    title,
    description,
    toastAction,
    delete: deleteFn,
  }: Readonly<DeleteFormProps<TData, ID>>
) {
  
  const {toast} = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GlobalError | undefined>();
  
  const deleteHandle = async () => {
    
    if (!entity) {
      console.warn("Entity is undefined");
      return;
    }
    
    setLoading(true);
    
    try {
      await deleteFn(entity.id);
      onSuccess?.();
      setOpen(false);
      toast(toastAction || {title: "Registro eliminado", description: "El registro se ha eliminado correctamente"});
    } catch (error) {
      const err = introspect(error);
      setError({type: err.title, message: err.description});
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <>
      <ErrorAlertDialog
        error={error}
        crearError={() => setError(undefined)}
        onClose={onCloseErrorDialog}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {title || "Eliminar"}
            </DialogTitle>
            <DialogDescription>
              {description || "¿Seguro que deseas eliminar este registro? Esta acción no se puede deshacer."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="justify-end mt-4">
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                onClick={() => document.body.style.removeProperty('pointer-events')}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button onClick={deleteHandle}>
              {loading ? <LoaderCircle className="animate-spin"/> : <TrashIcon/>}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


export function RequestErrorFormAlertDialog({form, onClose}: Readonly<{ form: UseFormReturn<any>, onClose?: () => void }>) {
  
  const requestError = form.formState.errors.root?.["requestError"];
  return (
    <ErrorAlertDialog
      error={requestError}
      crearError={() => form.clearErrors("root.requestError")}
      onClose={onClose}
    />
  );
}

interface ErrorAlertDialogProps {
  error?: GlobalError,
  crearError: () => void,
  onClose?: () => void,
}


export function ErrorAlertDialog({error, crearError, onClose}: Readonly<ErrorAlertDialogProps>) {
  return (
    <AlertDialog
      open={!!error}
      onOpenChange={(open) => {
        if (!open) {
          crearError();
        }
        onClose?.();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Error</AlertDialogTitle>
          <AlertDialogDescription>
            {error?.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            Aceptar
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
