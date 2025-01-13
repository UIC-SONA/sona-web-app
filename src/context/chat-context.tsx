import {
  ChatMessage,
  ChatMessageSent, ChatMessageType,
  ChatRoom,
  chatService,
  parseChatMessageSent,
  parseReadMessages, ReadBy,
  ReadMessages
} from "@/services/chat-service.ts";
import {useStomp} from "@/context/stomp-context.tsx";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  User,
  userService
} from "@/services/user-service.ts";


export enum StatusMessage {
  DELIVERED = 'DELIVERED',
  SENDING = 'SENDING',
  UNDELIVERED = 'UNDELIVERED',
}

export interface Message extends Omit<ChatMessage, 'sentBy' | 'readBy'> {
  sentBy: User;
  readBy: {
    participant: User;
    readAt: Date;
  }[];
  status: StatusMessage;
}

export interface Room extends Omit<ChatRoom, 'participants'> {
  lastMessage: Message;
  participants: User[];
}

type RoomChunkState = {
  current: number; // Último chunk cargado (inicia desde el total y decrece)
  total: number;   // Total de chunks disponibles
};

const parseReadBy = (readBy: ReadBy, users: { [key: number]: User }): { participant: User, readAt: Date } => {
  return {
    participant: users[readBy.participantId],
    readAt: readBy.readAt
  };
}

type SendRoomMessage = (roomId: string, message: string | File, type: ChatMessageType) => Promise<void>;
type ReadRoomMessages = (roomId: string) => Promise<void>;

interface ChatContextType {
  loadingChat: boolean;
  rooms: Room[];
  users: { [key: number]: User };
  messages: { [roomId: string]: Message[] };
  loadMessages: (roomId: string) => Promise<void>;
  sendMessage: SendRoomMessage;
  readMessages: ReadRoomMessages;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({children, user}: Readonly<PropsWithChildren & { user: User }>) {

  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<{ [key: number]: User }>({});
  const [messages, setMessages] = useState<{ [roomId: string]: Message[] }>({});
  const [loading, setLoading] = useState(true);
  const [chunkState, setChunkState] = useState<{ [roomId: string]: RoomChunkState }>({});
  const [loadingRooms, setLoadingRooms] = useState<{ [roomId: string]: boolean }>({});
  const [requestIds, setRequestIds] = useState<string[]>([]);


  const loadChat = async () => {
    setLoading(true);

    const chatRooms = await chatService.rooms();
    const participants = chatRooms.map(room => room.participants).flat();
    const users = await userService.mapUsers(participants);

    const rooms: Room[] = await Promise.all(chatRooms.map(async room => {
      const lastMessage = await chatService.lastMessage(room.id);
      const sentBy = users[lastMessage.sentBy];
      const readBy = lastMessage.readBy.map(readBy => ({
        participant: users[readBy.participantId],
        readAt: readBy.readAt
      }));

      return {
        ...room,
        participants: room.participants.map(userId => users[userId]),
        lastMessage: {
          ...lastMessage,
          sentBy,
          readBy,
          status: StatusMessage.DELIVERED
        }
      };
    }));

    setUsers(users);
    setRooms(rooms);
    setLoading(false);
  };


  const setLoadingMessages = (roomId: string, loading: boolean) => {
    setLoadingRooms(prev => ({...prev, [roomId]: loading}));
  }

  const loadMessages = async (roomId: string) => {
    if (loadingRooms[roomId]) return;

    setLoadingMessages(roomId, true);

    try {
      // Verificar o inicializar el estado de los chunks
      let roomChunk = chunkState[roomId];
      if (!roomChunk) {
        const totalChunks = await chatService.chunkCount(roomId); // Obtener total
        roomChunk = {current: totalChunks, total: totalChunks};
        setChunkState(prev => ({...prev, [roomId]: roomChunk}));
      }

      // Si ya no hay más chunks para cargar, salir
      if (roomChunk.current <= 0) return;

      // Cargar mensajes del chunk actual
      const chatMessages = await chatService.messages(roomId, roomChunk.current);

      const roomMessages: Message[] = chatMessages.map(message => {
        const sentBy = users[message.sentBy];
        const readBy = message.readBy.map(readBy => parseReadBy(readBy, users));
        return {
          ...message,
          sentBy,
          readBy,
          status: StatusMessage.DELIVERED
        };
      });

      // Actualizar mensajes y estado del chunk
      setMessages(prev => ({
        ...prev,
        [roomId]: [...roomMessages, ...(prev[roomId] || [])], // Agregar al inicio
      }));

      setChunkState(prev => ({
        ...prev,
        [roomId]: {
          ...prev[roomId],
          current: prev[roomId]?.current - 1, // Decrementar chunk actual
        },
      }));
    } catch (error) {
      console.error(`Error al cargar mensajes para la sala ${roomId}:`, error);
    } finally {
      setLoadingMessages(roomId, false);
    }
  };

  useReceiveMessage(user.id, ({roomId, message, requestId}) => {

    const sentBy = users[message.sentBy];
    const readBy = message.readBy.map(readBy => parseReadBy(readBy, users));

    const received: Message = {
      ...message,
      sentBy,
      readBy,
      status: StatusMessage.DELIVERED
    };

    if (requestIds.includes(requestId)) {
      setRequestIds(prev => prev.filter(id => id !== requestId));
    } else {
      setMessages(prev => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), received]
      }));
    }

    setRooms(prev => prev.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        lastMessage: received
      };
    }).sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()));

  });

  useReadMessage(user.id, ({roomId, readBy, messageIds}) => {
    setMessages(prev => ({
      ...prev,
      [roomId]: prev[roomId].map(message => {
        if (!messageIds.includes(message.id)) {
          return message;
        }
        return {
          ...message,
          readBy: [...message.readBy, parseReadBy(readBy, users)]
        };
      })
    }));

    setRooms(prev => prev.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        lastMessage: {
          ...room.lastMessage,
          readBy: [...room.lastMessage.readBy, parseReadBy(readBy, users)]
        }
      };
    }));
  });

  const sendMessage = async (roomId: string, message: string | File, type: ChatMessageType) => {
    if (type === ChatMessageType.CUSTOM) {
      console.error('Custom message type not supported');
      return;
    }

    const requestId = crypto.randomUUID().toString();
    setRequestIds(prev => [...prev, requestId]);

    const messageToSent: Message = {
      id: "",
      message: typeof message === 'string' ? message : "Enviando...",
      createdAt: new Date(),
      type,
      sentBy: user,
      readBy: [],
      status: StatusMessage.SENDING
    };

    setMessages(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), messageToSent]
    }));


    try {

      let chatMessage: ChatMessageSent;

      if (type === ChatMessageType.TEXT && typeof message === 'string') {
        chatMessage = await chatService.sendMessage({roomId, requestId, message});
      } else if (type === ChatMessageType.VOICE && message instanceof File) {
        chatMessage = await chatService.sendVoice({roomId, requestId, voice: message});
      } else if (type === ChatMessageType.IMAGE && message instanceof File) {
        chatMessage = await chatService.sendImage({roomId, requestId, image: message});
      } else {
        console.error('Invalid message type or message');
        return;
      }

      const sentMessage: Message = {
        ...chatMessage.message,
        sentBy: user,
        readBy: [],
        status: StatusMessage.DELIVERED
      };

      setMessages(prev => ({
        ...prev,
        [roomId]: prev[roomId].map(message => {
          if (message !== messageToSent) return message;
          return sentMessage;
        })
      }));

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => ({
        ...prev,
        [roomId]: prev[roomId].map(message => {
          if (message !== messageToSent) return message;

          return message === messageToSent ? {
            ...message,
            status: StatusMessage.UNDELIVERED
          } : message;
        })
      }));
    }
  }

  const readMessages = async (roomId: string) => {
    const roomMessages = messages[roomId] || [];
    const unreads: string[] = [];
    for (let i = roomMessages.length - 1; i >= 0; i--) {
      const message = roomMessages[i];
      if (message.sentBy.id === user.id) {
        continue;
      }
      if (message.readBy.some(readBy => readBy.participant.id === user.id)) {
        break;
      }
      unreads.push(message.id);
    }

    if (unreads.length > 0) {
      await chatService.readMessages({roomId, messageIds: unreads});
    }
  }

  useEffect(() => {
    loadChat().then();
  }, []);

  const value = useMemo(() => ({
    rooms,
    users,
    messages,
    loadingChat: loading,
    loadMessages,
    sendMessage,
    readMessages,
  }), [rooms, users, messages, loading]);


  return <ChatContext.Provider value={value}>
    {children}
  </ChatContext.Provider>;
}


