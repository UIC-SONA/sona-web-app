import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail, useSidebar,
} from "@/components/ui/sidebar.tsx";
import {
  Link,
  useParams
} from "react-router";
import {
  ArrowBigLeft,
  LoaderCircle,
  MessageCircleMore,
  MessageSquare,
  SendHorizonal
} from "lucide-react";
import {
  ChatProvider,
  Room,
  SendMessage,
  useChat,
  useChatRoom
} from "@/context/chat-context.tsx";
import {
  ChatMessageType,
  ChatRoomType
} from "@/services/chat-service.ts";
import {useAuth} from "@/context/auth-context.tsx";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar.tsx";
import {
  User,
  userService
} from "@/services/user-service.ts";
import {ThemeToggle} from "@/components/theme-toggle.tsx";
import {Button} from "@/components/ui/button.tsx";
import ChatTopBar from "@/components/chat/chat-top-bar.tsx";
import ChatListLayout from "@/components/chat/chat-list-layout.tsx";
import {StompProvider} from "@/context/stomp-context.tsx";
import {
  useEffect,
  useState
} from "react";
import {cn} from "@/lib/utils.ts";
import {ExpandableChatHeader} from "@/components/chat/expandable-chat.tsx";
import {ChatInput} from "@/components/chat/chat-input.tsx";
import {useIsMobile} from "@/hooks/use-mobile.ts";

const stompUri = import.meta.env.VITE_STOMP_URI as string;


export default function ChatPage() {

  const {id}: { id?: string } = useParams();
  const {user} = useAuth();

  if (!user) {
    return null;
  }


  return <StompProvider url={stompUri}>
    <ChatProvider user={user}>
      <SidebarProvider>
        <ChatSidebar
          roomId={id}
          user={user}
        />
        <SidebarInset className="overflow-hidden">
          <div className="absolute top-4 right-4 z-40">
            <ThemeToggle/>
          </div>
          {id ? <ChatContent roomId={id} user={user}/> : (
            <div className="flex items-center justify-center h-full flex-col">
              <p className="text-2xl font-bold">
                Selecciona una conversación
              </p>
              <MessageSquare className="w-16 h-16 ml-4 mt-4"/>
            </div>
          )}
        </SidebarInset>
      </SidebarProvider>
    </ChatProvider>
  </StompProvider>

}

function ChatContent({roomId, user}: Readonly<{ roomId: string, user?: User }>) {

  const {room, messages, loadingMessages, sendMessage, readMessages} = useChatRoom(roomId);

  useEffect(() => {
    if (loadingMessages || messages.length === 0) return;
    readMessages().then();
  }, [roomId, loadingMessages, messages]);

  if (loadingMessages) {
    return <div className="flex items-center justify-center h-32 flex-col">
      <LoaderCircle className="w-8 h-8 animate-spin"/>
      <p>Cargando...</p>
    </div>
  }

  const chatInfo = resolveChatInfo(room, user);

  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 z-10 bg-sidebar">
        <ExpandableChatHeader>
          <ChatTopBar
            avatar={chatInfo.avatar}
            fallback={chatInfo.fallback}
            roomName={chatInfo.roomName}
          />
        </ExpandableChatHeader>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ChatListLayout
          participans={room.participants}
          messages={messages}
          isMe={(senderId) => senderId === user?.id}
        />
      </div>

      <div className="sticky bottom-0 z-10">
        <ChatBottomBar
          sendMessage={sendMessage}
        />
      </div>
    </div>
  );
}


function ChatBottomBar({sendMessage}: Readonly<{ sendMessage: SendMessage }>) {
  const [message, setMessage] = useState("");

  return <div className="bg-sidebar p-4 flex items-center space-x-2">
    <ChatInput
      value={message}
      onChange={(e) => setMessage(e.target.value)}
    />
    <Button
      onClick={() => {
        sendMessage(message, ChatMessageType.TEXT).then();
        setMessage("");
      }}
    >
      Enviar
      <SendHorizonal/>
    </Button>
  </div>
}


function ChatSidebar({roomId, user}: Readonly<{ roomId?: string, user: User }>) {

  return <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <div className="flex items-center">
          <SidebarMenuItem className="mr-2">
            <SidebarMenuButton
              size="default"
            >
              <MessageSquare/>
              <p className="text-lg font-bold">
                Mensajes
              </p>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </div>
      </SidebarMenu>
    </SidebarHeader>
    <ChatSidebarContent
      roomId={roomId}
      user={user}
    />
    <SidebarFooter>
      <Link to="/">
        <SidebarMenuButton size="default">
          <ArrowBigLeft/>
          <span className="ml-2">Volver</span>
        </SidebarMenuButton>
      </Link>
    </SidebarFooter>
    <SidebarRail/>
  </Sidebar>
}

function ChatSidebarContent({roomId, user}: Readonly<{ roomId?: string, user: User }>) {

  const {rooms, loadingChat} = useChat();
  const {toggleSidebar} = useSidebar();
  const isMobile = useIsMobile();

  return <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>
        Conversaciones
      </SidebarGroupLabel>
      <SidebarMenu>
        {loadingChat && <div className="flex items-center justify-center h-32 flex-col">
            <LoaderCircle className="w-8 h-8 animate-spin"/>
            <p>Cargando...</p>
        </div>}
        {rooms.map((room) => {

          const {lastMessage} = room;

          const hasRead = lastMessage.sentBy.id === user.id
            || lastMessage
              .readBy
              .map(readBy => readBy.participant.id).includes(user.id);

          return (
            <SidebarMenuItem
              key={room.id}
            >
              <Link to={`/chat/${room.id}`} onClick={() => {
                if (isMobile) {
                  toggleSidebar();
                }
              }}>
                <SidebarMenuButton
                  size="lg"
                  className={cn("data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                    roomId === room.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                  )}
                >
                  <ChatPreviewMenu room={room}/>
                  {hasRead ? <></> : <MessageCircleMore className="w-4 h-4"/>}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  </SidebarContent>;
}

interface ChatInfo {
  roomName: string
  avatar?: string
  fallback: string
}

function resolveChatInfo(room: Room, user?: User): ChatInfo {

  if (room.type === ChatRoomType.PRIVATE) {
    const participant = room.participants.find(participant => participant.id !== user?.id);

    if (!participant) {
      return {
        roomName: "Desconocido",
        fallback: "D"
      }
    }

    return {
      roomName: participant.firstName + " " + participant.lastName,
      avatar: userService.profilePicturePath(participant.id),
      fallback: participant.firstName[0] || "D"
    }
  }

  return {
    roomName: room.name,
    fallback: room.name[0]
  }

}

interface ChatMessageListProps {
  room: Room
}

function ChatPreviewMenu({room}: Readonly<ChatMessageListProps>) {

  const {user} = useAuth();
  const {avatar, roomName, fallback} = resolveChatInfo(room, user);

  return <>
    <Avatar className="h-8 w-8 data-[state=close]:h-3 data-[state=close]:w-3">
      <AvatarImage src={avatar} alt="Avatar"/>
      <AvatarFallback className="rounded-lg font-bold">
        {fallback.toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-semibold">{roomName}</span>
      <span className="truncate text-xs">{room.lastMessage.message}</span>
    </div>
  </>
}
