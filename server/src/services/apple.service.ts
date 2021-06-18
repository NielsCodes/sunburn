import jwt from 'jsonwebtoken';
import axios from 'axios';

/**
 * Create signed Apple Developer token
 * @returns Signed token
 */
export const createAppleDeveloperToken = (): string => {
  // Read private Apple Music key
  const privateKey = process.env.APPLE_PRIVATE_KEY;
  if (!privateKey) throw Error('No Apple Private Key environment variable');

  const key = privateKey.replace(/\\n/gm, '\n');

  // Current UNIX timestamp + UNIX timestamp in 6 months
  const currentTime: number = Math.floor(Date.now() / 1000);
  const expiryTime: number = currentTime + 15777000;

  const jwtPayload = {
    iss: process.env.APPLE_KEY_ISSUER,
    iat: currentTime,
    exp: expiryTime,
  };

  return jwt.sign(jwtPayload, key, {
    algorithm: 'ES256',
    keyid: process.env.APPLE_KEY_ID!,
  });
};

/**
 * Save a track to a user's library on Apple Music
 * @param musicUserToken The generated Music User Token
 */
export const saveTrackToLibrary = async (
  musicUserToken: string
): Promise<void> => {
  const trackId = '1526658745';
  const endpoint = `https://api.music.apple.com/v1/me/library?ids[songs]=${trackId}`;
  const devToken = createAppleDeveloperToken();
  const authorization = `Bearer ${devToken}`;

  await axios.post(endpoint, null, {
    headers: {
      Authorization: authorization,
      'Music-User-Token': musicUserToken,
    },
  });
};