export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

export type SendMessage = (message: string | File, type: ChatMessageType) => Promise<void>;

interface UseChatRoomReturn {
  room: Room;
  messages: Message[];
  loadingMessages: boolean;
  sendMessage: SendMessage;
  readMessages: () => Promise<void>;
}

export function useChatRoom(roomId: string): UseChatRoomReturn {
  const {rooms, messages, sendMessage, loadMessages, loadingChat, readMessages} = useChat();
  const [loading, setLoading] = useState(true);

  const room = rooms.find(room => room.id === roomId) as Room;
  const roomMessages = messages[roomId] || [];


  useEffect(() => {
    if (loadingChat) return;
    loadMessages(roomId).finally(() => setLoading(false));
  }, [roomId, loadingChat]);

  const sendChatMessage = async (message: string | File, type: ChatMessageType) => {
    await sendMessage(roomId, message, type);
  }
  const readChatMessages = async () => {
    await readMessages(roomId);
  }

  return {
    room,
    messages: roomMessages,
    loadingMessages: loading,
    sendMessage: sendChatMessage,
    readMessages: readChatMessages
  };
}

type OnReceiveMessage = (message: ChatMessageSent) => void;
type OnReadMessage = (readMessage: ReadMessages) => void;

export function useReceiveMessage(participantId: number | undefined, onReceiveMessage: OnReceiveMessage) {
  const {subscribe, unsubscribe, connected} = useStomp();

  useEffect(() => {
    if (!connected || !participantId) return;

    const messageInboxTopic = `/topic/chat.inbox.${participantId}`;
    const subscription = subscribe(messageInboxTopic, (message) => {
      try {
        const parsedMessage = parseChatMessageSent(JSON.parse(message.body));
        onReceiveMessage(parsedMessage);
      } catch (error) {
        console.error('Error parsing incoming message:', error);
      }
    });

    return () => {
      if (subscription) unsubscribe(subscription);
    };
  }, [connected, participantId, onReceiveMessage, subscribe, unsubscribe]);

  return {connected};
}

export function useReadMessage(participantId: number | undefined, onReadMessage: OnReadMessage) {
  const {subscribe, unsubscribe, connected} = useStomp();

  useEffect(() => {
    if (!connected || !participantId) return;

    const readMessagesTopic = `/topic/chat.inbox.${participantId}.read`;
    const subscription = subscribe(readMessagesTopic, (message) => {
      try {
        const parsedReadMessage = parseReadMessages(JSON.parse(message.body));
        onReadMessage(parsedReadMessage);
      } catch (error) {
        console.error('Error parsing read message:', error);
      }
    });

    return () => {
      if (subscription) {
        unsubscribe(subscription);
      }
    };
  }, [connected, participantId, onReadMessage, subscribe, unsubscribe]);

  return {connected};
}