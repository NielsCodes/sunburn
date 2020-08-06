import express, { Response, Request, Application } from 'express';
import axios from 'axios';
import * as firebase from 'firebase';
import * as qs from 'qs';
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app: Application = express();
const port = process.env.PORT || 8080;
const fb = firebase.initializeApp({
  apiKey: 'AIzaSyDCF3Bl0KvlDjjsnK5i6TLa9NZjCetgBPE',
  authDomain: 'presave-app.firebaseapp.com',
  databaseURL: 'https://presave-app.firebaseio.com',
  projectId: 'presave-app',
  storageBucket: 'presave-app.appspot.com',
  messagingSenderId: '565477002562',
  appId: '1:565477002562:web:6bb7de375ed1a9e1438cdb'
});

const apiVersion = '1.026';
const statsRef = fb.firestore().collection('presaves').doc('--stats--');
const increment = firebase.firestore.FieldValue.increment(1);

if (process.env.NODE_ENV !== 'production'){
  require('dotenv').config();
}

// Use JSON parser
app.use(express.json());

app.use(cors());

// Status endpoint
app.get('/', (req: Request, res: Response) => {

  res.status(200);
  res.send(`Presave API is running. Version: ${apiVersion}`);

});

// Spotify login endpoint
app.post('/login', async (req: Request, res: Response) => {

  // Get token from Request
  if (req.body.auth_code === undefined) {
    res.status(400);
    const msg = 'Invalid request: missing authorization token';
    console.error(msg);
    res.send(msg);
    return;
  }

  try {

    const authCode = req.body.auth_code;
    const tokenData = await getTokenFromAuth(authCode);

    // If Token retrieval fails, check if this is due to reuse of auth token or not
    if (tokenData === false) {

      // If token retrieval failed, check if value already in Firestore
      const authCodefirstUse = await checkAuthCodeFirstUse(authCode);

      if (authCodefirstUse === true) {

        // This means the auth code was not used before but still failed to retrieve tokens
        res
          .status(400)
          .json({
            success: false,
            message: 'Could not receive Spotify tokens with auth code'
          })
          .send();
        throw Error(`Could not receive Spotify tokens with auth code: ${authCode}`);
      } else {

        // Auth code was used before. Likely due to page refresh
        res
          .status(200)
          .json({
            success: true,
            message: 'Auth token reused. Presave successful'
          })
          .send();
        return;
      }

    }

    const token = tokenData.access_token;

    // Get user data with token
    const userData = await getUser(token);

    // Check if user has presaved before
    const firstPresave = await checkIfFirstSave(userData.id);

    if (!firstPresave) {
      res
        .status(200)
        .json({
          success: true,
          message: 'User has presaved before'
        })
        .send();
      return;
    }

    // Store data in Firestore
    await registerPresave(tokenData, userData, authCode);

    res
      .status(200)
      .json({
        success: true,
        message: 'Presave registered'
      })
      .send();

  } catch (error) {

    console.error(error);

    res
      .status(500)
      .json({
        success: false,
        message: error
      })
      .send();

    throw Error(error);
  }

});

// Messenger presave from Zapier
app.post('/zapier', async (req: Request, res: Response) => {

  console.log(req.body);

  const id = req.body.id;

  if (id === undefined) {
    res.status(400).json({
      success: false,
      message: 'No ID found'
    });
    console.error(`Retrieved call without ID`);
    return;
  }

  const email = req.body.email || 'undefined';
  const firstName = req.body.firstName || 'undefined';
  const lastName = req.body.lastName || 'undefined';

  try {
    const isFirstSave = await checkIfFirstMessengerSave(id);
    if (!isFirstSave) {
      return;
    }
    await registerMessengerSave(id, email, firstName, lastName);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Messenger save registered successfully'
  });

});

// Get Apple Music developer token
app.get('/devtoken', async (req: Request, res: Response) => {

  const token = createAppleToken();

  res.status(200).json({
    success: true,
    message: 'Token generated',
    token
  });

});

// Test route for apple dev key
app.get('/test', (req: Request, res: Response) => {
  const key = process.env.APPLE_PRIVATE_KEY;

  res.json({
    status: 'success',
    key
  });

})

app.post('/apple', async (req: Request, res: Response) => {

  // Get token from Request
  if (req.body.token === undefined) {
    res.status(400);
    const msg = 'Invalid request: Missing User token';
    console.error(msg);
    res.send(msg);
    return;
  }

  // Get locale from token
  const userToken: string = req.body.token;
  const devToken: string = createAppleToken();

  try {
    const region = await getLocalization(userToken, devToken);

    await registerApplePresave(userToken, region);

    res.status(200);
    res.json({
      success: true,
      message: 'Saved Apple presave successfully'
    });

  } catch (error) {
    res.status(500);
    res.send('Something went wrong');
    console.error(error);
    throw new Error(error);
  }

});


