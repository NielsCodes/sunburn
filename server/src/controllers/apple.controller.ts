import {Request, Response} from 'express';
import {createAppleToken} from '../services/apple.services';

export const appleTokenHandler = async (req: Request, res: Response) => {
  const token = createAppleToken();
  res.send(token);
};
