import express, {Response, Request, Application} from 'express';
import {Strategy as TwitterStrategy} from 'passport-twitter';
import Twitter from 'twitter';
import passport from 'passport';
import cors from 'cors';
import {spotifyPresaveHandler} from './controllers/spotify.controller';
import {
  appleSaveHandler,
  appleTokenHandler,
} from './controllers/apple.controller';
import {
  ticketGenerationHandler,
  ticketRetrievalHandler,
} from './controllers/ticket.controller';
import {
  twitterAuthHandler,
  twitterCallbackHandler,
} from './controllers/twitter.controller';
import {getFileData} from './services/ticket.service';

if (process.env.ENV !== 'prod') {
  require('dotenv').config();
}

const app: Application = express();
const port = process.env.PORT || 8080;
const apiVersion = '3.0-portfolio';
let twitter: Twitter;

// Use JSON parser
app.use(express.json());
app.use(cors());

// No clue what this does
passport.serializeUser((user, cb) => {
  cb(null, user);
});
passport.deserializeUser((obj, cb) => {
  cb(null, obj);
});

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_KEY!,
      consumerSecret: process.env.TWITTER_SECRET!,
      callbackURL: '/twitter/callback',
      passReqToCallback: true,
    },
    async (req, token, tokenSecret, profile, callback) => {
      twitter = new Twitter({
        consumer_key: process.env.TWITTER_KEY!,
        consumer_secret: process.env.TWITTER_SECRET!,
        access_token_key: token,
        access_token_secret: tokenSecret,
      });

      const fileData = await getFileData(req.session!.dataId);

      twitter.post(
        'media/upload',
        {media: fileData},
        // eslint-disable-next-line
        (error: unknown, media: any, response: unknown) => {
          if (!error) {
            twitter.post(
              'statuses/update',
              {
                // status: '🎟️🎟️🎟️ @DROELOEMUSIC @bitbird https://presave.droeloe.com',
                status:
                  '🎟️🎟️🎟️ I created this @DROELOEMUSIC ticket at https://sunburn.niels.codes, a portfolio project by @NielsCodes',
                media_ids: media.media_id_string,
              },
              // eslint-disable-next-line
              (tweetError: unknown, tweet: unknown, tweetResponse: unknown) =>
                null
            );
          } else {
            throw error;
          }
        }
      );

      return callback(null, profile);
    }
  )
);

// This is necessary for the Twitter share function
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

app.get('/twitter/auth', twitterAuthHandler, passport.authenticate('twitter'));

app.get(
  '/twitter/callback',
  passport.authenticate('twitter'),
  twitterCallbackHandler
);

app.listen(port, () => console.log(`🚀 Server listening on port ${port}`));