// Start listening on defined port
app.listen(port, () => console.log(`🚀 Server listening on port ${port}`));



// Get token and refresh tokens from Spotify with Authorization token
const getTokenFromAuth = async (code: string) => {

  const endpoint = 'https://accounts.spotify.com/api/token';
  const redirectUrl = process.env.REDIRECT_URL;

  // Encode API credentials
  const credentials = `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`;
  const authorization = Buffer.from(credentials).toString('base64');

  // Create request body
  const requestBody = qs.stringify({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUrl
  });

  // Try calling the Spotify API
  try {

    const tokenRes = await axios.post(endpoint, requestBody, {
      headers: {
        Authorization: `Basic ${authorization}`
      }
    });

    return tokenRes.data;

  } catch (error) {

    if (error.response.status === 400) {
      console.log('Invalid client error');
      return false;
    } else {
      console.error(error);
      throw new Error(error);
    }
  }

};

// Get user data with token
const getUser = async (token: string) => {

  const endpoint = 'https://api.spotify.com/v1/me';

  try {

    const userRes = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return userRes.data;

  } catch (error) {
    console.error(error);
    throw new Error(error);
  }

};

// Check if the user has presaved
const checkIfFirstSave = async (id: string) => {

  const userDocsSnap = await fb.firestore().collection('presaves').where('user.id', '==', id).get();
  const size = userDocsSnap.size;

  if (size > 0) {
    return false;
  } else {
    return true;
  }

};

// Check if auth token was already used
const checkAuthCodeFirstUse = async (authCode: string) => {

  const authCodeSnap = await fb.firestore().collection('presaves').where('authCode', '==', authCode).get();
  const size = authCodeSnap.size;

  if (size > 0) {
    return false;
  } else {
    return true;
  }

};

// Check if the user has presaved with Messenger
const checkIfFirstMessengerSave = async (id: number) => {

  const userDocsSnap = await fb.firestore().collection('messengerSaves').where('id', '==', id).get();
  const size = userDocsSnap.size;

  if (size > 0) {
    return false;
  } else {
    return true;
  }

};

// Register presave in Firestore
const registerPresave = async (authData: object, userData: object, authCode: string) => {
  const docData = {
    authorization: authData,
    user: userData,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    hasSaved: false,
    authCode
  };

  const docRef = fb.firestore().collection('presaves').doc();

  const batch = fb.firestore().batch();
  batch.set(docRef, docData);
  batch.set(statsRef, {
    saves: increment,
    spotify: increment
  }, { merge: true });
  return batch.commit();

};

// Register Messenger signup in Firestore
const registerMessengerSave = async (id: string, email: string, firstName: string, lastName: string) => {

  const docData = {
    id,
    email,
    firstName,
    lastName,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  const docRef = fb.firestore().collection('messengerSaves').doc();

  const batch = fb.firestore().batch();
  batch.set(docRef, docData);
  batch.set(statsRef, {
    saves: increment,
    messenger: increment
  }, { merge: true });
  return batch.commit();
};

// Register Apple Presave in Firestore
const registerApplePresave = async (token: string, region: string) => {

  const docData = {
    token,
    region,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    hasSaved: false
  };

  const docRef = fb.firestore().collection('applePresaves').doc();

  const batch = fb.firestore().batch();
  batch.set(docRef, docData);
  batch.set(statsRef, {
    saves: increment,
    apple: increment
  }, { merge: true });
  return batch.commit();

};

// Create signed Apple Developer token
const createAppleToken = () => {
  // Read private Apple Music key
  const key = process.env.APPLE_PRIVATE_KEY;

  // Current UNIX timestamp + UNIX timestamp in 6 months
  const currentTime: number = Math.floor(Date.now() / 1000);
  const expiryTime: number = currentTime + 15777000;

  const jwtPayload = {
    iss: '8FCF4L99M8',
    iat: currentTime,
    exp: expiryTime
  };

  const jwtOptions = {
    algorithm: 'ES256',
    keyid: '2XNHW5P3K5',
  };

  return jwt.sign(jwtPayload, key, jwtOptions);
};


// Get localization for Apple Music user
const getLocalization = async (userToken: string, devToken: string) => {

  const endpoint = 'https://api.music.apple.com/v1/me/storefront';

  try {

    const res = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${devToken}`,
        'Music-User-Token': userToken
      }
    });

    return res.data.data[0].id;

  } catch (error) {

    throw new Error(error);

  }

};
