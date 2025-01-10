import {
  Appointment,
  appointmentsService
} from "@/services/appointments-service.ts";
import {getPeriod} from "@/lib/utils.ts";
import {format} from "date-fns";
import {es} from "date-fns/locale/es";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {UserIcon} from "lucide-react";

interface AppointmentViewProps {
  appointment?: Appointment;
  onClose: () => void;
}

export default function AppointmentView({appointment, onClose}: Readonly<AppointmentViewProps>) {
  const period = getPeriod(appointment?.hour);
  const formattedDate = appointment ? format(appointment.date, "EEEE d 'de' MMMM 'de' yyyy", {locale: es}) : '';
  const formattedHour = appointment ? `${appointment.hour} ${period}` : '';

  return (
    <Dialog open={!!appointment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-lg shadow-lg">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex justify-start items-center text-lg font-semibold">
            <span>Detalles de la Cita</span>
            {appointment?.canceled && (
              <Badge variant="destructive" className="text-xs ml-2">
                Cancelada
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        {appointment && (
          <div className="grid gap-6">
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Fecha y Hora</h4>
              <p className="text-sm">{formattedDate} - {formattedHour}</p>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Tipo de Cita</h4>
              <p className="text-sm">{appointmentsService.getAppointmentTypeName(appointment.type)}</p>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Profesional</h4>
              <div className="flex items-center gap-2 text-sm">
                <UserIcon size={16}/>
                <span>{appointment.professional.firstName + ' ' + appointment.professional.lastName}</span>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Paciente</h4>
              <div className="flex items-center gap-2 text-sm">
                <UserIcon size={16}/>
                <span>{appointment.attendant.firstName + ' ' + appointment.attendant.lastName}</span>
              </div>
            </div>

            {appointment.canceled && appointment.cancellationReason && (
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">Motivo de Cancelación</h4>
                <p className="text-sm">{appointment.cancellationReason}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}