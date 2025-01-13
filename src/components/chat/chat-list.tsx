import {
  Message,
  StatusMessage
} from "@/context/chat-context.tsx";
import {
  User,
  userService
} from "@/services/user-service.ts";
import {ChatMessageList} from "@/components/ui/chat/chat-message-list.tsx";
import {AnimatePresence} from "framer-motion";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleTimestamp
} from "@/components/ui/chat/chat-bubble.tsx";
import {
  format,
  isToday,
  isYesterday
} from "date-fns";
import {es} from 'date-fns/locale';
import {
  Check, CheckCheck,
  CircleX,
  Clock
} from "lucide-react";

interface ChatListProps {
  messages: Message[];
  participans: User[];
  isMe: (senderId: number) => boolean;
}

export default function ChatList({messages, participans, isMe}: Readonly<ChatListProps>) {


  return <div className="w-full overflow-y-hidden h-full flex flex-col">
    <ChatMessageList>
      <AnimatePresence>
        {messages.map((message, index) => {

          const variant = isMe(message.sentBy.id) ? "sent" : "received";
          const otherParticipants = participans.filter(participant => !isMe(participant.id));
          const hasRead = message.readBy.length === otherParticipants.length;

          return <ChatBubble
            key={"Chat-" + index}
            variant={variant}
          >
            <ChatBubbleAvatar
              className="font-bold"
              src={userService.profilePicturePath(message.sentBy.id)}
              fallback={message.sentBy.firstName[0].toUpperCase() || "D"}
            />

            <ChatBubbleMessage
              variant={variant}
              className="p-2 text-sm"
            >
              {message.message}
              <div className="flex items-center justify-between space-x-2 mt-2">
                <ChatBubbleTimestamp
                  timestamp={getFormattedTime(message.createdAt)}
                />
                <ChatBubbleStatus
                  hasRead={hasRead}
                  status={message.status}
                />
              </div>
            </ChatBubbleMessage>
          </ChatBubble>
        })}
      </AnimatePresence>
    </ChatMessageList>
  </div>;
}


function ChatBubbleStatus({status, hasRead}: Readonly<{ status: StatusMessage, hasRead: boolean }>) {
  if (hasRead) {
    return <CheckCheck size={16}/>
  }
  if (status === StatusMessage.SENDING) {
    return <Clock size={16}/>
  }
  if (status === StatusMessage.DELIVERED) {
    return <Check size={16}/>
  }
  if (status === StatusMessage.UNDELIVERED) {
    return <CircleX size={16}/>
  }
  return <></>
}

const getFormattedTime = (date: Date) => {
  const now = new Date();
  let minutesAgo = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
  minutesAgo = minutesAgo < 0 ? 0 : minutesAgo;

  if (minutesAgo < 60) {
    return `hace ${minutesAgo} ${minutesAgo === 1 ? 'minuto' : 'minutos'}`;
  }

  if (isToday(date)) {
    const hoursAgo = Math.floor(minutesAgo / 60);
    return `hace ${hoursAgo} ${hoursAgo === 1 ? 'hora' : 'horas'}`;
  }

  if (isYesterday(date)) {
    return 'ayer ' + format(date, 'h:mm a');
  }

  return format(date, 'dd/MM/yyyy h:mm a', {locale: es});
};