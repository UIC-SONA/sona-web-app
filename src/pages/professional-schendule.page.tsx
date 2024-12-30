import {ColumnDef} from "@tanstack/react-table";
import BreadcrumbSubLayout from "@/layout/breadcrumb-sub-layout.tsx";
import {useAuth} from "@/hooks/use-auth.ts";
import {z} from "zod";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form.tsx";
import {Input} from "@/components/ui/input.tsx";
import {FormDef} from "@/components/crud/crud-forms.tsx";
import CrudTable from "@/components/crud/crud-table.tsx";
import {operationProfessionalSchedule, ProfessionalSchedule, ProfessionalScheduleDto} from "@/services/professional-schendule-service.ts";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover.tsx";
import {Calendar} from "@/components/ui/calendar.tsx";
import {pageProfessionals} from "@/services/user-service.ts";
import {Button} from "@/components/ui/button.tsx";
import {cn} from "@/lib/utils.ts";
import {CalendarIcon} from "lucide-react";
import {format} from "date-fns";
import {es} from 'date-fns/locale/es';
import SearchSelect from "@/components/ui/comand-search.tsx";

const columns: ColumnDef<ProfessionalSchedule>[] = [
  {
    header: "Id",
    accessorKey: "id",
  },
  {
    header: "Fecha",
    accessorKey: "date",
  },
  {
    header: "Desde",
    accessorKey: "fromHour",
  },
  {
    header: "Hasta",
    accessorKey: "toHour",
  },
];


const form: FormDef<ProfessionalSchedule, ProfessionalScheduleDto, number> = {
  schema: () => {
    return z.object({
      date: z.date(),
      fromHour: z.number().min(0).max(24),
      toHour: z.number().min(0).max(24),
      professionalId: z.number(),
    });
  },
  renderForm: (form, entity) => {
    const {control} = form;
    return (
      <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <FormField
          control={control}
          name="professionalId"
          render={({field}) => {
            return (
              <FormItem className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4">
                <FormLabel>Profesional</FormLabel>
                <SearchSelect
                  defaultSelected={entity?.professional}
                  onSelect={(professional) => {
                    field.onChange(professional?.id);
                  }}
                  searchFetch={async (search) => {
                    const professionals = await pageProfessionals({search, page: 0, size: 10});
                    return professionals.content;
                  }}
                  toOption={(professional) => ({
                    value: professional.id.toString(),
                    label: `${professional.representation.firstName} ${professional.representation.lastName}`,
                  })}
                  compare={(a, b) => a.id === b.id}
                  initialSearch={entity?.professional.representation.firstName}
                />
                <FormMessage/>
              </FormItem>
            );
          }}
        />
        <FormField
          control={control}
          name="date"
          render={({field}) => (
            <FormItem className="col-span-1 sm:col-span-2 md:col-span-1 lg:col-span-2">
              <FormLabel>Fecha</FormLabel>
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", {
                          locale: es
                        })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50"/>
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage/>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="fromHour"
          render={({field}) => (
            <FormItem className="col-span-1">
              <FormLabel>Hora de inicio</FormLabel>
              <FormControl>
                <Input inputMode="numeric" type="number" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="toHour"
          render={({field}) => {
            return (
              <FormItem className="col-span-1">
                <FormLabel>Hora de fin</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" type="number" {...field} />
                </FormControl>
                <FormMessage/>
              </FormItem>
            );
          }}
        />
      </div>
    );
  },
  getDefaultValue: (data: ProfessionalSchedule) => {
    console.log(data);
    return {
      date: new Date(data.date),
      toHour: data.toHour,
      fromHour: data.fromHour,
      professionalId: data.professional.id,
    };
  },
};


export default function ProfessionalSchedulePage() {

  const {authenticated} = useAuth();
  if (!authenticated) return null;


  return (
    <BreadcrumbSubLayout items={["Professionales", "Horarios de atención"]}>

      <SearchSelect
        searchFetch={async (search) => {
          const professionals = await pageProfessionals({search: search, page: 0, size: 10});
          return professionals.content;
        }}
        toOption={(professional) => ({
          value: professional.id.toString(),
          label: `${professional.representation.firstName} ${professional.representation.lastName}`,
        })}
        onSelect={(professional) => {
          console.log(professional);
        }}
        placeholder="Buscar profesional"
      />

      <CrudTable<ProfessionalSchedule, ProfessionalScheduleDto, number>
        title={"Horarios de atención"}
        columns={columns}
        operations={operationProfessionalSchedule}
        form={form}
      />
    </BreadcrumbSubLayout>
  );
}



