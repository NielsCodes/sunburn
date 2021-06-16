import {Request, Response} from 'express';
import {getAccessToken} from '../services/spotify.service';

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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
};
