import UserBasePage from "@/pages/user-base.page.tsx";
import {Authority} from "@/services/user-service.ts";


export default function ProfessionalPage() {
  return (
    <UserBasePage
      authorities={[Authority.LEGAL_PROFESSIONAL, Authority.MEDICAL_PROFESSIONAL]}
      breadcrumbs={["Profesionales", "Gestión"]}
      title={"Profesionales"}
    />
  );
}