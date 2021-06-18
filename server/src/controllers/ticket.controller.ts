import {Request, Response} from 'express';
import {
  createHorizontalImage,
  createVerticalImage,
  getSignedURLs,
} from '../services/ticket.services';

/** Controller to handle ticket generation requests */
export const ticketGenerationHandler = async (req: Request, res: Response) => {
  const {name, origin, destination, id: presaveId, email} = req.body;

  if ([name, origin, destination, presaveId, email].includes(undefined)) {
    res.status(400).json({
      success: false,
      message:
        "Invalid request: please include 'name', 'origin', 'destination', 'id' and 'email' properties",
    });
    return;
  }

  // Generate random ticket ID
  // This is instead of incrementing the ticket count from Firestore
  const ticketId = Math.floor(Math.random() * 100000);

  const ticketPromises = [
    createHorizontalImage(name, origin, destination, ticketId, presaveId),
    createVerticalImage(name, origin, destination, ticketId, presaveId),
  ];
  await Promise.all(ticketPromises);

  res.json({
    success: true,
    message: 'Tickets created',
  });
};

/** Controller to handle ticket requests */
export const ticketRetrievalHandler = async (req: Request, res: Response) => {
  const id = req.query.id as string;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'No data ID parameter passed',
    });
    return;
  }

  const urls = await getSignedURLs(id);

  res.json({
    success: true,
    urls,
  });
};
