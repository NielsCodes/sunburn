import jwt from 'jsonwebtoken';

/**
 * Create signed Apple Developer token
 * @returns Signed token
 */
export const createAppleToken = (): string => {
  // Read private Apple Music key
  const privateKey = process.env.APPLE_PRIVATE_KEY;
  if (!privateKey) throw Error('No Apple Private Key environment variable');

  const key = privateKey.replace(/\\n/gm, '\n');
  console.log({
    key,
    privateKey,
  });

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
