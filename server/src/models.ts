/** Data returned from Spotify upon authorization */
export interface SpotifyAuthorizationData {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

/** Spotify authorization function result */
export interface SpotifyAuthorization {
  success: boolean;
  data?: SpotifyAuthorizationData;
  error?: any;
}

/** Spotify Presave document interface */
export interface SpotifyPresave {
  id: string;
  authCode: string;
  authorization: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
  };
  user: {
    country: string;
    display_name: string;
    id: string;
  };
  timestamp: string;
  hasSaved: boolean;
}

export interface ApplePresave {
  id: string;
  token: string;
  region: string;
  hasSaved: boolean;
  timestamp: string;
}

export interface ExecutionStatus {
  success: boolean;
  errors?: string[];
}
