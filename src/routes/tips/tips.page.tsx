import {
    Tip,
    TipDto,
    tipsService
} from "@/services/tip-service.ts";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {
    ItemsOnRounded,
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
import MultipleSelector from "@/components/ui/multiple-selector.tsx";
import {Switch} from "@/components/ui/switch.tsx";
import {FormComponentProps} from "@/components/crud/crud-forms.tsx";
import CrudTable, {
    FormFactory,
    TableFactory
} from "@/components/crud/crud-table.tsx";
import {useAuth} from "@/context/auth-context.tsx";

export default function TipsPage() {

    const {authenticated} = useAuth();
    if (!authenticated) return null;


    const table: TableFactory<Tip, string> = {
        columns: [
            {
                header: "Título",
                accessorKey: "title",
                enableSorting: true,
            },
            {
                header: "Resumen",
                accessorKey: "summary",
                enableSorting: true,
                cell: ({row}) => {
                    return <Truncate text={row.original.summary}/>
                }
            },
            {
                header: "Descripción",
                accessorKey: "description",
                enableSorting: true,
                cell: ({row}) => {
                    return <Truncate text={row.original.description}/>
                }
            },
            {
                header: "Tags",
                accessorKey: "tags",
                enableSorting: false,
                cell: ({row}) => {
                    return <ItemsOnRounded items={row.original.tags}/>
                }
            },
            {
                header: "Activo",
                accessorKey: "active",
                enableSorting: true,
                cell: ({row}) => {
                    return <div className="flex items-center justify-center">
                        <Checkbox checked={row.original.active} disabled/>
                    </div>
                },
            },
            {
                header: "Calificación",
                accessorKey: "averageRate",
                enableSorting: true,
                cell: ({row}) => {
                    return row.original.averageRate.toFixed(2);
                }
            },
            {
                header: "Calificaciones",
                accessorKey: "totalRate",
                enableSorting: true,
                cell: ({row}) => {
                    return row.original.totalRate;
                }
            },
            {
                header: "Imagen",
                accessorKey: "image",
                enableSorting: false,
                cell: ({row}) => {
                    return <OpenImageModal fetcher={() => tipsService.getImage(row.original.id)}
                                           alt={row.original.title}/>
                },
            },
        ],
    }


    const form: FormFactory<Tip, TipDto, string> = {
        update: {
            schema: z.object({
                title: z.string().nonempty("El título es requerido"),
                summary: z.string().nonempty("El resumen es requerido"),
                description: z.string().nonempty("La descripción es requerida"),
                tags: z.array(z.string()).nonempty("Los tags son requeridos"),
                active: z.boolean(),
                image: z.instanceof(File).optional(),
            }),
            defaultValues: (data: Tip) => {
                return {
                    title: data.title,
                    summary: data.summary,
                    description: data.description,
                    tags: data.tags,
                    active: data.active,
                };
            },
        },
        create: {
            schema: z.object({
                title: z.string().nonempty("El título es requerido"),
                summary: z.string().nonempty("El resumen es requerido"),
                description: z.string().nonempty("La descripción es requerida"),
                tags: z.array(z.string()).nonempty("Los tags son requeridos"),
                active: z.boolean(),
                image: z.instanceof(File),
            }),
            defaultValues: {
                title: "",
                summary: "",
                description: "",
                tags: [],
                active: true,
            },
        },
        FormComponent: FormComponent,
    };

    return (
        <BreadcrumbSubLayout items={["Tips"]}>
            <CrudTable<Tip, TipDto, string>
                title="Tips"
                operations={tipsService}
                table={table}
                form={form}
            />
        </BreadcrumbSubLayout>
    );
}

function FormComponent({form, entity}: Readonly<FormComponentProps<Tip, TipDto>>) {
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
                name="summary"
                render={({field}) => {
                    return (
                        <FormItem className="lg:col-span-2">
                            <FormLabel>Resumen</FormLabel>
                            <FormControl>
                                <Input placeholder="Resumen" {...field} />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    );
                }}
            />
            <FormField
                control={control}
                defaultValue={false}
                name="active"
                render={({field}) => {
                    return (
                        <FormItem className="flex items-center space-x-3 sm:col-span-2 lg:col-span-4">
                            <FormLabel className="m-0">Activo</FormLabel>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    );
                }}
            />
            <FormField
                control={control}
                name="description"
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
                name="tags"
                render={({field}) => {
                    return (
                        <FormItem className="sm:col-span-2 lg:col-span-4">
                            <FormLabel>Tags</FormLabel>
                            <FormControl>
                                <MultipleSelector
                                    placeholder="Tags"
                                    creatable
                                    value={field.value?.map((tag) => ({label: tag, value: tag}))}
                                    onChange={(tags) => field.onChange(tags.map((tag) => tag.value))}
                                />
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
                                        {...rest}
                                    />
                                </FormControl>
                            </div>
                            <FormMessage/>
                            <div className="mt-4">
                                {entity && !value &&
                                    <LoadingImage fetcher={() => tipsService.getImage(entity.id)} alt={entity.title}/>}
                                {value && <img src={URL.createObjectURL(value)} alt="Preview"/>}
                            </div>
                        </FormItem>
                    );
                }}
            />
        </div>
    );
}