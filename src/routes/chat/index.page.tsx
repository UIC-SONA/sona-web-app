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
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar.tsx";
import {
  Link,
  useParams
} from "react-router";
import {
  ArrowBigLeft,
  ArrowBigRight,
  Image,
  LoaderCircle,
  Menu,
  MessageCircleMore,
  MessageSquare,
  SendHorizontal
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
import ChatMessageListGenerator from "@/components/chat/chat-message-list-generator.tsx";
import {StompProvider} from "@/context/stomp-context.tsx";
import {
  useEffect, useRef,
  useState
} from "react";
import {cn} from "@/lib/utils.ts";
import {ExpandableChatHeader} from "@/components/chat/expandable-chat.tsx";
import {ChatInput} from "@/components/chat/chat-input.tsx";
import {useIsMobile} from "@/hooks/use-mobile.ts";
import {Skeleton} from "@/components/ui/skeleton.tsx";

const stompUri = import.meta.env.VITE_STOMP_URI as string;


export default function ChatPage() {

  const {id}: { id?: string } = useParams();
  const {user} = useAuth();

  if (!user) {
    return null;
  }

  useEffect(() => {
    document.body.style.pointerEvents = "";
  }, []);

  return <StompProvider url={stompUri}>
    <ChatProvider user={user}>
      <SidebarProvider>
        <ChatSidebar
          roomId={id}
          user={user}
        />
        <SidebarInset className="overflow-hidden">
          <ChatSidebarTrigger/>
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

function ChatSidebarTrigger() {
  const {toggleSidebar, open} = useSidebar();
  const isMobile = useIsMobile();

  return <div className="absolute top-[50%] left-0 transform -translate-y-1/2 z-40">
    {isMobile
      ? <Button
        variant="outline"
        size="icon"
        onClick={toggleSidebar}
      >
        <Menu/>
      </Button>

      : <Button
        variant="outline"
        size="icon"
        onClick={toggleSidebar}
        className="rounded-r-full border-l-0"
      >
        {open ? <ArrowBigLeft/> : <ArrowBigRight/>}
      </Button>
    }
  </div>
}

function ChatContent({roomId, user}: Readonly<{ roomId: string, user?: User }>) {

  const {loading, room, messages, loadingMessages, sendMessage} = useChatRoom(roomId);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <LoaderCircle className="w-8 h-8 animate-spin"/>
      <p>Cargando...</p>
    </div>
  }

  if (!room) {
    return <div className="flex items-center justify-center h-screen">
      <p>Conversación no encontrada</p>
    </div>
  }

  return (
    <div className="flex flex-col h-screen">

      <div className="sticky top-0 z-10 bg-sidebar">
        <ExpandableChatHeader>
          <ChatTopBar {...resolveChatInfo(room, user)}/>
        </ExpandableChatHeader>
      </div>

      {loadingMessages ? <div className="flex items-center justify-center h-32 flex-col">
        <LoaderCircle className="w-8 h-8 animate-spin"/>
        <p>Cargando...</p>
      </div> : <>
        <div className="flex-1 overflow-y-auto">
          <ChatMessageListGenerator
            participans={room.participants}
            messages={messages}
            isMe={(senderId) => senderId === user?.id}
          />
        </div>

        <div className="sticky bottom-0 z-10">
          <ChatBottomBar sendMessage={sendMessage}/>
        </div>
      </>}
    </div>
  );
}


const ChatBottomBar = ({sendMessage}: Readonly<{ sendMessage: SendMessage }>) => {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sendMessage(file, ChatMessageType.IMAGE);
    }
  };

  return (
    <div className="bg-sidebar p-4 flex items-center space-x-2">
      <ChatInput
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Escribe un mensaje..."
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <Button
        variant="outline"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
      >
        <Image className="h-4 w-4"/>
      </Button>
      <Button
        onClick={() => {
          if (message.trim()) {
            sendMessage(message, ChatMessageType.TEXT);
            setMessage("");
          }
        }}
      >
        Enviar
        <SendHorizontal className="ml-2 h-4 w-4"/>
      </Button>
    </div>
  );
};


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

  const {rooms, loading} = useChat();
  const {toggleSidebar} = useSidebar();
  const isMobile = useIsMobile();

  return <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>
        Conversaciones
      </SidebarGroupLabel>
      <SidebarMenu>
        {loading && <div>
          {[...Array(10).keys()].map((i) => <ChatRoomSckeleton key={i}/>)}
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

function resolveChatInfo(room: Room, user?: User): { roomName: string, avatar?: string, fallback: string } {

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
      avatar: participant.hasProfilePicture ? userService.profilePicturePath(participant.id) : undefined,
      fallback: participant.firstName[0] || "D"
    }
  }

  return {
    roomName: room.name,
    fallback: room.name[0]
  }

}

interface ChatPreviewMenuProps {
  room: Room
}

function ChatPreviewMenu({room}: Readonly<ChatPreviewMenuProps>) {

  const {user} = useAuth();
  const {avatar, roomName, fallback} = resolveChatInfo(room, user);

  const lastMessage = room.lastMessage;
  const lastMessagePreview = {
    [ChatMessageType.IMAGE]: "Imagen",
    [ChatMessageType.VOICE]: "Audio",
    [ChatMessageType.TEXT]: lastMessage.message,
    [ChatMessageType.CUSTOM]: "..."
  }[lastMessage.type];

  return <>
    <Avatar className="h-8 w-8 data-[state=close]:h-3 data-[state=close]:w-3">
      <AvatarImage src={avatar} alt="Avatar"/>
      <AvatarFallback className="rounded-lg font-bold">
        {fallback.toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-semibold">{roomName}</span>
      <span className="truncate text-xs">{lastMessagePreview}</span>
    </div>
  </>
}

function ChatRoomSckeleton() {
  return <SidebarMenuItem>
    <SidebarMenuButton
      size="lg"
      className={cn("data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground")}
    >
      <div className="flex items-center space-x-4">
        <Skeleton className="h-8 w-8 rounded-full"/>
        <div className="space-y-2">
          <Skeleton className="h-2 w-[150px]"/>
          <Skeleton className="h-2 w-[150px]"/>
        </div>
      </div>
    </SidebarMenuButton>
  </SidebarMenuItem>
}

