import {Request, Response} from 'express';
import {getAccessToken, saveTrackToLibrary} from '../services/spotify.service';

/** Controller to handle Spotify presave requests */
export const spotifyPresaveHandler = async (req: Request, res: Response) => {
  const {auth_code: authCode} = req.body;
  if (!authCode) {
    const message = 'Invalid request: missing authorization code';
    res.status(400).json({
      success: false,
      message,
    });
    return;
  }

  try {
    const tokenData = await getAccessToken(authCode);
    const accessToken = tokenData.access_token;
    await saveTrackToLibrary(accessToken);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
    return;
  }

  res.json({
    success: true,
    message: 'Presave successful',
  });
};
