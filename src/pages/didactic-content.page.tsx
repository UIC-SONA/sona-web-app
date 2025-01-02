import {ColumnDef} from "@tanstack/react-table";
import {
  ClickToShowUUID,
  LoadingImage,
  OpenImageModal,
  Truncate
} from "@/components/utils-componentes.tsx";
import BreadcrumbSubLayout from "@/layout/breadcrumb-sub-layout.tsx";
import {z} from "zod";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import {FormComponentProps, FormDefFactory} from "@/components/crud/crud-forms.tsx";
import CrudTable from "@/components/crud/crud-table.tsx";
import {
  didacticContentImage,
  DidaticContent,
  DidaticContentDto,
  operationDidacticContent
} from "@/services/didactic-content-service.ts";
import {useAuth} from "@/context/auth-context.tsx";

const columns: ColumnDef<DidaticContent>[] = [
  {
    header: "Id",
    accessorKey: "id",
    enableSorting: true,
    cell: ({row}) => {
      return <ClickToShowUUID id={row.original.id}/>
    }
  },
  {
    header: "Título",
    accessorKey: "title",
    enableSorting: false,
  },
  {
    header: "Descripción",
    accessorKey: "description",
    enableSorting: false,
    cell: ({row}) => {
      return <Truncate text={row.original.content}/>
    }
  },
  {
    header: "Imagen",
    accessorKey: "image",
    cell: ({row}) => {
      return <OpenImageModal
        key={row.original.image}
        fetcher={() => didacticContentImage(row.original.id)}
        alt={row.original.title}
      />
    },
  },
];


const form: FormDefFactory<DidaticContent, DidaticContentDto, string> = {
  getSchema: formAction => {
    return z.object({
      title: z.string().nonempty("El título es requerido"),
      content: z.string().nonempty("El contenido es requerido"),
      image: formAction === "create" ? z.instanceof(File) : z.instanceof(File).optional(),
    });
  },
  FormComponent: FormComponent,
  getDefaultValues: (data?: DidaticContent) => {
    if (!data) {
      return {
        title: "",
        content: "",
      };
    }
    return {
      title: data.title,
      content: data.content,
    };
  },
};


export default function DidacticContentPage() {

  const {authenticated} = useAuth();
  if (!authenticated) return null;

  return (
    <BreadcrumbSubLayout items={["Contenido Didáctico"]}>
      <CrudTable<DidaticContent, DidaticContentDto, string>
        title={"Contenido Didáctico"}
        columns={columns}
        operations={operationDidacticContent}
        form={form}
      />
    </BreadcrumbSubLayout>
  );
}

function FormComponent({form, entity}: Readonly<FormComponentProps<DidaticContent, DidaticContentDto>>) {
  const {control} = form;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <FormField
        control={control}
        name="title"
        render={({field}) => (
          <FormItem className="lg:col-span-2">
            <FormLabel>Título</FormLabel>
            <FormControl>
              <Input placeholder="Título" {...field} />
            </FormControl>
            <FormMessage/>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="content"
        render={({field}) => {
          return (
            <FormItem className="sm:col-span-2 lg:col-span-4">
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Descripción" className="resize-y min-h-32" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          );
        }}
      />
      <FormField
        control={control}
        name="image"
        render={({field}) => {
          const {value, onChange, ...rest} = field;

          return (
            <FormItem className="sm:col-span-2 lg:col-span-4 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
              <div className="flex flex-col w-full space-y-2">
                <FormLabel>Imagen</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    onChange={(e) => {
                      onChange(e.target.files?.[0]);
                    }}
                    {...rest}
                  />
                </FormControl>
              </div>
              <FormMessage/>
              <div className="mt-4">
                {entity && !value && <LoadingImage fetcher={() => didacticContentImage(entity.id)} alt={entity.title}/>}
                {value && <img src={URL.createObjectURL(value)} alt="Preview"/>}
              </div>
            </FormItem>
          );
        }}
      />
    </div>
  );
}