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

const apiVersion = '2.000';
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
    if (isFirstSave) {
      await registerMessengerSave(id, email, firstName, lastName);
    }
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

  if (token === null) {
    const msg = 'Error creating Apple token. No environment variable';
    res
      .status(503)
      .json({
        success: false,
        message: msg
      })
      .send();

    console.error(msg);
  }

  res.status(200).json({
    success: true,
    message: 'Token generated. Development...',
    token
  });

});

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
  const devToken: string | null = createAppleToken();

  if (devToken === null) {
    console.error('Received null Apple Developer token');
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to authenticate'
      })
      .send();
    return;
  }

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

app.get('/status', async (req: Request, res: Response) => {

  const key = req.headers.key;
  if (key !== process.env.STATUS_KEY) {
    res
      .status(401)
      .send();
    return;
  }

  const doc = await statsRef.get();
  const stats = doc.data();

  res
    .status(200)
    .json({
      success: true,
      stats
    })
    .send();

});

app.get('/execute', async (req: Request, res: Response) => {

  // Check for header password
  const pass = req.get('pass');
  if (pass !== 'perspective') {
    res
      .status(403)
      .json({
        success: false,
        message: 'Unauthorized request'
      });
    return;
  }

  const spotifySaveStatus = await executeSpotifySaves();
  if (!spotifySaveStatus.success) {
    console.log('Encountered errors while saving to Spotify');
    console.error(spotifySaveStatus);
  } else {
    console.log('Spotify saves processed successfully');
  }

  // const appleSaveStatus = await executeAppleSaves();
  // if (!appleSaveStatus.success) {
  //   console.log('Encountered errors while saving to Apple');
  //   console.error(appleSaveStatus.errors);
  // } else {
  //   console.log('Apple saves processed successfully');
  // }

  res
    .status(200)
    .json({
      spotifySuccess: spotifySaveStatus.success,
      // appleSuccess: appleSaveStatus.success,
    })
    .send();

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

/**
 * Create signed Apple Developer token
 * @returns Signed token
 */
const createAppleToken = (): string | null => {

  // Read private Apple Music key
  const privateKey = process.env.APPLE_PRIVATE_KEY;

  if (privateKey === undefined || privateKey === null) {
    return null;
  }

  const key = privateKey.replace(/\\n/gm, '\n');

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

/**
 * Save track to library for all presaves
 * - Gets access token with refresh token
 * - Follows artist
 * - Adds track to library
 * - Stores status of save in Firestore
 */
const executeSpotifySaves = async (): Promise<ExecutionStatus> => {

  const status: ExecutionStatus = {
    success: false
  };

  // Get all presaves from Firestore
  const presavesDocsSnap = await fb.firestore().collection('presaves').where('hasSaved', '==', false).get();
  const presaves: SpotifyPresave[] = presavesDocsSnap.docs.filter(doc => doc.id !== '--stats--').map(doc => {
    const presave = {
      id: doc.id,
      ...doc.data()
    };

    return presave as SpotifyPresave;
  });

  /** @todo Remove below line and change loop to `presaves` */
  // const presavesTemp = presaves.filter(doc => doc.user.display_name === 'Chris P Bacon');

  const errorFiles: string[] = [];

  const promises: Promise<any>[] = [];

  for (const presave of presaves) {
    // console.log('i');

    // // Check if authorization object exists
    // if ( presave.authorization === undefined || presave.authorization.refresh_token === undefined ) {
    //   errorFiles.push(presave.id);
    // }

    // // Get new access token from refresh token
    // const authData = await getTokenFromRefresh(presave.authorization.refresh_token);
    // if (authData === null) {
    //   errorFiles.push(presave.id);
    // } else {
    //   const accessToken = authData.access_token;


    //   // Follow artist
    //   const followSuccess = await followArtistonSpotify(accessToken);
    //   if (!followSuccess) {
    //     errorFiles.push(presave.id);
    //   }
    //   const saveSuccess = await saveTrackOnSpotify(accessToken);
    //   if (!saveSuccess) {
    //     errorFiles.push(presave.id);
    //   } else {

    //     const logSaveSuccess = await logSpotifySave(presave.id);

    //   }

    // }

    const presaveSuccess = temp(presave);
    promises.push(presaveSuccess);


  }

  Promise.all(promises).then(res => console.log(res)).catch(err => console.error(err));

  if (errorFiles.length > 0) {
    console.log('Encounted issues saving for the following documents:');
    console.error(errorFiles);
    status.errors = errorFiles;
    return status;
  } else {
    status.success = true;
    console.log('executed all saves');
    return status;
  }


  // Return overall status

};


const temp = async (presave: SpotifyPresave): Promise<string> => {

  console.log('i');

  // Check if authorization object exists
  if ( presave.authorization === undefined || presave.authorization.refresh_token === undefined ) {
    console.log(`Presave ID: ${presave.id} not a valid document`);
    return presave.id;
  }

  // Get new access token from refresh token
  const authData = await getTokenFromRefresh(presave.authorization.refresh_token);
  if (authData === null) {
    console.log(`Presave ID: ${presave.id} not a able to get auth`);
    return presave.id;
  } else {
    const accessToken = authData.access_token;

    // Follow artist
    const followSuccess = await followArtistonSpotify(accessToken);
    if (!followSuccess) {
      console.log(`Presave ID: ${presave.id} not able to follow`);
      return presave.id;
    }
    const saveSuccess = await saveTrackOnSpotify(accessToken);
    if (!saveSuccess) {
      console.log(`Presave ID: ${presave.id} not able to save`);
      return presave.id;
    } else {

      const logSaveSuccess = await logSpotifySave(presave.id);
      return 'success';

    }

  }

};

/**
 * Get a new Spotify access token by using a refresh token
 * @param refreshToken Spotify refresh token from Firestore
 * @returns New access information
 */
const getTokenFromRefresh = async (refreshToken: string): Promise<AuthResponse | null> => {

  const endpoint = 'https://accounts.spotify.com/api/token';
  // const redirectUrl = process.env.REDIRECT_URL;

  // Encode API credentials
  const credentials = `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`;
  const authorization = Buffer.from(credentials).toString('base64');

  // Create request body
  const requestBody = qs.stringify({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  // Try calling the Spotify API
  try {

    const tokenRes = await axios.post(endpoint, requestBody, {
      headers: {
        Authorization: `Basic ${authorization}`
      }
    });

    return tokenRes.data as AuthResponse;

  } catch (error) {

    if (error.response.status === 400) {
      console.log('Invalid client error');
      return null;
    } else {
      console.error(error);
    }
  }

  return null;

};

/**
 * Follow artist on Spotify
 * @param token Spotify access token
 */
const followArtistonSpotify = async (token: string): Promise<boolean> => {

  let success = false;

  const artistId = '0u18Cq5stIQLUoIaULzDmA';
  const endpoint = `https://api.spotify.com/v1/me/following?type=artist`;

  const followData = {
    ids: [
      artistId
    ]
  };

  try {
    const followRes = await axios.put(endpoint, followData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (followRes.status !== 204) {
      throw new Error(`Unexpected follow response status: ${followRes.status}`);
    }

    success = true;

  } catch (error) {
    console.log('Following artist failed');
    console.error(error);
  }

  return success;

};

/**
 * Save track to a user's library
 * @param token Spotify access token
 */
const saveTrackOnSpotify = async (token: string): Promise<boolean> => {

  let success = false;

  const trackId = '0cR04cbujsPTTyKUazySY0';
  const endpoint = 'https://api.spotify.com/v1/me/tracks';

  const data = {
    ids: [
      trackId
    ]
  };

  // Try to save track to user libraries
  try {

    const saveRes = await axios.put(endpoint, data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (saveRes.status !== 200) {
      throw new Error(`Unexpected save response status: ${saveRes.status}`);
    }

    success = true;

  } catch (error) {
    console.log('Saving track failed');
    console.error(error);
  }

  return success;

};

/**
 * Update presave document when the track has been saved to the user's library
 * @param documentId Firestore document ID of presave entry
 */
const logSpotifySave = async (documentId: string): Promise<boolean> => {

  let success = false;

  const docRef = fb.firestore().collection('presaves').doc(documentId);

  try {
    await docRef.set({ hasSaved: true }, { merge: true });
    success = true;
  } catch (error) {
    console.log('Error while trying to log Spotify save');
    console.error(error);
  }

  return success;

};


const executeAppleSaves = async (): Promise<ExecutionStatus> => {

  const status: ExecutionStatus = {
    success: false
  };

  const trackId = '1521225747';
  const endpoint = `https://api.music.apple.com/v1/me/library?ids[albums]=${trackId}`;
  const errorFiles = [];

  // Get all Apple presaves
  const presavesDocsSnap = await fb.firestore().collection('applePresaves').get();
  const presaves: ApplePresave[] = presavesDocsSnap.docs.map(doc => {

    const presave = {
      id: doc.id,
      ...doc.data()
    };

    return presave as ApplePresave;
  });

  for (const presave of presaves) {

    const userToken = presave.token;

     // Try to save to library
    try {

      const devToken = createAppleToken();

      const saveRes = await axios.post(endpoint, null, {
        headers: {
          Authorization: `Bearer ${devToken}`,
          'Music-User-Token': userToken
        }
      });

      if (saveRes.status !== 202) {
        errorFiles.push(presave.id);
      } else {
        const logStatus = await logAppleSave(presave.id);
      }

    } catch (error) {
      console.error(error);
      errorFiles.push(presave.id);
    }

  }

  if (errorFiles.length > 0) {
    status.errors = errorFiles;
  } else {
    status.success = true;
  }

  return status;

};


/**
 * Update Apple presave document when the track has been saved to the user's library
 * @param documentId Firestore document ID of presave entry
 */
const logAppleSave = async (documentId: string): Promise<boolean> => {

  let success = false;

  const docRef = fb.firestore().collection('applePresaves').doc(documentId);

  try {
    await docRef.set({ hasSaved: true }, { merge: true });
    success = true;
  } catch (error) {
    console.log('Error while trying to log Apple save');
    console.error(error);
  }

  return success;

};



/** Spotify Presave document interface */
export interface SpotifyPresave {
  id: string;
  authCode: string;
  authorization: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
  };
  user: {
    country: string;
    display_name: string;
    id: string;
  };
  timestamp: string;
  hasSaved: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface ExecutionStatus {
  success: boolean;
  errors?: string[];
}

export interface ApplePresave {
  id: string;
  token: string;
  region: string;
  hasSaved: boolean;
  timestamp: string;
}
