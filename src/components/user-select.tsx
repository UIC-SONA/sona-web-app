import {ComboboxRemote} from "@/components/ui/combobox.tsx";
import {User, userService, UserFilter} from "@/services/user-service.ts";

interface UserSelectProps {
  value?: User;
  onSelect: (user?: User) => void;
  selectItemText: string;
  searchPlaceholder: string;
  filters?: UserFilter;
}

export default function UserSelect(
  {
    value,
    onSelect,
    selectItemText,
    searchPlaceholder,
    filters
  }: Readonly<UserSelectProps>
) {
  return (
    <ComboboxRemote<User>
      unselect
      selectItemText={selectItemText}
      searchPlaceholder={searchPlaceholder}
      className="w-full"
      value={value}
      
      fetchItems={async (search) => {
        const users = await userService.page({
          search,
          page: 0,
          size: 15,
          filters: filters
        });
        return users.content;
      }}
      
      comboboxItem={(user) => ({
        value: user.id.toString(),
        label: `${user.firstName} ${user.lastName}`
      })}
      onSelect={onSelect}
    />
  );
};
