import {
  DefaultValues, FieldPath, useForm,
  UseFormReturn
} from "react-hook-form";
import {z} from "zod";
import {Dispatch, ReactNode, SetStateAction, useEffect, useMemo, useState} from "react";
import {Entity} from "@/lib/crud.ts";
import {CrudSchema} from "@/components/crud/crud-common.ts";
import {Button} from "@/components/ui/button.tsx";
import {
  Loader2,
  SaveIcon,
  TrashIcon
} from "lucide-react";
import {
  ErrorTitle,
  extractError,
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
import {isAxiosError} from "axios";

type FormAction = "create" | "update";

type RenderForm<TData, Dto> = (form: UseFormReturn<z.infer<CrudSchema<Dto>>>, entity?: TData) => ReactNode;

export interface FormDef<TData extends Entity<ID>, Dto, ID> {
  schema: (formAction: FormAction) => CrudSchema<Dto>,
  renderForm: RenderForm<TData, Dto>,
  getDefaultValue: (data: TData) => DefaultValues<z.infer<CrudSchema<Dto>>>,
}

interface BaseFormProps {
  isOpen: boolean,
  setIsOpen: Dispatch<SetStateAction<boolean>>,
  reload: () => void,
}

interface CommonFormProps<TData extends Entity<ID>, Dto, ID> extends BaseFormProps {
  title: ReactNode,
  description: ReactNode,
  onSubmitAction: (data: Dto) => Promise<TData>,
  form: UseFormReturn<z.infer<CrudSchema<Dto>>>,
  renderForm: RenderForm<TData, Dto>,
}

function CommonForm<TData extends Entity<ID>, Dto, ID>(
  {
    isOpen,
    setIsOpen,
    reload,
    title,
    description,
    onSubmitAction,
    form,
    renderForm,
  }: Readonly<CommonFormProps<TData, Dto, ID>>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorTitle | null>(null);

  async function onSubmit(values: z.infer<CrudSchema<Dto>>) {
    console.log(values);
    setLoading(true);
    try {
      await onSubmitAction(values as Dto);
      reload();
      setIsOpen(false);
    } catch (error) {
      if (isAxiosError(error)) {
        console.log(error.response);
      }
      const problemDetails = extractProblemDetails(error);

      if (problemDetails) {
        if ('errors' in problemDetails) {
          const errors = problemDetails.errors as ValidationError[];
          for (const error of errors) {
            const field = error.field.replace("update.dto.", "") as FieldPath<z.infer<CrudSchema<Dto>>>
            const message = error.messages.join(', ')
            console.log(field, message);
            form.setError(field, {message});
          }
          return;
        }
        setError({title: problemDetails.title, description: problemDetails.detail});
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ErrorAlertDialog error={error} onClear={() => setError(null)}/>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="max-w-[80vw] max-h-[80vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader className="mb-5">
                <DialogTitle className="text-2xl font-bold">
                  {title}
                </DialogTitle>
                <DialogDescription>
                  {description}
                </DialogDescription>
              </DialogHeader>
              {renderForm(form)}
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
                  {loading ? <Loader2 className="animate-spin"/> : <SaveIcon/>}
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface BaseFormPropsWithDef<TData extends Entity<ID>, Dto, ID> extends BaseFormProps {
  form: FormDef<TData, Dto, ID>,
}

export interface CreateFormProps<TData extends Entity<ID>, Dto, ID> extends BaseFormPropsWithDef<TData, Dto, ID> {
  create: (data: Dto) => Promise<TData>,
}

export function CreateForm<TData extends Entity<ID>, Dto, ID>(
  {
    isOpen,
    setIsOpen,
    reload,
    create,
    form: {
      schema,
      renderForm,
    },
  }: Readonly<CreateFormProps<TData, Dto, ID>>
) {
  const zodObject = useMemo(() => schema("create"), [schema]);
  const form = useForm<z.infer<typeof zodObject>>({
    resolver: zodResolver(zodObject),
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [form, isOpen]);

  return (
    <CommonForm
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      reload={reload}
      title="Crear"
      description="Ingresa los datos del nuevo registro"
      onSubmitAction={create}
      form={form}
      renderForm={renderForm}
    />
  );
}


interface UpdateFormProps<TData extends Entity<ID>, Dto, ID> extends BaseFormPropsWithDef<TData, Dto, ID> {
  entity: TData,
  update: (id: ID, data: Dto) => Promise<TData>,
}

export function UpdateForm<TData extends Entity<ID>, Dto, ID>(
  {
    isOpen,
    setIsOpen,
    reload,
    entity,
    update,
    form: {
      schema,
      renderForm,
      getDefaultValue
    },
  }: Readonly<UpdateFormProps<TData, Dto, ID>>
) {

  const defaultValues = useMemo(() => getDefaultValue(entity), [entity, getDefaultValue]);
  const zodObject = useMemo(() => schema("update"), [schema]);
  const form: UseFormReturn<z.infer<CrudSchema<Dto>>> = useForm<z.infer<typeof zodObject>>({
    resolver: zodResolver(zodObject),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form, isOpen]);

  return (
    <CommonForm
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      reload={reload}
      title="Editar"
      description="Modifica los datos del registro"
      onSubmitAction={(data) => update(entity.id, data)}
      form={form}
      renderForm={(form) => renderForm(form, entity)}
    />
  );
}

interface DeleteFormProps<TData extends Entity<ID>, ID> extends BaseFormProps {
  entity: TData,
  delete: (id: ID) => Promise<void>,
}

export function DeleteForm<TData extends Entity<ID>, ID>(
  {
    isOpen,
    setIsOpen,
    reload,
    entity,
    delete: delete_,
  }: Readonly<DeleteFormProps<TData, ID>>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorTitle | null>(null);

  function deleteHandle() {
    setLoading(true);
    delete_(entity.id)
      .then(() => {
        reload();
        setIsOpen(false);
      })
      .catch((error) => {
        const err = extractError(error);
        setError(err);
      })
  }

  return (
    <>
      <ErrorAlertDialog error={error} onClear={() => setError(null)}/>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar</DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas eliminar este registro? Esta acción no se puede deshacer.
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
              {loading ? <Loader2 className="animate-spin"/> : <TrashIcon/>}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ErrorAlertDialogProps {
  error: ErrorTitle | null,
  onClear: () => void,
}

function ErrorAlertDialog({error, onClear}: Readonly<ErrorAlertDialogProps>) {
  return (
    <AlertDialog open={error !== null} onOpenChange={(open) => !open && onClear()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Error</AlertDialogTitle>
          <AlertDialogDescription>
            {error?.description}
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