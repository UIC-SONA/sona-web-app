import UserBasePage from "./user-base.page.tsx";


export default function UserPage() {
  return (
    <UserBasePage
      breadcrumbs={["Usuarios"]}
      title={"Usuarios"}
    />
  );
}