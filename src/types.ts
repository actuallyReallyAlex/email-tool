import EventEmitter from "events";
import { OAuth2Client } from "google-auth-library";

export interface AppState {
  authentication: OAuth2Client;
  menuAction: MenuAction;
  menuActionEmitter: EventEmitter.EventEmitter;
  numberOfAccounts: number;
  outputDirectory: string;
  userEmail: string;
}

export interface Choices {
  blacklist: string[];
  whitelist: string[];
  remove: string[];
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

export interface GetTokenResponse {
  res: {
    config: {
      body: string;
      data: string;
      headers: {
        Accept: string;
        "Content-Type": string;
        "User-Agent": string;
        "x-goog-api-client": string;
      };
      method: string;
      paramsSerializer: () => void;
      responseType: string;
      url: string;
      validateStatus: () => void;
    };
    data: {
      access_token: string;
      expiry_date: number;
      refresh_token: string;
      scope: string;
      token_type: string;
    };
    headers: {};
    request: {};
    status: number;
    statusText: string;
  };
  tokens: {
    access_token: string;
    expiry_date: number;
    refresh_token: string;
    scope: string;
    token_type: string;
  };
}

export type MenuAction =
  | "about"
  | "addAccount"
  | "exit"
  | "findMessages"
  | "selectAccount"
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

export interface Token {
  access_token: string;
  emailAddress: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

interface UnsubscribeDetails {
  http: string | null;
  mailto: string | null;
}
