import {Request, Response} from 'express';
import {createAppleToken} from '../services/apple.services';

/** Controller to handle Apple Dev Token requests */
export const appleTokenHandler = async (req: Request, res: Response) => {
  try {
    const token = createAppleToken();
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
