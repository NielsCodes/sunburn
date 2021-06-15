export interface Config {
  source: string;
  mobileSource: string;
}

export interface PresaveResponse {
  success: boolean;
  message?: string;
}

export interface AppleTokenResult {
  success: boolean;
  message: string;
  token?: string;
}

export interface EndMessage {
  title: string;
  content: string;
}
