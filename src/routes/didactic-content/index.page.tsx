import {
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
import {
  FormComponentProps
} from "@/components/crud/crud-forms.tsx";
import CrudTable, {FormFactory, TableFactory} from "@/components/crud/crud-table.tsx";
import {
  DidaticContent,
  DidaticContentDto,
  didacticContentService,
} from "@/services/didactic-content-service.ts";
import {useAuth} from "@/context/auth-context.tsx";
import {ExportScheme} from "@/lib/crud.ts";

export default function DidacticContentPage() {
  
  const {authenticated} = useAuth();
  if (!authenticated) return null;
  
  const table: TableFactory<DidaticContent, string> = {
    columns: [
      {
        header: "Título",
        accessorKey: "title",
        enableSorting: true,
      },
      {
        header: "Descripción",
        accessorKey: "description",
        enableSorting: true,
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
            fetcher={() => didacticContentService.getImage(row.original.id)}
            alt={row.original.title}
          />
        },
      },
    ],
  };
  
  const form: FormFactory<DidaticContent, DidaticContentDto, string> = {
    update: {
      schema: z.object({
        title: z.string().nonempty("El título es requerido"),
        content: z.string().nonempty("El contenido es requerido"),
        image: z.instanceof(File).optional(),
      }),
      defaultValues: (data: DidaticContent) => {
        return {
          title: data.title,
          content: data.content,
        };
      }
    },
    create: {
      schema: z.object({
        title: z.string().nonempty("El título es requerido"),
        content: z.string().nonempty("El contenido es requerido"),
        image: z.instanceof(File),
      }),
      defaultValues: {
        title: "",
        content: "",
      }
    },
    FormComponent,
  };
  
  const exportScheme: ExportScheme = {
    fields: ["title", "content"],
    titles: ["Título", "Contenido"],
  }
  return (
    <BreadcrumbSubLayout items={["Contenido Didáctico"]}>
      <CrudTable<DidaticContent, DidaticContentDto, string>
        title={"Contenido Didáctico"}
        operations={didacticContentService}
        table={table}
        form={form}
        exportScheme={exportScheme}
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
          const {value, onChange, ...props} = field;
          return (
            <FormItem
              className="sm:col-span-2 lg:col-span-4 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
              <div className="flex flex-col w-full space-y-2">
                <FormLabel>Imagen</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    onChange={(e) => {
                      onChange(e.target.files?.[0]);
                    }}
                    {...props}
                  />
                </FormControl>
              </div>
              <FormMessage/>
              <div className="mt-4">
                {entity && !value &&
                  <LoadingImage fetcher={() => didacticContentService.getImage(entity.id)}
                                alt={entity.title}/>}
                {value && <img src={URL.createObjectURL(value)} alt="Preview"/>}
              </div>
            </FormItem>
          );
        }}
      />
    </div>
  );
}