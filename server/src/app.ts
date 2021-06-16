import {
  SpotifyAuthorizationData,
  SpotifyAuthorization,
  SpotifyUser,
} from './models';
import express, {Response, Request, Application, NextFunction} from 'express';
import {createCanvas, loadImage, registerFont} from 'canvas';
import {Storage, Bucket} from '@google-cloud/storage';
import {Strategy as TwitterStrategy} from 'passport-twitter';
import Twitter from 'twitter';
import admin from 'firebase-admin';
import axios from 'axios';
import passport from 'passport';
import fs from 'fs';
import qs from 'qs';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import {spotifyPresaveHandler} from './controllers/spotify.controller';
import {appleSaveHandler, appleTokenHandler} from './controllers/apple.controller';

const storage = new Storage();
const app: Application = express();
const port = process.env.PORT || 8080;
const apiVersion = '3.0-portfolio';
let bucket: Bucket;
let twitter: Twitter;

require('dotenv').config();

// if (process.env.ENV === 'prod') {
//   bucket = storage.bucket('bitbird-presave-bucket');
// } else {
//   bucket = storage.bucket('bitbird-presave-dev-bucket');
// }

// passport.serializeUser((user, cb) => {
//   cb(null, user);
// });

// passport.deserializeUser((obj, cb) => {
//   cb(null, obj);
// });

// passport.use(
//   new TwitterStrategy(
//     {
//       consumerKey: process.env.TWITTER_CONSUMER_KEY as string,
//       consumerSecret: process.env.TWITTER_CONSUMER_SECRET as string,
//       callbackURL: `/oauth/callback`,
//       passReqToCallback: true,
//     },
//     async (req, token, tokenSecret, profile, callback) => {
//       twitter = new Twitter({
//         consumer_key: process.env.TWITTER_CONSUMER_KEY as string,
//         consumer_secret: process.env.TWITTER_CONSUMER_SECRET as string,
//         access_token_key: token,
//         access_token_secret: tokenSecret,
//       });

//       const fileDownload = await bucket
//         .file(`tickets/${req.session!.dataId}/DROELOE-ticket-horizontal.jpg`)
//         .download();
//       const fileData = fileDownload[0];

//       twitter.post(
//         'media/upload',
//         {media: fileData},
//         (error: any, media: any, response: any) => {
//           if (!error) {
//             twitter.post(
//               'statuses/update',
//               {
//                 status: `🎟️🎟️🎟️ @DROELOEMUSIC @bitbird https://presave.droeloe.com`,
//                 media_ids: media.media_id_string,
//               },
//               (tweetError: any, tweet: any, tweetResponse: any) => null
//             );
//           } else {
//             throw Error(error);
//           }
//         }
//       );

//       return callback(null, profile);
//     }
//   )
// );

// Use JSON parser
app.use(express.json());
app.use(cors());
app.use(
  require('express-session')({
    secret: 'a matter of perspective',
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Status endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200);
  res.send(`Presave API is running. Version: ${apiVersion}`);
});

// Spotify save endpoint
app.post('/spotify', spotifyPresaveHandler);

// Get Apple Music developer token
app.get('/apple/token', appleTokenHandler);

// Apple Music save endpoint
app.post('/apple', appleSaveHandler);

// app.post('/register', async (req: Request, res: Response) => {
//   if (req.body === undefined) {
//     res
//       .status(400)
//       .json({
//         success: false,
//         message: 'No request body passed',
//       })
//       .send()
//       .end();
//     return;
//   }

//   const name = req.body.name;
//   const origin = req.body.origin;
//   const destination = req.body.destination;
//   const id = req.body.id;
//   const email = req.body.email;

//   const params = [name, origin, destination, id, email];
//   if (params.includes(undefined)) {
//     res
//       .status(400)
//       .json({
//         success: false,
//         message: `Missing request body item. Make sure you pass 'name', 'origin', 'destination', 'email' and 'id'`,
//       })
//       .send()
//       .end();
//     return;
//   }

