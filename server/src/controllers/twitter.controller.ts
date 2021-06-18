import {NextFunction, Request, Response} from 'express';

/** Handler for Twitter auth
 *
 * Adds data ID to req.sessions as req.query is overwritten before reaching the callback
 */
export const twitterAuthHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /**
   * req.query gets overwritten by OAuth
   * Passing data ID to req.sessions enables retrieval in Passport auth callback
   */
  req.session!.dataId = req.query.dataId;
  next();
};

/** Handler for Twitter auth callback. Simply closes the popup. */
export const twitterCallbackHandler = async (req: Request, res: Response) => {
  res.send('<script>window.close()</script>');
};
