import {Request, Response} from 'express';
import {
  createAppleDeveloperToken,
  saveTrackToLibrary,
} from '../services/apple.services';

/** Controller to handle Apple Dev Token requests */
export const appleTokenHandler = async (req: Request, res: Response) => {
  try {
    const token = createAppleDeveloperToken();
    res.json({
      success: true,
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/** Controller to handle Apple Music saves */
export const appleSaveHandler = async (req: Request, res: Response) => {
  const {token: musicUserToken} = req.body;

  if (!musicUserToken) {
    res.status(400).json({
      success: false,
      message: 'No music user token passed.',
    });
  }

  try {
    await saveTrackToLibrary(musicUserToken);
    res.json({
      success: true,
      message: 'Saved track on Apple Music',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
