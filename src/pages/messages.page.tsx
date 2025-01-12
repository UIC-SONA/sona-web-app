import {ChatMessageList} from "@/components/ui/chat/chat-message-list.tsx";

export default function MessagesPage() {
  return <div className="flex h-screen bg-background">
    {/* Sidebar - chats */}
    <aside className="hidden md:flex md:w-[300px] lg:w-[350px] border-r flex-shrink-0 flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Chats</h2>
      </div>
      <div className="flex-1 overflow-auto">
        {/* Lista de chats aquí */}
        <div className="space-y-2 p-4">
          {/* Chat item */}
          <div className="flex items-center space-x-4 p-2 rounded-lg hover:bg-accent cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">John Doe</p>
              <p className="text-sm text-muted-foreground truncate">Último mensaje...</p>
            </div>
          </div>
        </div>
      </div>
    </aside>

    {/* Main chat area */}
    <main className="flex-1 flex flex-col min-w-0">
      {/* Chat header */}
      <header className="border-b p-4 flex items-center">
        <button className="md:hidden mr-4">
          {/* Menú hamburguesa para móvil */}
          <span className="sr-only">Menu</span>
        </button>
        <h3 className="font-semibold">Nombre del Chat</h3>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-auto p-4">
        <ChatMessageList>
          {/* Aquí irían tus ChatBubble components */}
        </ChatMessageList>
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Escribe un mensaje..."
          />
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Enviar
          </button>
        </div>
      </div>
    </main>
  </div>

}