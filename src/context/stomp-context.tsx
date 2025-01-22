import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo, PropsWithChildren
} from 'react';
import {
  Client,
  IMessage,
  StompSubscription,
  StompHeaders
} from '@stomp/stompjs';


interface StompContextType {
  client: Client | null;
  connected: boolean;
  error: string | null;
  subscribe: (destination: string, callback: (message: IMessage) => void) => StompSubscription | null;
  unsubscribe: (subscription: StompSubscription) => void;
  publish: (destination: string, message: string | object) => void;
  contecting: boolean;
}

interface StompProviderProps extends PropsWithChildren {
  url: string;
  options?: {
    connectHeaders?: StompHeaders;
    reconnectDelay?: number;
    heartbeatIncoming?: number;
    heartbeatOutgoing?: number;
    debug?: (str: string) => void;
  };
}

const StompContext = createContext<StompContextType | null>(null);

export function StompProvider({children, url, options = {}}: Readonly<StompProviderProps>) {
  //
  const [client, setClient] = useState<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contecting, setContecting] = useState(true);

  const closeConecctionHandle = () => {
    setContecting(false);
    setConnected(false);
  }

  const setErrorHandle = (err: string) => {
    setContecting(false);
    setError(err);
  }

  useEffect(() => {
    const stompClient = new Client({
      brokerURL: url,
      connectHeaders: options.connectHeaders || {},
      reconnectDelay: options.reconnectDelay ?? 5000,
      heartbeatIncoming: options.heartbeatIncoming ?? 4000,
      heartbeatOutgoing: options.heartbeatOutgoing ?? 4000,
      debug: options.debug || (() => {
      }),
      onConnect: () => {
        setContecting(false);
        setError(null);
        setConnected(true);
      },
      onDisconnect: closeConecctionHandle,
      onWebSocketClose: closeConecctionHandle,
      onStompError: (frame) => setErrorHandle(`STOMP Error: ${frame.body}`),
      onWebSocketError: (event) => setErrorHandle(`WebSocket Error: ${event.type}`)
    });

    setClient(stompClient);
    stompClient.activate();

    return () => {
      if (stompClient) {
        stompClient.deactivate().then();
      }
    };
  }, [url]);

  const subscribe = useCallback((destination: string, callback: (message: IMessage) => void): StompSubscription | null => {
    if (!client || !connected) return null;
    return client.subscribe(destination, callback);
  }, [client, connected]);

  const unsubscribe = useCallback((subscription: StompSubscription) => {
    if (subscription) {
      subscription.unsubscribe();
    }
  }, []);

  const publish = useCallback((destination: string, message: string | object) => {
    if (!client || !connected) return;
    const body = typeof message === 'string' ? message : JSON.stringify(message);
    client.publish({
      destination,
      body,
      headers: {'content-type': 'application/json'}
    });
  }, [client, connected]);

  const value = useMemo(() => ({
    client,
    connected,
    error,
    subscribe,
    unsubscribe,
    publish,
    contecting
  }), [client, connected, error, subscribe, unsubscribe, publish, contecting]);

  return (
    <StompContext.Provider value={value}>
      {children}
    </StompContext.Provider>
  );
}


export const useStomp = () => {
  const context = useContext(StompContext);
  if (!context) {
    throw new Error('useStomp debe ser usado dentro de un StompProvider');
  }
  return context;
};