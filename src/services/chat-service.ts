import apiClient from "@/lib/axios.ts";

const resource = '/chat';


export enum ChatMessageType {
  IMAGE = 'IMAGE',
  TEXT = 'TEXT',
  VOICE = 'VOICE',
  CUSTOM = 'CUSTOM'
}

export interface ChatMessage {
  id: string;
  message: string;
  createdAt: Date;
  sentBy: number;
  type: ChatMessageType;
  readBy: ReadBy[];
}

export interface ReadBy {
  participantId: number;
  readAt: Date;
}

export interface ChatMessageSent {
  message: ChatMessage;
  roomId: string;
  requestId: string; // Identificador de la solicitud para el cliente, se envia para confirmar la recepción del mensaje
}

export interface ReadMessages {
  roomId: string;
  readBy: ReadBy;
  messageIds: string[];
}

export enum ChatRoomType {
  PRIVATE = 'PRIVATE', // chat entre dos usuarios, como los chats de whatsapp
  GROUP = 'GROUP' // chat grupal, como los grupos de whatsapp
}

export interface ChatRoom {
  id: string;
  name: string;
  type: ChatRoomType;
  participants: number[];
}

export function parseReadBy(data: any): ReadBy {
  return {
    participantId: data.participantId,
    readAt: new Date(data.readAt)
  }
}

export function parseChatMessage(data: any): ChatMessage {
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    readBy: data.readBy.map(parseReadBy)
  }
}

export function parseChatMessageSent(data: any): ChatMessageSent {
  return {
    message: parseChatMessage(data.message),
    roomId: data.roomId,
    requestId: data.requestId
  }
}

export function parseReadMessages(data: any): ReadMessages {
  return {
    roomId: data.roomId,
    readBy: parseReadBy(data.readBy),
    messageIds: data.messageIds
  }
}

async function sendMessage({roomId, requestId, message}: { roomId: string, requestId: string, message: string }): Promise<ChatMessageSent> {
  const response = await apiClient.post(
    `${resource}/send/${roomId}`,
    message,
    {
      headers: {
        'Content-Type': 'text/plain'
      },
      params: {requestId}
    }
  );

  const data = response.data;

  return parseChatMessageSent(data);
}

async function sendImage({roomId, requestId, image}: { roomId: string, requestId: string, image: File }): Promise<ChatMessageSent> {
  const formData = new FormData();
  formData.append('image', image);
  const response = await apiClient.post(
    `${resource}/send/${roomId}/image`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      params: {requestId}
    }
  );
  return parseChatMessageSent(response.data);
}

async function sendVoice({roomId, requestId, voice}: { roomId: string, requestId: string, voice: File }): Promise<ChatMessageSent> {
  const formData = new FormData();
  formData.append('voice', voice);
  const response = await apiClient.post(
    `${resource}/send/${roomId}/voice`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      params: {requestId}
    }
  );
  return parseChatMessageSent(response.data);
}

async function readMessages({roomId, messageIds}: { roomId: string, messageIds: string[] }): Promise<void> {
  await apiClient.put(
    `${resource}/room/${roomId}/read`,
    messageIds
  );
}

async function rooms(): Promise<ChatRoom[]> {
  const response = await apiClient.get<ChatRoom[]>(
    `${resource}/rooms`
  );
  return response.data;
}

async function room(id: string): Promise<ChatRoom> {
  const response = await apiClient.get<ChatRoom>(
    `${resource}/room/${id}`
  );
  return response.data;
}

async function roomUser(userId: number): Promise<ChatRoom> {
  const response = await apiClient.get<ChatRoom>(
    `${resource}/user/${userId}/room`
  );
  return response.data;
}

async function messages(roomId: string, chunk: number): Promise<ChatMessage[]> {
  const response = await apiClient.get<any[]>(
    `${resource}/room/${roomId}/messages`,
    {
      params: {chunk}
    }
  );
  return response.data.map(parseChatMessage);
}

async function lastMessage(roomId: string): Promise<ChatMessage> {
  const response = await apiClient.get<ChatMessage>(
    `${resource}/room/${roomId}/last-message`
  );
  return parseChatMessage(response.data);
}

async function chunkCount(roomId: string): Promise<number> {
  const response = await apiClient.get<number>(
    `${resource}/room/${roomId}/chunk-count`
  );
  return response.data;
}

export const chatService = {
  sendMessage,
  sendImage,
  sendVoice,
  readMessages,
  rooms,
  room,
  roomUser,
  messages,
  lastMessage,
  chunkCount
};
