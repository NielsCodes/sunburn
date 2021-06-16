import axios from 'axios';
import {stringify} from 'qs';
import {SpotifyAuthorizationData} from '../models';

/**
 * Get token and refresh tokens from Spotify with Authorization token
 * @param authCode Authentication code to verify user with. Returned by OAuth flow
 * @returns Object with user token, refresh token and scope
 */
export const getAccessToken = async (
  authCode: string
): Promise<SpotifyAuthorizationData> => {
  const endpoint = 'https://accounts.spotify.com/api/token';
  const redirectUrl = process.env.SPOTIFY_REDIRECT_URL;
  const credentials = getEncodedCredentials();
  const authorization = `Basic ${credentials}`;

  // Create request body
  const requestBody = stringify({
    grant_type: 'authorization_code',
    code: authCode,
    redirect_uri: redirectUrl,
  });

  const res = await axios.post(endpoint, requestBody, {
    headers: {
      Authorization: authorization,
    },
  });
  return res.data;
};

/** Creates a base64 encoded string with the Spotify client credentials
 * - Checks whether credentials are present in environment variables
 * - See {@link https://developer.spotify.com/documentation/general/guides/authorization-guide/#client-credentials-flow Spotify API docs - Client Credentials Flow}
 * @returns a base64 encoded string of the client credentials
 */
const getEncodedCredentials = (): string => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (clientId === undefined || clientSecret === undefined) {
    throw Error(
      'Credentials not properly set as environment variables. Ensure the SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are set.'
    );
  }

  const credentials = `${clientId}:${clientSecret}`;
  const buffer = Buffer.from(credentials);
  const encoded = buffer.toString('base64');
  return encoded;
};

/**
 * Save the track to a user's library using their access token
 * @param accessToken the user's access token from the auth flow
 */
export const saveTrackToLibrary = async (
  accessToken: string
): Promise<void> => {
  const trackId = '0i27kJRbxmdzQzhVDJVgzO';
  const endpoint = 'https://api.spotify.com/v1/me/tracks';
  const authorization = `Bearer ${accessToken}`;

  await axios.put(
    endpoint,
    {
      ids: [trackId],
    },
    {
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
    }
  );
};
