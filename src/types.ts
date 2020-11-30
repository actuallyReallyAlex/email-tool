import EventEmitter from "events";

export interface AppState {
  menuAction: MenuAction;
  menuActionEmitter: EventEmitter.EventEmitter;
  userEmail: string;
}

export interface Choices {
  blacklist: string[];
  whitelist: string[];
  remove: string[]
}

export interface Credentials {
  installed: {
    client_id: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

export type MenuAction =
  | "about"
  | "exit"
  | "findMessages"
  | "sortMessages"
  | "unsubscribe"
  | null;

export interface Message {
  date: string;
  from: string;
  id: string;
  snippet: string;
  subject: string;
  unsubscribeUrl: string | null;
}

export interface SenderDetails {
  id: string;
  messages: Message[];
  name: string;
  numberOfMessages: number;
  unsubscribe: UnsubscribeDetails;
  unsubscribeUrl: string | null;
}

interface UnsubscribeDetails {
  http: string | null;
  mailto: string | null;
}
