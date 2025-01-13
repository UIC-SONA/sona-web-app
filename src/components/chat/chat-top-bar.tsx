import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar.tsx";
import {useSidebar} from "@/components/ui/sidebar.tsx";


export interface ChatTopBarProps {
  avatar?: string;
  fallback: string;
  roomName: string;
}

export default function ChatTopBar({avatar, fallback, roomName}: Readonly<ChatTopBarProps>) {

  const {toggleSidebar} = useSidebar()

  return <div className="flex items-center gap-2">
    <Avatar
      className="flex justify-center items-center"
      onClick={toggleSidebar}
    >
      <AvatarImage
        src={avatar}
        alt={roomName}
        width={6}
        height={6}
        className="w-10 h-10 "
      />
      <AvatarFallback className="font-bold ">
        {fallback.toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <div className="flex flex-col">
      <span className="font-medium text-lg">
        {roomName}
      </span>
    </div>
  </div>
}