//   // Log in Firestore
//   const docRef = admin.firestore().collection('ticketData').doc();
//   await docRef.create({
//     name,
//     origin,
//     destination,
//     email,
//     id,
//     createdAt: admin.firestore.FieldValue.serverTimestamp(),
//   });

//   const statsSnapshot = await statsRef.get();
//   const ticketsGenerated = statsSnapshot.data()?.ticketsGenerated;
//   const ticketId = ticketsGenerated + 1;

//   // Create tickets
//   // tslint:disable-next-line: max-line-length
//   const promises = [
//     createVerticalImage(name, origin, destination, ticketId, id),
//     createHorizontalImage(name, origin, destination, ticketId, id),
//   ];

//   await statsRef.set(
//     {
//       ticketsGenerated: increment,
//     },
//     {merge: true}
//   );

//   await Promise.all(promises);

//   res
//     .status(200)
//     .json({
//       success: true,
//       message: `Tickets generated with ID ${id}`,
//     })
//     .send();
// });

// app.get('/tickets', async (req: Request, res: Response) => {
//   const id = req.query.id as string;

//   if (id === undefined || id === null) {
//     res
//       .status(400)
//       .json({
//         success: false,
//         message: 'No data ID passed',
//       })
//       .send();
//     return;
//   }

//   const urls = await getSignedURLs(id);

//   res
//     .status(200)
//     .json({
//       success: true,
//       urls,
//     })
//     .send();
// });

// app.get(
//   '/auth/twitter',
//   (req: Request, res: Response, next: NextFunction) => {
//     /**
//      * req.query gets overwritten by OAuth
//      * Passing data ID to req.sessions enables retrieval in Passport auth callback
//      */
//     req.session!.dataId = req.query.dataId;
//     next();
//   },
//   passport.authenticate('twitter')
// );

// app.get(
//   '/oauth/callback',
//   passport.authenticate('twitter'),
//   (req: Request, res: Response) => {
//     res.send('<script>window.close()</script>');
//   }
// );

// // Start listening on defined port
app.listen(port, () => console.log(`🚀 Server listening on port ${port}`));

// /**
//  * Create a vertical ticket with user defined variables
//  *
//  * Creates canvas with background image with variables overlaid
//  *
//  * Uploads the file to Google Cloud Storage and retrieves a signed URL for download
//  *
//  * @param name UGC: Name of user
//  * @param departing UGC: Departing location of user
//  * @param destination UGC: Destination location of user
//  * @param index nth presave
//  * @param id ID to link to front-end
//  */
// const createVerticalImage = async (
//   name: string,
//   departing: string,
//   destination: string,
//   index: number,
//   id: string
// ) => {
//   const backColor = '#232323';
//   const textColor = '#E9E7DA';

//   const canvas = createCanvas(1080, 1920);
//   const ctx = canvas.getContext('2d');

//   registerFont(`./assets/Ticketing.ttf`, {family: 'Ticketing'});
//   const ticket = await loadImage('./assets/ticket-vertical.jpg');

//   ctx.drawImage(ticket, 0, 0);
//   ctx.font = '52px Ticketing';
//   ctx.textBaseline = 'top';

//   // DRAW NAME
//   const nameWidth = ctx.measureText(name).width;
//   ctx.fillStyle = backColor;
//   ctx.fillRect(246, 606, nameWidth, 44);
//   ctx.fillStyle = textColor;
//   ctx.fillText(name, 248, 600);

//   // DRAW BARCODE
//   const barcode = createBarcode(index);
//   const barcodeWidth = ctx.measureText(barcode).width;
//   ctx.fillStyle = backColor;
//   ctx.fillRect(246, 1398, barcodeWidth, 44);
//   ctx.fillStyle = textColor;
//   ctx.fillText(barcode, 248, 1392);

//   // DRAW DEPARTING
//   ctx.fillStyle = backColor;
//   ctx.fillText(departing, 246, 885);

