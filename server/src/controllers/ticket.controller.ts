import {Request, Response} from 'express';
import {
  createHorizontalImage,
  createVerticalImage,
} from '../services/ticket.services';

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
  const ticketId = Math.floor(Math.random() * 1000);

  const ticketPromises = [
    createVerticalImage(name, origin, destination, ticketId, presaveId),
    createHorizontalImage(name, origin, destination, ticketId, presaveId),
  ];
  await Promise.all(ticketPromises);

  res.json({
    success: true,
    message: 'Tickets created',
  });
};
