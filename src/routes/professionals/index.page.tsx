import {userService} from "@/services/user-service.ts";
import UserBasePage from "@/routes/users/user-base.page.tsx";


export default function ProfessionalPage() {
  return (
    <UserBasePage
      authorities={userService.professionalAuthorities}
      breadcrumbs={["Profesionales", "Gestión"]}
      title={"Profesionales"}
    />
  );
}