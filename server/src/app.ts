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
import {
  appleSaveHandler,
  appleTokenHandler,
} from './controllers/apple.controller';
import {ticketGenerationHandler, ticketRetrievalHandler} from './controllers/ticket.controller';

require('dotenv').config();

const app: Application = express();
const port = process.env.PORT || 8080;
const apiVersion = '3.0-portfolio';
// let twitter: Twitter;

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

// Ticket generation endpoint
app.post('/ticket', ticketGenerationHandler);

// Ticket retrieval endpoint
app.get('/ticket', ticketRetrievalHandler);

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
