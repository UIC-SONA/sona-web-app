import {Authority} from "@/services/user-service.ts";
import UserBasePage from "@/routes/users/user-base.page.tsx";


export default function ProfessionalPage() {
  return (
    <UserBasePage
      authorities={[Authority.LEGAL_PROFESSIONAL, Authority.MEDICAL_PROFESSIONAL]}
      breadcrumbs={["Profesionales", "Gestión"]}
      title={"Profesionales"}
    />
  );
}