//   // DRAW DESTINATION
//   ctx.fillStyle = backColor;
//   ctx.fillText(destination, 246, 1078);

//   const buffer = canvas.toBuffer('image/jpeg');
//   const filename = `./output/vert-${id}.jpg`;
//   fs.writeFileSync(filename, buffer);

//   const res = await bucket.upload(filename, {
//     destination: `tickets/${id}/DROELOE-ticket-vertical.jpg`,
//   });

//   fs.unlinkSync(filename);

//   return;
// };

// /**
//  * Create a horizontal ticket with user defined variables
//  *
//  * Creates canvas with background image with variables overlaid
//  *
//  * Uploads the file to Google Cloud Storage and retrieves a signed URL for download
//  *
//  * @param name UGC: Name of user
//  * @param departing UGC: Departing location of user
//  * @param destination UGC: Destination location of user
//  * @param index nth presave
//  * @param id ID to link to front-end
//  */
// const createHorizontalImage = async (
//   name: string,
//   departing: string,
//   destination: string,
//   index: number,
//   id: string
// ) => {
//   const backColor = '#232323';
//   const textColor = '#597BE3';

//   const canvas = createCanvas(1920, 1080);
//   const ctx = canvas.getContext('2d');

//   registerFont(`./assets/Ticketing.ttf`, {family: 'Ticketing'});
//   const ticket = await loadImage('./assets/ticket-horizontal.jpg');

//   ctx.drawImage(ticket, 0, 0);
//   ctx.font = '52px Ticketing';
//   ctx.textBaseline = 'top';

//   // DRAW NAME
//   const nameWidth = ctx.measureText(name).width;
//   ctx.fillStyle = backColor;
//   ctx.fillRect(780, 96, nameWidth, 44);
//   ctx.fillStyle = textColor;
//   ctx.fillText(name, 782, 90);

//   // DRAW BARCODE
//   const barcode = createBarcode(index);
//   ctx.fillStyle = backColor;
//   ctx.fillText(barcode, 505, 950);

//   // DRAW DEPARTING
//   ctx.fillStyle = backColor;
//   ctx.fillText(departing, 505, 468);

//   // DRAW DESTINATION
//   ctx.fillStyle = backColor;
//   ctx.fillText(destination, 505, 668);

//   const buffer = canvas.toBuffer('image/jpeg');
//   const filename = `./output/hor-${id}.jpg`;
//   fs.writeFileSync(filename, buffer);

//   const res = await bucket.upload(filename, {
//     destination: `tickets/${id}/DROELOE-ticket-horizontal.jpg`,
//   });

//   fs.unlinkSync(filename);

//   return;
// };

// /**
//  * Get signed URLs for all files from the given data ID
//  * @param id ID that is used to connect to right user
//  */
// const getSignedURLs = async (id: string) => {
//   const expiration = Date.now() + 604800;
//   const urls: {vertical?: string; horizontal?: string} = {};

//   const [files] = await bucket.getFiles({prefix: `tickets/${id}`});
//   for (const file of files) {
//     const [signedURL] = await file.getSignedUrl({
//       action: 'read',
//       expires: expiration,
//       version: 'v4',
//     });

//     if (file.name.includes('vertical')) {
//       urls.vertical = signedURL;
//     } else {
//       urls.horizontal = signedURL;
//     }
//   }

//   return urls;
// };

// /**
//  * Create barcode string from an ID
//  * @param index ID at the end of the barcode
//  * @returns Barcode string in 0000 0000 0000 0012 format
//  */
// const createBarcode = (index: number) => {
//   const baseString = '0000000000000000';
//   const code = `${baseString}${index}`.slice(-16);
//   const elements = code.match(/.{4}/g);
//   // tslint:disable-next-line: no-non-null-assertion
//   return `${elements![0]} ${elements![1]} ${elements![2]} ${elements![3]}`;
// };
