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

export interface Message {
  date: string;
  from: string;
  id: string;
  snippet: string;
  subject: string;
}

export interface SenderDetails {
  messages: Message[];
  name: string;
  numberOfMessages: number;
}
